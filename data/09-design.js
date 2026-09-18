PREP.push({
id:"design", n:"09", title:"System Design Cases", icon:"▦",
blurb:"A framework plus ten worked cases. AI system design rounds are won by structure and by naming tradeoffs out loud — not by drawing the most boxes.",
topics:[
{
title:"The framework",
items:[
{q:"How do you structure an AI/ML system design answer?",
roles:["aie","agentic","ds"],lvl:"senior",tags:["design","high-freq","senior-signal"],
a:`<p><strong>Spend the first five minutes not designing.</strong> Candidates who start drawing immediately lose, because they solve the wrong problem.</p>
<p><strong>1. Clarify and scope (5 min).</strong> Ask, don't assume:</p>
<ul>
<li>Who are the users and what decision does the output drive?</li>
<li>Scale — QPS, peak vs average, data volume, number of documents/users/tenants?</li>
<li>Latency budget — interactive (&lt;1s), near-real-time (seconds), or batch (overnight)?</li>
<li>Quality bar — what error rate is acceptable, and what's the cost of each error type?</li>
<li>Constraints — budget, on-prem vs cloud, data residency, regulatory, existing stack?</li>
<li>What's out of scope? Explicitly narrow it.</li>
</ul>
<p><strong>2. Define success metrics (3 min).</strong> Split them deliberately, because this is a senior signal:</p>
<ul>
<li><em>Business metric</em> — retained revenue, agent handle time, fraud loss.</li>
<li><em>Model metric</em> — recall at fixed precision, faithfulness, NDCG@5.</li>
<li><em>System SLO</em> — p95 latency, availability, cost per request.</li>
</ul>
<p><strong>3. High-level architecture (10 min).</strong> Draw the data flow end to end: ingestion → storage → processing/training → serving → monitoring. Keep it simple first; you'll add detail when probed.</p>
<p><strong>4. Deep dive where it matters (15 min).</strong> Pick the two or three genuinely hard parts and go deep: the retrieval strategy, the training data pipeline, the feature freshness problem, the cold start. <em>Ask the interviewer where they'd like you to focus</em> — it's a collaborative signal, not a weakness.</p>
<p><strong>5. Tradeoffs, explicitly (5 min).</strong> Every choice has a cost. Say both sides: "I'd use a vector DB rather than pgvector because we need billion-scale with filtered search, but that's another system to operate and I'd start with pgvector if the corpus is under a few million chunks."</p>
<p><strong>6. Scale, failure and evolution (5 min).</strong> What breaks at 10×? What's the single point of failure? How do you degrade gracefully? How do you roll back? What's the v2?</p>
<div class="say"><b>Habits that mark a senior candidate:</b> start with the simplest thing that works and add complexity only when you justify it with a requirement · state assumptions out loud and label them as assumptions · do rough capacity math (QPS × payload = bandwidth; documents × chunks × dimensions × 4 bytes = index size) · name what you're <em>not</em> building and why · bring up monitoring and failure modes before being asked · and admit uncertainty cleanly — "I'd want to benchmark that rather than guess" is a strong answer, not a weak one.</div>`}
]},

{
title:"AI & LLM system cases",
items:[
{q:"Design an enterprise document intelligence / RAG platform",
roles:["aie"],lvl:"senior",tags:["design","rag","high-freq"],
a:`<p><strong>Requirements to establish:</strong> 500k documents (PDFs, Word, scans), 5,000 employees, per-user document permissions, &lt;3s p95 answer latency, answers must cite sources, corpus updates daily.</p>
<p><strong>Capacity math, out loud:</strong> 500k docs × ~20 chunks = 10M chunks. At 1024 dims × 4 bytes = 4KB/vector → ~40GB of raw vectors, plus HNSW graph overhead (roughly 1.5–2×) → ~60–80GB. That doesn't fit comfortably in one node's RAM, so: shard, or quantize/truncate dimensions (Matryoshka to 256 dims → 10GB), or use IVF-PQ. <em>Doing this arithmetic aloud is worth a lot.</em></p>
<pre><code>SOURCES                 INGESTION (async, queued)
SharePoint ─┐          ┌─────────────────────────────┐
S3          ─┼─ CDC ──►│ parse (layout+OCR) →        │
Confluence  ─┘          │ normalize → dedupe →        │
                        │ enrich (summary, entities,  │
                        │   dates, ACL ids) →         │
                        │ chunk (structure-aware) →   │
                        │ embed (batched) →           │
                        │ index (vector+BM25+meta)    │
                        └──────────┬──────────────────┘
                                   ▼
                   ┌───────────────────────────────┐
                   │  Vector store  │  BM25 index  │
                   │  (+ metadata & ACL columns)   │
                   └───────────────┬───────────────┘
QUERY PATH                         │
User → API GW (OIDC) → Query svc ──┤
   ├─ rewrite (conversational deref, small fast model)
   ├─ route (vector | SQL | both)
   ├─ hybrid retrieve top-50  ← ACL filter from JWT claims
   ├─ RRF fuse → cross-encoder rerank → top-5
   ├─ assemble context (dedupe, order, budget, label)
   ├─ LLM generate (streamed) with citation instruction
   └─ groundedness check → response + citations
                                   │
              Trace → Langfuse │ Eval suite in CI │ Feedback → golden set</code></pre>
<p><strong>The decisions to defend:</strong></p>
<ul>
<li><strong>Access control at retrieval time, not generation time.</strong> Store ACL group ids on every chunk; resolve the caller's groups from the verified JWT and apply them as a pre-filter. Never send a document to the model and instruct it not to use it. This is the single most important design point in an enterprise RAG system.</li>
<li><strong>Hybrid retrieval</strong> — the corpus is full of part numbers, SOP codes and error codes that embeddings are blind to.</li>
<li><strong>Parent-child chunking</strong> — embed small for precision, return the section for completeness.</li>
<li><strong>Versioned index with blue-green swap</strong> — changing the embedding model or chunking means a full re-embed; build the new index alongside, shadow-evaluate it on the golden set, then swap the alias.</li>
<li><strong>Async ingestion with a queue and a DLQ</strong> — a 400-page scanned PDF cannot be processed in a request; and ingestion failures must be visible, not swallowed.</li>
<li><strong>Streaming responses</strong> — the single biggest perceived-latency win.</li>
<li><strong>Caching</strong> — prompt prefix cache for the system prompt; exact-match response cache keyed by (query, user ACL scope, index version).</li>
</ul>
<p><strong>Failure modes and degradation:</strong> reranker down → serve the fused top-5 unranked; LLM provider down → fail over to a secondary provider, or return the retrieved passages with a notice; vector store degraded → fall back to BM25 only; retrieval below the relevance threshold → say "not found" rather than generate.</p>
<p><strong>Scale to 10×:</strong> shard the vector index by tenant or business unit; move to IVF-PQ or DiskANN; separate the ingestion and query clusters so a bulk backfill can't degrade query latency; add a read-through cache tier.</p>`},

{q:"Design a production agent platform (multi-tenant)",
roles:["agentic"],lvl:"senior",tags:["design","agents","high-freq"],
a:`<p><strong>Requirements:</strong> internal teams build and run agents; agents call internal APIs and databases; runs last seconds to tens of minutes; some actions need human approval; per-team cost visibility and caps; full auditability.</p>
<p>See the reference architecture in the <em>Agentic AI</em> section. The design decisions to defend here:</p>
<p><strong>1. Stateless runtime + durable checkpointer.</strong> Long runs must survive pod recycling. Every superstep checkpoints to Postgres. This one decision gives you three features free: crash recovery, human-in-the-loop (an interrupt is just a checkpoint awaiting input), and time-travel debugging (replay a run from any step).</p>
<p><strong>2. Async-first API.</strong> <code>POST /runs</code> returns a run id immediately; progress streams over SSE; the client can disconnect and reconnect. A synchronous HTTP request holding a 10-minute agent run will be killed by some proxy in the chain, and you'll never find out which one.</p>
<p><strong>3. An LLM gateway rather than direct SDK calls.</strong> Centralizes model routing by task difficulty, retries with backoff, provider failover, prompt caching, and per-tenant token metering. Swapping models becomes config, not a deploy.</p>
<p><strong>4. Tool registry with runtime permission resolution.</strong> Tools are registered with schemas and required scopes; the set of tools a run can see is computed from the caller's identity server-side. Agents get the <em>user's</em> permissions, never a service account's — otherwise the agent is a privilege-escalation path.</p>
<p><strong>5. Approval gates as first-class infrastructure.</strong> Any tool marked <code>requires_approval</code> triggers an interrupt, persists the pending action, notifies the approver (Slack/email), and resumes on approval. Approvals expire.</p>
<p><strong>6. Hard budgets enforced in code.</strong> Per-run step cap, token cap, wall-clock timeout, and dollar cap; per-tenant monthly quota. Never rely on the prompt to limit the agent.</p>
<p><strong>7. Sandbox for code execution</strong> — ephemeral container, no credentials, egress allowlist, CPU/memory/time limits.</p>
<p><strong>8. Tracing as the backbone.</strong> One trace per run; a span per LLM call and tool call carrying tokens, cost, latency, model version, prompt version and resolved identity. This is simultaneously your debugger, your billing system, and your audit log.</p>
<p><strong>9. Multi-tenancy isolation</strong> — tenant id in every cache key, retrieval filter, log line and database row. Enforce at the data layer, not in application logic.</p>
<p><strong>10. Eval service + CI gate.</strong> Prompts, tool schemas and agent graphs are versioned artifacts; changing any of them triggers a regression run against golden tasks with mocked tools before it can deploy.</p>
<p><strong>What breaks at scale:</strong> long-running work monopolizing workers (use a separate queue and worker pool per run-duration class); noisy-neighbour token consumption (per-tenant rate limits at the gateway); checkpoint store write volume (batch supersteps, prune completed runs on a retention policy); and provider rate limits (multi-provider routing with a token-bucket per provider).</p>`},

{q:"Design a churn prediction system end to end",
roles:["ds"],lvl:"core",tags:["design","ml","high-freq"],
a:`<p><strong>1. Frame the business problem properly — this is where the answer is won.</strong></p>
<ul>
<li>What action follows a prediction? A retention offer costing ₹500? A call from a human? Nothing? <strong>If no action follows, don't build the model.</strong></li>
<li>Define churn precisely: no transaction in 60 days? Explicit cancellation? Subscription non-renewal? The definition determines the labels and it is a business decision, not a modelling one.</li>
<li>Define the prediction horizon: churn within the next 30 days. This determines the label window and the feature cutoff.</li>
<li>Economics: offer cost ₹500, retained customer LTV ₹8,000, offer acceptance ~30%. Expected value of a true positive = 0.3 × 8000 − 500 = ₹1,900; cost of a false positive = ₹500. That ratio of ~4:1 tells you to favour recall — and gives you the threshold analytically rather than by convention.</li>
</ul>
<p><strong>2. Data and labels.</strong> Transactions, product usage, support tickets, billing history, demographics, engagement events. Build labels with a strict <strong>observation window → gap → label window</strong> structure so features can only use data available at the prediction moment.</p>
<pre><code>|--- observation window (features) ---|-- gap --|-- label window --|
                                    T0                          T0+30d
Features computed using data ≤ T0 only.  Label = churned in the window.</code></pre>
<p><strong>3. Features.</strong> RFM (recency, frequency, monetary), trend features (last-30-day activity ÷ last-90-day average — ratios drift less than levels), tenure, support ticket count and sentiment, payment failures, feature-adoption breadth, days since last login, plan changes, and <strong>competitor-driven seasonality flags</strong> if relevant. Serve them from a feature store for point-in-time correctness.</p>
<p><strong>4. Model.</strong> Logistic regression baseline (interpretable, and the marketing team will ask "why this customer"), then XGBoost/LightGBM. Address imbalance (typically 2–10% churn) with class weights and threshold tuning, not SMOTE. <strong>Calibrate</strong>, because you're multiplying the probability by LTV.</p>
<p><strong>5. Evaluation.</strong> PR-AUC, recall at the operating threshold, and <strong>lift in the top decile</strong> — the metric the business actually understands ("of the 1,000 customers we contact, how many would really have churned"). Validate <strong>out of time</strong>, never randomly. Report per-segment performance.</p>
<p><strong>6. Serving.</strong> Batch scoring nightly is almost always right here — the retention team works from a daily list, so there's no need for real-time inference. Write scores plus SHAP top-3 reasons to a table the CRM reads.</p>
<p><strong>7. Monitoring.</strong> Feature drift (PSI), prediction drift, and — once labels mature 30–60 days later — actual recall and lift. Monitor the <em>action</em> too: offer acceptance rate by score decile.</p>
<p><strong>8. The feedback loop problem — raise this unprompted.</strong> Once you intervene on high-risk customers, you change their outcome, so your labels become biased: the customers you saved look like false positives. Mitigations: hold out a small untreated control group permanently to get unbiased labels and to measure real incremental impact; and consider reframing as <strong>uplift modelling</strong> — predict who will respond to the offer, not who will churn, since contacting someone who'd have stayed anyway is wasted budget and contacting a lost cause is too.</p>`},

{q:"Design a real-time fraud detection system",
roles:["ds","aie"],lvl:"senior",tags:["design","ml"],
a:`<p><strong>Requirements:</strong> 10,000 transactions/sec peak, &lt;100ms decision latency (it's in the payment path), fraud rate ~0.1%, false positives block real customers.</p>
<pre><code>Transaction ──► Kafka ──► Stream processor (Flink/Spark Streaming)
                              │
                              ├─ real-time features (windowed aggregates)
                              ├─ lookup: online feature store (Redis)
                              │
                              ▼
                     ┌──────────────────┐
                     │ Rules engine     │ ← hard blocks, velocity caps,
                     │ (runs first)     │   blocklists, regulatory rules
                     └────────┬─────────┘
                              ▼
                     ┌──────────────────┐
                     │ ML model (<20ms) │ ← gradient-boosted trees
                     └────────┬─────────┘
                              ▼
                  score + threshold band
                     ├─ low     → approve
                     ├─ medium  → step-up auth (OTP/3DS)
                     └─ high    → block + review queue
                              │
                     Feed decisions + eventual labels (chargebacks) back</code></pre>
<p><strong>The design points that matter:</strong></p>
<ul>
<li><strong>Rules before ML.</strong> Rules give you instant response to a new attack pattern (deploy in minutes, no retraining), regulatory compliance, and explainability. The model catches what rules can't articulate. Every real fraud system is a hybrid, and saying so shows domain awareness.</li>
<li><strong>Three-way decision, not binary.</strong> A step-up authentication band is what lets you have high recall without blocking real customers — the medium band converts a hard block into mild friction. This is the single best answer to "how do you handle the precision/recall tradeoff here."</li>
<li><strong>Real-time features are the hard part.</strong> "Number of transactions from this card in the last 5 minutes" and "distinct merchants in the last hour" are the highest-signal features and they must be computed with sub-10ms lookups. Windowed aggregates in Flink written to Redis. Watch for training/serving skew here especially — the offline and streaming implementations of a windowed count diverge easily.</li>
<li><strong>Latency budget, allocated explicitly:</strong> ~10ms feature lookup, ~20ms inference, ~20ms rules, leaving headroom in a 100ms budget. That rules out anything deep or ensemble-heavy — gradient-boosted trees, not a neural net.</li>
<li><strong>Label delay.</strong> Chargebacks arrive 30–90 days later. So you can't measure real accuracy quickly; you rely on prediction drift, analyst feedback from the review queue, and a small controlled sample of forced approvals to estimate the false-negative rate.</li>
<li><strong>Adversarial drift.</strong> Fraudsters adapt specifically to your defenses, so concept drift is fast and intentional. Retrain frequently, monitor per-pattern recall, and keep the rules layer as the fast-response mechanism.</li>
<li><strong>Feedback loop bias.</strong> Blocked transactions have no ground truth — you never learn whether they were really fraud. Address with a small randomized approval holdout and by using analyst review outcomes as labels.</li>
<li><strong>Explainability is a legal requirement</strong> in many jurisdictions for declined transactions. SHAP reasons stored with every decision.</li>
<li><strong>Graceful degradation:</strong> if the model service is unavailable, fall back to rules-only rather than blocking all payments or approving all of them. Decide which of those two the business prefers, in advance.</li>
</ul>`},

{q:"Design an LLM gateway / model router",
roles:["aie","agentic"],lvl:"senior",tags:["design","llm","senior-signal"],
a:`<p><strong>Why it exists:</strong> every team calling provider SDKs directly means no cost visibility, no central rate limiting, no failover, duplicated retry logic, and a multi-week migration whenever you change models.</p>
<pre><code>Apps ──► LLM Gateway ──► Providers (OpenAI, Anthropic, Bedrock, self-hosted vLLM)
             │
             ├── Auth & tenant resolution
             ├── Routing (by task, cost, latency, capability, availability)
             ├── Rate limiting & quotas (per tenant, per provider token bucket)
             ├── Prompt cache / semantic cache
             ├── Retry + backoff + provider failover
             ├── Token counting & cost metering → billing
             ├── Guardrails (PII masking, output filters)
             ├── Tracing (prompt, completion, tokens, cost, latency, versions)
             └── Model registry (aliases → concrete model versions)</code></pre>
<p><strong>Routing strategies, and when each applies:</strong></p>
<ul>
<li><strong>Static alias</strong> — apps call <code>fast-summarizer</code>, the gateway maps it to a concrete model+version. Changing models becomes a config change. <em>Start here; it delivers most of the value.</em></li>
<li><strong>Cost-based cascade</strong> — try the small model, and escalate to the large one only if a confidence check or validator fails. Very effective when most requests are easy.</li>
<li><strong>Classifier-based routing</strong> — a small model predicts difficulty and routes accordingly. More elegant, but now you have a router to train and monitor.</li>
<li><strong>Capability-based</strong> — vision, long context, tool use, or a specific structured-output mode.</li>
<li><strong>Latency/availability-based</strong> — shift away from a provider that's degraded or rate-limiting.</li>
</ul>
<p><strong>Hard problems worth naming:</strong></p>
<ul>
<li><strong>Streaming through a proxy</strong> — must forward SSE chunk-by-chunk without buffering, while still counting tokens and applying output guardrails. Output filtering on a stream is genuinely hard: you can't scan text you haven't generated yet, so you either buffer (killing the streaming benefit), scan in windows, or accept post-hoc detection.</li>
<li><strong>Prompt cache preservation</strong> — the gateway must not reorder or rewrite the static prefix, or it destroys the provider's cache hit and multiplies cost.</li>
<li><strong>Semantic differences across providers</strong> — tool-calling formats, system prompt handling, stop sequences and token counting all differ. The gateway has to normalize, and the abstraction leaks.</li>
<li><strong>Failover correctness</strong> — a retry on a different provider may produce a different answer mid-conversation. Failover is safe for stateless calls, risky inside an agent trajectory.</li>
<li><strong>It's a single point of failure</strong> — so it must be stateless, horizontally scaled, with a very short timeout budget of its own, and apps need a documented direct-call escape hatch.</li>
</ul>
<div class="say"><b>The payoff to state:</b> "The gateway is what turns 'which model should we use' from an engineering migration into a config change, and it's the only place you can honestly answer 'what is this feature costing us per request'. I'd build it thin — routing, metering, retries, tracing — and resist putting business logic in it, because it's on the critical path for every AI feature in the company."</div>`},

{q:"Design an ML monitoring and drift detection service",
roles:["ds","aie"],lvl:"senior",tags:["design","mlops"],
a:`<p><strong>Requirements:</strong> 50 models across teams, mix of batch and real-time, labels arriving with delays from minutes to months, alerting into existing on-call.</p>
<pre><code>Inference services ──► log (async, sampled) ──► Inference store
                                                  (Delta / Parquet, partitioned
                                                   by model, version, date)
                                                        │
Label sources (CRM, chargebacks, ────► Label store ─────┤
 human review, downstream events)                       │
                                                        ▼
                                          ┌──────────────────────────┐
                                          │ Metrics computation jobs │
                                          │  · data quality          │
                                          │  · feature & pred drift  │
                                          │  · quality (when labels) │
                                          │  · slice breakdowns      │
                                          └────────────┬─────────────┘
                                                       ▼
                                     Metrics store (time series)
                                              │            │
                                        Dashboards     Alert rules ──► PagerDuty/Slack
                                                              └──► retraining trigger</code></pre>
<p><strong>Design decisions:</strong></p>
<ul>
<li><strong>Log requests and responses asynchronously and sampled.</strong> Never let monitoring add latency to or fail the inference path. Fire-and-forget to a queue; sample high-volume models (but always log 100% of errors and low-confidence predictions).</li>
<li><strong>Join labels asynchronously.</strong> The inference store and label store are separate and joined later on a request id, because labels arrive on completely different timelines. This decoupling is the core architectural insight.</li>
<li><strong>A reference/baseline dataset per model version</strong> — usually the training distribution — stored as the drift comparison target. Versioned with the model.</li>
<li><strong>Metrics as a config, not code.</strong> Teams register a model with a spec: features, types, baseline, which drift tests, thresholds, slices, and alert routing. Otherwise you write 50 bespoke monitoring jobs.</li>
<li><strong>Thresholds on effect size, not p-values.</strong> With high volume, KS and chi-square flag everything. Use PSI bands (0.1 / 0.25) and Wasserstein distance, and tie alert severity to estimated business impact.</li>
<li><strong>Alert fatigue is the real failure mode.</strong> Fifty models × thirty features × five tests = thousands of potential alerts nobody reads. Controls: alert on prediction drift and quality first (low cardinality, high signal), aggregate feature drift into one per-model score with drill-down, require N consecutive breaches, and suppress during known events.</li>
<li><strong>Slice monitoring</strong> — aggregate metrics hide segment failures. Register the slices that matter (region, customer tier, device) per model.</li>
<li><strong>Close the loop</strong> — a sustained breach opens a ticket or triggers the retraining pipeline, with the promotion gate described in the MLOps section.</li>
</ul>
<p><strong>For LLM systems the same skeleton applies</strong> with different metrics: sampled groundedness and relevance scored by a judge, refusal and safety-trigger rates, token cost per request, retrieval recall on a canary set, and user feedback — plus human review of a sampled slice of traces, which stays necessary because no automated metric covers everything.</p>`},

{q:"Design a recommendation system",
roles:["ds"],lvl:"senior",tags:["design","ml"],
a:`<p><strong>Requirements:</strong> 10M users, 1M items, personalized homepage, &lt;150ms, must handle new users and new items.</p>
<p><strong>The standard multi-stage architecture</strong> — and knowing <em>why</em> it's staged is the answer:</p>
<pre><code>1M items
   │  CANDIDATE GENERATION (retrieval)   ~10ms, recall-oriented
   │  · collaborative filtering (ANN over learned embeddings)
   │  · content-based similarity
   │  · trending / popular (cold start)
   │  · recently viewed, same-category, co-purchase
   ▼
~1000 candidates
   │  FILTERING           business rules: out of stock, already owned,
   │                      age-restricted, region-unavailable
   ▼
~500 candidates
   │  RANKING             heavier model, precision-oriented, ~50ms
   │  · GBDT or a two-tower/DLRM neural ranker
   │  · rich features: user × item interactions, context, freshness
   ▼
ranked list
   │  RE-RANKING          diversity (MMR), business objectives
   │                      (margin, inventory), exploration
   ▼
20 shown</code></pre>
<p>You stage it because you cannot afford to score a million items with a heavy model in 150ms. Cheap and approximate narrows the field; expensive and accurate orders the survivors.</p>
<p><strong>Models:</strong></p>
<ul>
<li><strong>Collaborative filtering</strong> — matrix factorization (ALS) or a two-tower neural model producing user and item embeddings, served via ANN. Strong signal, but it's blind to new items and new users.</li>
<li><strong>Content-based</strong> — item features and text/image embeddings. Handles new items; less personalized.</li>
<li><strong>Hybrid</strong> is what you ship. Sequential models (SASRec, transformer-based) if session order matters — usually it does.</li>
</ul>
<p><strong>Cold start — always asked:</strong> new <em>users</em> get popularity-based and trending recommendations, onboarding preference questions, and contextual signals (geo, device, referrer), with a fast switch to personalized after a handful of interactions. New <em>items</em> get content-based placement plus deliberate exploration budget (a small share of impressions) so they can accumulate signal at all. Without forced exploration, a new item with no interactions never gets shown, so it never gets interactions — the cold-start trap.</p>
<p><strong>Evaluation:</strong> offline — recall@k, NDCG@k, MAP, on a <em>temporal</em> split. Online — CTR, conversion, watch time, session depth, and long-term retention. <strong>Offline and online metrics correlate poorly</strong>, so A/B testing is not optional; state this, because it's the hardest truth of recommender work.</p>
<p><strong>The senior topics to raise unprompted:</strong></p>
<ul>
<li><strong>Feedback loops and popularity bias</strong> — the model recommends what it recommended before, concentrating traffic on a shrinking set of items. Counter with exploration, diversity objectives, and inverse-propensity weighting on training data.</li>
<li><strong>Position bias</strong> — items shown at the top get clicked because they were at the top. Training naively on click logs learns position, not preference. Correct with IPW or a position-aware model.</li>
<li><strong>Delayed and implicit feedback</strong> — a click is not satisfaction; measure dwell, completion, returns.</li>
<li><strong>Filter bubbles and the diversity/relevance tradeoff</strong> as an explicit product decision.</li>
<li><strong>Multi-objective ranking</strong> — engagement, revenue, creator fairness and user wellbeing pull in different directions, and the weights are a business decision you should surface rather than bury in a loss function.</li>
</ul>`},

{q:"Six more cases to have an outline for",
roles:["aie","agentic","ds"],lvl:"senior",tags:["design"],
a:`<p><strong>Design a feature store.</strong> Offline store (Delta/warehouse) for point-in-time-correct training joins + online store (Redis/DynamoDB) for millisecond serving; one transformation definition materialized to both; a registry with ownership, lineage and freshness SLAs per feature; backfill capability. <em>Core insight:</em> the whole product exists to kill training/serving skew.</p>
<p><strong>Design a document parsing pipeline at scale (10M PDFs).</strong> Queue-driven workers, autoscaled; route by document type (native text vs scanned vs form) to different parsers because OCR is 100× the cost of text extraction; per-document quality score with a fallback chain (fast parser → layout parser → VLM for the hard 5%); idempotent processing keyed by content hash; DLQ with human review; checkpointed so a restart doesn't reprocess everything. <em>Core insight:</em> cost is dominated by the expensive path, so routing is the whole design.</p>
<p><strong>Design an eval platform for LLM features.</strong> Golden datasets versioned in git alongside prompts; a runner that executes prompt × model × dataset combinations with mocked tools; graders (programmatic assertions, then judges with pinned versions); result store with run-to-run diffing; CI integration as a merge gate; production trace sampling flowing back into datasets. <em>Core insight:</em> the gate is the product — an eval nobody blocks on is a dashboard.</p>
<p><strong>Design a multi-tenant AI SaaS.</strong> Tenant id enforced at the data layer (row-level security or per-tenant schema/index), never in application logic; per-tenant rate limits and token quotas at the gateway; tenant in every cache key (the semantic-cache cross-tenant leak is the canonical incident); noisy-neighbour isolation via separate worker pools for heavy tenants; per-tenant cost attribution; data residency by region; and a decision on shared vs dedicated model deployments per tier.</p>
<p><strong>Design a real-time personalization service for an AI assistant.</strong> Session state in Redis with TTL; long-term user memory in a vector store written by a background extraction pass (never in the hot path); memory retrieved on relevance rather than injected wholesale; supersede-with-timestamp semantics for conflicting facts; user-visible memory management with deletion (a compliance requirement); and an explicit token budget for memory so it can't crowd out retrieved context.</p>
<p><strong>Design a code review / SWE agent.</strong> Repo indexed for retrieval (symbol graph + embeddings over files and diffs); tools scoped to read files, run tests, run a linter, propose a patch — never push directly; sandboxed execution with no credentials; plan-then-execute with the plan surfaced in the PR for human review; strict step and cost caps; evals built from historical PRs with known outcomes; and the critical product decision that the agent opens a PR for human approval rather than committing, which is what makes the whole system safe to deploy.</p>`}
]}
]});
