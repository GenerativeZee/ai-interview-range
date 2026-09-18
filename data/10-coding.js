PREP.push({
id:"coding", n:"10", title:"Coding & SQL", icon:"{ }",
blurb:"Implement-from-scratch problems that actually come up in AI/DS loops, plus the SQL patterns every data science screen uses. Write these out by hand until they're muscle memory.",
topics:[
{
title:"Implement from scratch",
items:[
{q:"Implement scaled dot-product self-attention in NumPy",
roles:["aie"],lvl:"senior",tags:["code","transformers","high-freq"],
a:`<pre><code>import numpy as np

def softmax(x, axis=-1):
    # subtract the max for numerical stability — always do this
    x = x - np.max(x, axis=axis, keepdims=True)
    e = np.exp(x)
    return e / np.sum(e, axis=axis, keepdims=True)

def self_attention(X, W_q, W_k, W_v, mask=None):
    """
    X:   (n, d_model)   token embeddings
    W_*: (d_model, d_k)
    returns (n, d_k) contextual embeddings
    """
    Q = X @ W_q                      # (n, d_k)
    K = X @ W_k
    V = X @ W_v

    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)  # (n, n)  ← the sqrt keeps softmax responsive

    if mask is not None:             # causal mask: True where NOT allowed
        scores = np.where(mask, -1e9, scores)

    weights = softmax(scores, axis=-1)
    return weights @ V, weights

def causal_mask(n):
    # position i may not attend to j > i
    return np.triu(np.ones((n, n), dtype=bool), k=1)

def multi_head_attention(X, Wq, Wk, Wv, Wo, n_heads):
    """Wq/Wk/Wv: (d_model, d_model);  Wo: (d_model, d_model)"""
    n, d_model = X.shape
    d_head = d_model // n_heads
    Q, K, V = X @ Wq, X @ Wk, X @ Wv

    # (n, d_model) -> (n_heads, n, d_head)
    split = lambda M: M.reshape(n, n_heads, d_head).transpose(1, 0, 2)
    Q, K, V = split(Q), split(K), split(V)

    scores  = Q @ K.transpose(0, 2, 1) / np.sqrt(d_head)   # (h, n, n)
    weights = softmax(scores, axis=-1)
    heads   = weights @ V                                   # (h, n, d_head)

    concat = heads.transpose(1, 0, 2).reshape(n, d_model)
    return concat @ Wo</code></pre>
<p><strong>Points to say while writing it:</strong> subtract the max in softmax or you overflow on large logits; the mask value must be a large negative number <em>before</em> softmax, not zero after; d_head = d_model / n_heads keeps multi-head roughly the same cost as single-head; and the (n, n) score matrix is the quadratic memory term FlashAttention exists to avoid materializing.</p>`},

{q:"Implement RRF, cosine similarity, and a simple retriever",
roles:["aie"],lvl:"core",tags:["code","rag","high-freq"],
a:`<pre><code>from collections import defaultdict
import numpy as np

def reciprocal_rank_fusion(*ranked_lists, K=60, weights=None):
    """Fuse ranked lists by rank only — no score normalization needed."""
    scores = defaultdict(float)
    w = weights or [1.0] * len(ranked_lists)
    for wi, ranked in zip(w, ranked_lists):
        for rank, item in enumerate(ranked, start=1):
            scores[item] += wi / (rank + K)
    ordered = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    return ordered, [item for item, _ in ordered]


def cosine_similarity(a, b):
    """a: (d,)  b: (n, d)  -> (n,)"""
    a_norm = a / (np.linalg.norm(a) + 1e-10)
    b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-10)
    return b_norm @ a_norm


def top_k_search(query_vec, index, k=5, filter_fn=None):
    """Brute-force search with metadata pre-filtering."""
    ids = [i for i, meta in enumerate(index["meta"])
           if filter_fn is None or filter_fn(meta)]
    if not ids:
        return []
    sims = cosine_similarity(query_vec, index["vectors"][ids])
    order = np.argsort(-sims)[:k]
    return [(ids[j], float(sims[j])) for j in order]


def mmr(query_vec, cand_vecs, cand_ids, k=5, lambda_=0.7):
    """Maximal Marginal Relevance — balance relevance against diversity."""
    rel = cosine_similarity(query_vec, cand_vecs)
    selected, remaining = [], list(range(len(cand_ids)))
    while len(selected) < k and remaining:
        best, best_score = None, -np.inf
        for i in remaining:
            redundancy = 0.0
            if selected:
                sims = cosine_similarity(cand_vecs[i], cand_vecs[selected])
                redundancy = float(np.max(sims))
            score = lambda_ * rel[i] - (1 - lambda_) * redundancy
            if score > best_score:
                best, best_score = i, score
        selected.append(best)
        remaining.remove(best)
    return [cand_ids[i] for i in selected]</code></pre>
<p><strong>Note the pre-filter in <code>top_k_search</code>:</strong> filtering before similarity is exact but expensive; a real ANN index has to do this inside the graph traversal, which is why filtered vector search is genuinely hard. Mention that.</p>`},

{q:"Implement gradient descent, logistic regression, and the metrics by hand",
roles:["ds"],lvl:"core",tags:["code","ml"],
a:`<pre><code>import numpy as np

def sigmoid(z):
    # stable for large |z|
    return np.where(z >= 0, 1/(1+np.exp(-z)), np.exp(z)/(1+np.exp(z)))

class LogisticRegression:
    def __init__(self, lr=0.1, epochs=1000, l2=0.0):
        self.lr, self.epochs, self.l2 = lr, epochs, l2

    def fit(self, X, y):
        n, d = X.shape
        self.w = np.zeros(d)
        self.b = 0.0
        for _ in range(self.epochs):
            z = X @ self.w + self.b
            p = sigmoid(z)
            # gradient of BCE: the sigmoid derivative cancels, leaving (p - y)
            dw = (X.T @ (p - y)) / n + self.l2 * self.w
            db = np.mean(p - y)
            self.w -= self.lr * dw
            self.b -= self.lr * db
        return self

    def predict_proba(self, X):
        return sigmoid(X @ self.w + self.b)

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X) >= threshold).astype(int)


def confusion(y_true, y_pred):
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    return tp, fp, fn, tn

def prf(y_true, y_pred):
    tp, fp, fn, tn = confusion(y_true, y_pred)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall    = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2*precision*recall/(precision+recall) if precision+recall else 0.0
    return precision, recall, f1

def roc_auc(y_true, scores):
    """Rank-based AUC — the probability a random positive outranks a random negative."""
    order = np.argsort(scores)
    ranks = np.empty(len(scores), dtype=float)
    ranks[order] = np.arange(1, len(scores) + 1)
    n_pos = float(np.sum(y_true == 1))
    n_neg = float(np.sum(y_true == 0))
    if n_pos == 0 or n_neg == 0:
        return float("nan")
    # Mann-Whitney U formulation
    return (np.sum(ranks[y_true == 1]) - n_pos*(n_pos+1)/2) / (n_pos*n_neg)</code></pre>
<p><strong>The detail that earns credit:</strong> in <code>fit</code>, the gradient is <code>X.T @ (p - y)</code> with no sigmoid-derivative factor. Point out that this is because the sigmoid derivative cancels against the cross-entropy derivative — it's exactly why cross-entropy is the right loss for a sigmoid output and MSE is not.</p>`},

{q:"Implement a token-aware chunker, retry with backoff, and a rate limiter",
roles:["aie","agentic"],lvl:"senior",tags:["code","production"],
a:`<pre><code>import time, random, threading
from typing import Callable, List

# ---------- recursive, token-aware chunking ----------
def recursive_chunk(text: str, max_tokens: int, overlap: int,
                    count: Callable[[str], int],
                    separators=("\\n\\n", "\\n", ". ", " ", "")) -> List[str]:
    """Split on the largest natural boundary that fits; recurse if still too big."""
    if count(text) <= max_tokens:
        return [text]

    sep = next((s for s in separators
                if s and s in text), separators[-1])

    if sep == "":                                  # hard character cut
        approx = max(1, len(text) * max_tokens // max(1, count(text)))
        return [text[i:i+approx] for i in range(0, len(text), approx)]

    pieces, buf, out = text.split(sep), "", []
    for p in pieces:
        cand = (buf + sep + p) if buf else p
        if count(cand) <= max_tokens:
            buf = cand
        else:
            if buf:
                out.append(buf)
            # the single piece may still exceed the budget -> recurse
            out.extend(recursive_chunk(p, max_tokens, overlap, count,
                                       separators[separators.index(sep)+1:])
                       if count(p) > max_tokens else [p])
            buf = ""
    if buf:
        out.append(buf)

    if overlap > 0 and len(out) > 1:                # add tail overlap
        merged = [out[0]]
        for prev, cur in zip(out, out[1:]):
            tail = prev[-overlap*4:]                # ~4 chars per token
            merged.append(tail + cur)
        out = merged
    return out


# ---------- retry with exponential backoff and jitter ----------
def retry(fn, attempts=5, base=0.5, cap=30.0, retry_on=(Exception,)):
    for i in range(attempts):
        try:
            return fn()
        except retry_on as e:
            if i == attempts - 1:
                raise
            # full jitter: prevents synchronized retry storms
            delay = min(cap, base * 2 ** i)
            time.sleep(random.uniform(0, delay))


# ---------- token bucket rate limiter ----------
class TokenBucket:
    def __init__(self, rate_per_sec: float, capacity: float):
        self.rate, self.capacity = rate_per_sec, capacity
        self.tokens, self.last = capacity, time.monotonic()
        self.lock = threading.Lock()

    def acquire(self, n=1.0, block=True) -> bool:
        while True:
            with self.lock:
                now = time.monotonic()
                self.tokens = min(self.capacity,
                                  self.tokens + (now - self.last) * self.rate)
                self.last = now
                if self.tokens >= n:
                    self.tokens -= n
                    return True
                deficit = (n - self.tokens) / self.rate
            if not block:
                return False
            time.sleep(deficit)


# ---------- LRU + semantic cache sketch ----------
from collections import OrderedDict

class SemanticCache:
    def __init__(self, embed, max_size=1000, threshold=0.97):
        self.embed, self.threshold = embed, threshold
        self.store = OrderedDict()        # key -> (vector, value)
        self.max_size = max_size

    def _key(self, query, scope):         # scope MUST include tenant/user
        return (scope, query.strip().lower())

    def get(self, query, scope):
        k = self._key(query, scope)
        if k in self.store:               # exact hit first — free and safe
            self.store.move_to_end(k)
            return self.store[k][1]
        qv = self.embed(query)
        for key, (vec, val) in self.store.items():
            if key[0] != scope:           # never cross scopes
                continue
            if float(qv @ vec) >= self.threshold:
                return val
        return None

    def put(self, query, scope, value):
        k = self._key(query, scope)
        self.store[k] = (self.embed(query), value)
        self.store.move_to_end(k)
        if len(self.store) > self.max_size:
            self.store.popitem(last=False)</code></pre>
<p><strong>Talk through the choices:</strong> full jitter rather than fixed backoff prevents synchronized retry storms across replicas; the token bucket allows bursts up to capacity while enforcing a long-run rate, which is what API rate limits actually look like; and the semantic cache keys on tenant scope because a cache that ignores scope is a cross-tenant data leak, not a performance feature.</p>`}
]},

{
title:"SQL",
items:[
{q:"Second highest salary, and the three ranking functions",
roles:["ds"],lvl:"core",tags:["sql","high-freq"],
a:`<pre><code>-- Approach 1: DENSE_RANK (handles ties correctly, generalizes to Nth)
SELECT DISTINCT salary
FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
      FROM employees) t
WHERE rnk = 2;

-- Approach 2: correlated subquery (works on ancient engines)
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Approach 3: OFFSET (careful: does NOT handle ties)
SELECT DISTINCT salary FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;</code></pre>
<p><strong>The follow-up is always ties.</strong> If two people earn the top salary, does "second highest" mean the second distinct value or the second person? Ask. That question is the actual test.</p>
<pre><code>salary:   100, 100, 90, 80

ROW_NUMBER()   → 1, 2, 3, 4     unique, arbitrary tie-break
RANK()         → 1, 1, 3, 4     ties share, then SKIPS
DENSE_RANK()   → 1, 1, 2, 3     ties share, NO gap</code></pre>
<p><strong>Use:</strong> ROW_NUMBER for deduplication and "one row per group"; RANK for competition-style rankings; DENSE_RANK for "the Nth distinct value."</p>`},

{q:"The SQL patterns worth drilling",
roles:["ds"],lvl:"core",tags:["sql","high-freq"],
a:`<p><strong>Top N per group</strong> — the most-asked window function question:</p>
<pre><code>SELECT * FROM (
  SELECT e.*, ROW_NUMBER() OVER (PARTITION BY dept_id
                                 ORDER BY salary DESC) AS rn
  FROM employees e
) t WHERE rn <= 3;</code></pre>
<p><strong>Deduplicate, keeping the latest:</strong></p>
<pre><code>WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id, event_type
                               ORDER BY updated_at DESC) AS rn
  FROM events
)
SELECT * FROM ranked WHERE rn = 1;</code></pre>
<p><strong>Running total and month-over-month change:</strong></p>
<pre><code>SELECT month, revenue,
       SUM(revenue) OVER (ORDER BY month
                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
       LAG(revenue) OVER (ORDER BY month) AS prev_month,
       revenue - LAG(revenue) OVER (ORDER BY month) AS mom_change,
       AVG(revenue) OVER (ORDER BY month
                          ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS ma_3
FROM monthly_revenue;</code></pre>
<p><strong>Retention cohort</strong> — a very common data science screen:</p>
<pre><code>WITH first_activity AS (
  SELECT user_id, DATE_TRUNC('month', MIN(event_date)) AS cohort_month
  FROM events GROUP BY user_id
),
activity AS (
  SELECT DISTINCT e.user_id, f.cohort_month,
         DATE_TRUNC('month', e.event_date) AS active_month
  FROM events e JOIN first_activity f USING (user_id)
)
SELECT cohort_month,
       (EXTRACT(YEAR FROM active_month) - EXTRACT(YEAR FROM cohort_month)) * 12
       + (EXTRACT(MONTH FROM active_month) - EXTRACT(MONTH FROM cohort_month)) AS month_number,
       COUNT(DISTINCT user_id) AS active_users
FROM activity
GROUP BY 1, 2 ORDER BY 1, 2;</code></pre>
<p><strong>Funnel conversion:</strong></p>
<pre><code>SELECT
  COUNT(DISTINCT CASE WHEN step = 'view'     THEN session_id END) AS viewed,
  COUNT(DISTINCT CASE WHEN step = 'add_cart' THEN session_id END) AS carted,
  COUNT(DISTINCT CASE WHEN step = 'purchase' THEN session_id END) AS purchased,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN step='purchase' THEN session_id END)
             / NULLIF(COUNT(DISTINCT CASE WHEN step='view' THEN session_id END),0), 2) AS cvr
FROM funnel_events;</code></pre>
<p><strong>Sessionization — gap-and-island,</strong> the hardest common one:</p>
<pre><code>WITH marked AS (
  SELECT user_id, event_time,
         CASE WHEN event_time - LAG(event_time) OVER (PARTITION BY user_id
                                                      ORDER BY event_time)
                   > INTERVAL '30 minutes'
                OR LAG(event_time) OVER (PARTITION BY user_id
                                         ORDER BY event_time) IS NULL
              THEN 1 ELSE 0 END AS is_new_session
  FROM events
)
SELECT user_id, event_time,
       SUM(is_new_session) OVER (PARTITION BY user_id
                                 ORDER BY event_time) AS session_id
FROM marked;</code></pre>`},

{q:"WHERE vs HAVING, and the JOIN types",
roles:["ds"],lvl:"core",tags:["sql","high-freq"],
a:`<p><strong>WHERE vs HAVING — it's about execution order:</strong></p>
<pre><code>FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT</code></pre>
<ul>
<li><strong>WHERE</strong> filters individual rows <em>before</em> grouping. Cannot reference aggregates.</li>
<li><strong>HAVING</strong> filters groups <em>after</em> aggregation. Can reference aggregates.</li>
</ul>
<pre><code>SELECT dept_id, AVG(salary) AS avg_sal
FROM employees
WHERE hire_date >= '2020-01-01'    -- filter rows first
GROUP BY dept_id
HAVING AVG(salary) > 100000        -- then filter groups
   AND COUNT(*) >= 5;</code></pre>
<p><strong>Performance note worth making:</strong> filter in WHERE whenever possible — it reduces the rows entering the aggregation. Putting a non-aggregate condition in HAVING still works but does more work.</p>
<p><strong>Joins:</strong></p>
<table><thead><tr><th>Join</th><th>Returns</th></tr></thead><tbody>
<tr><td>INNER</td><td>Only matching rows from both sides</td></tr>
<tr><td>LEFT (OUTER)</td><td>All left rows; NULLs where no right match</td></tr>
<tr><td>RIGHT</td><td>All right rows; NULLs where no left match</td></tr>
<tr><td>FULL OUTER</td><td>All rows from both; NULLs on either side</td></tr>
<tr><td>CROSS</td><td>Cartesian product</td></tr>
<tr><td>SELF</td><td>A table joined to itself (manager hierarchies)</td></tr>
<tr><td>LATERAL / APPLY</td><td>Right side can reference the left row — "top 3 orders per customer"</td></tr>
</tbody></table>
<div class="trap"><b>Two traps they set.</b> (1) <strong>A condition on the right table in the WHERE clause silently converts a LEFT JOIN into an INNER JOIN</strong>, because NULL fails the predicate. Put it in the ON clause instead if you want to keep unmatched left rows. (2) <strong>NULL comparisons.</strong> <code>NULL = NULL</code> is not true — use <code>IS NULL</code>. And <code>NOT IN (subquery)</code> returns no rows at all if the subquery contains a single NULL; use <code>NOT EXISTS</code> instead. Also note <code>COUNT(*)</code> counts rows while <code>COUNT(col)</code> skips NULLs.</div>`}
]}
]});
