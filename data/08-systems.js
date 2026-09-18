PREP.push({
id:"systems", n:"08", title:"Production Systems & Security", icon:"⬢",
blurb:"Backend fundamentals AI engineers get grilled on: environments, CI/CD, Docker and Kubernetes, Redis, Kafka, databases, APIs, JWT and OAuth — plus the incident playbooks for every 'production is slow, what do you check' question.",
topics:[
{
title:"Environments, CI/CD & scaling",
items:[
{q:"Dev → QA → UAT → Pre-Prod → Prod: what happens at each stage?",
roles:["aie"],lvl:"core",tags:["devops","high-freq"],
a:`<table><thead><tr><th>Environment</th><th>Who</th><th>Purpose</th><th>Data</th></tr></thead><tbody>
<tr><td><strong>Dev</strong></td><td>Developers</td><td>Write code, unit tests, local integration</td><td>Synthetic / small sample</td></tr>
<tr><td><strong>QA</strong></td><td>QA engineers</td><td>Functional, integration and regression testing. Does it work as specified?</td><td>Masked or synthetic test data</td></tr>
<tr><td><strong>UAT</strong></td><td>Business users</td><td>Does it solve the business problem? Acceptance sign-off</td><td>Realistic, masked production-like</td></tr>
<tr><td><strong>Pre-Prod / Staging</strong></td><td>Engineering + SRE</td><td>Exact production replica. Load testing, performance validation, migration rehearsal, final smoke</td><td>Production-scale, masked</td></tr>
<tr><td><strong>Prod</strong></td><td>Real users</td><td>Live traffic, full monitoring and alerting</td><td>Real</td></tr>
</tbody></table>
<p><strong>"Why do we need UAT if QA already exists?"</strong> — the question they actually ask.</p>
<p>QA verifies the software works <em>correctly against the specification</em>. UAT verifies the software <em>solves the business problem</em>. They can diverge completely: QA can confirm the chatbot returns a grammatically valid answer citing a document, while a plant engineer in UAT tells you the answer is technically correct and operationally useless because it omits the interlock step they actually need. QA catches defects; UAT catches wrong requirements.</p>
<div class="say"><b>Concrete version:</b> "On the enterprise document assistant I worked on, QA confirmed retrieval returned the right SOP and the citations resolved. UAT was where domain engineers told us the answer format was wrong for their workflow — they needed the safety prerequisites surfaced first, not buried in a paragraph. No amount of QA would have found that, because the spec itself was incomplete."</div>`},

{q:"What happens after git push? Walk me through the CI/CD pipeline",
roles:["aie"],lvl:"core",tags:["devops","high-freq"],
a:`<pre><code>Developer → git push → GitHub/GitLab
                          │
                    ┌─────▼──────── CI ────────────┐
                    │ 1. Checkout, restore cache   │
                    │ 2. Lint + format check       │
                    │ 3. Type check                │
                    │ 4. Unit tests + coverage gate│
                    │ 5. Build Docker image        │
                    │ 6. SAST + dependency scan    │
                    │ 7. Container image scan      │
                    │ 8. Integration tests         │
                    │ 9. Push image (tagged w/ SHA)│
                    └─────┬────────────────────────┘
                          ▼
                    Container registry (ECR/ACR/GCR)
                          │
                    ┌─────▼──────── CD ────────────┐
                    │ Deploy to staging            │
                    │ Smoke + e2e tests            │
                    │ Manual approval gate (prod)  │
                    │ Rolling/canary to production │
                    │ Readiness + liveness probes  │
                    │ Progressive traffic shift    │
                    │ Monitor → auto-rollback      │
                    └──────────────────────────────┘</code></pre>
<p><strong>CI vs CD vs CD</strong> — get the terms right: Continuous <em>Integration</em> (merge and test frequently), Continuous <em>Delivery</em> (every build is deployable, release is a manual decision), Continuous <em>Deployment</em> (every passing build deploys automatically).</p>
<p><strong>Details that show real experience:</strong> tag images with the git SHA, never <code>latest</code> — <code>latest</code> makes rollback and reproducibility impossible. Keep secrets out of the image and inject at runtime from a secrets manager. Build once, promote the same artifact through environments rather than rebuilding per environment. Make migrations backward-compatible so old and new pods can run simultaneously during a rolling deploy.</p>
<p><strong>For ML/LLM systems, add to the pipeline:</strong> data validation, model evaluation gates against the incumbent, prompt eval regression suites, and model-artifact versioning. See the MLOps section.</p>`},

{q:"Horizontal vs vertical scaling, and load balancing",
roles:["aie"],lvl:"core",tags:["devops","high-freq"],
a:`<table><thead><tr><th></th><th>Vertical (scale up)</th><th>Horizontal (scale out)</th></tr></thead><tbody>
<tr><td>Method</td><td>Bigger machine — 4 CPU → 32 CPU</td><td>More machines — A + B + C</td></tr>
<tr><td>Ceiling</td><td>Hard — largest available instance</td><td>Practically unlimited</td></tr>
<tr><td>Fault tolerance</td><td><strong>None</strong> — single point of failure</td><td><strong>Built in</strong> — lose one node, others serve</td></tr>
<tr><td>Downtime to scale</td><td>Usually requires a restart</td><td>None — add nodes live</td></tr>
<tr><td>Cost curve</td><td>Super-linear at the high end</td><td>Roughly linear</td></tr>
<tr><td>Complexity</td><td>Low — no app changes</td><td>Higher — needs statelessness, a load balancer, distributed state</td></tr>
<tr><td>Best for</td><td>Databases, monoliths, in-memory workloads</td><td>Stateless APIs, web tiers, workers</td></tr>
</tbody></table>
<p><strong>Horizontal is preferred</strong> for stateless services: cheaper, fault tolerant, scales without a ceiling. But the honest answer names the prerequisite — <strong>the application must be stateless</strong>. Session state, in-process caches and local file writes all have to move out (to Redis, to object storage) before horizontal scaling works. Databases are usually scaled vertically first, then horizontally via read replicas and finally sharding, because distributed writes are genuinely hard.</p>
<p><strong>Load balancing algorithms:</strong></p>
<ul>
<li><strong>Round robin</strong> — even rotation. Fine when requests are uniform.</li>
<li><strong>Weighted round robin</strong> — for heterogeneous instance sizes.</li>
<li><strong>Least connections</strong> — send to the least busy. <strong>Better for LLM serving</strong>, where request durations vary by orders of magnitude and round robin will pile short requests behind long generations.</li>
<li><strong>Least response time</strong> — accounts for both connections and observed latency.</li>
<li><strong>IP hash / consistent hashing</strong> — sticky routing, needed for session affinity and for cache locality (route the same prefix to the same vLLM replica to hit its prefix cache).</li>
<li><strong>L4 vs L7</strong> — L4 balances TCP connections; L7 understands HTTP and can route by path, header or cookie.</li>
</ul>
<p><strong>Also know:</strong> health checks remove unhealthy backends automatically; connection draining lets in-flight requests finish during a deploy; and an autoscaler (HPA) needs the right metric — for LLM serving, queue depth or concurrent requests is a far better signal than CPU.</p>`},

{q:"Docker and Kubernetes — the core concepts and why you need both",
roles:["aie"],lvl:"core",tags:["devops","high-freq"],
a:`<p><strong>Docker</strong> packages an application with its dependencies and runtime into a portable image. Solves "works on my machine."</p>
<ul>
<li><strong>Image</strong> — an immutable, layered template. <strong>Container</strong> — a running instance of an image. Many containers from one image.</li>
<li><strong>Layers are cached</strong>, so order your Dockerfile from least- to most-frequently-changing: base image, system packages, dependency manifest, <code>pip install</code>, then application code last. Copying code before installing dependencies invalidates the dependency layer on every commit.</li>
<li><strong>Multi-stage builds</strong> — compile in a heavy builder stage, copy only the artifacts into a slim runtime image. Smaller images, smaller attack surface.</li>
<li>Run as a non-root user, pin base image tags/digests, use <code>.dockerignore</code>, one process per container, log to stdout.</li>
</ul>
<p><strong>Kubernetes</strong> orchestrates containers across a cluster. <em>"Why not just run Docker?"</em> Docker runs containers on <em>one host</em>. Kubernetes handles everything that comes after: restarting crashed containers, scheduling across nodes, scaling replicas, rolling updates with zero downtime, service discovery, load balancing, config and secret injection, and self-healing.</p>
<pre><code>Pod           smallest unit — one or more containers sharing network + storage
 ↑
ReplicaSet    maintains N identical pods
 ↑
Deployment    manages ReplicaSets; owns rolling updates and rollback
 ↑
Service       stable virtual IP + DNS name in front of a changing pod set
 ↑
Ingress       external HTTP(S) routing, TLS termination, host/path rules</code></pre>
<p><strong>Also know:</strong> <code>ConfigMap</code> and <code>Secret</code> for configuration; <code>HorizontalPodAutoscaler</code> for scaling on metrics; <code>StatefulSet</code> for stateful workloads needing stable identity; <code>DaemonSet</code> for per-node agents; <code>Job</code>/<code>CronJob</code> for batch; <code>PersistentVolumeClaim</code> for storage; namespaces for isolation.</p>
<p><strong>Probes — they will ask, and the distinction matters:</strong></p>
<ul>
<li><strong>Liveness</strong> — is it alive? Failure → kubelet <em>restarts</em> the container.</li>
<li><strong>Readiness</strong> — can it serve traffic? Failure → removed from the Service endpoints, <em>not</em> restarted. Essential for slow startup (loading a model!) and for shedding load when a dependency is down.</li>
<li><strong>Startup</strong> — gates the other two during a long initialization, so a model that takes 3 minutes to load isn't killed by liveness before it ever starts.</li>
</ul>
<p><strong>Requests vs limits:</strong> requests drive scheduling and guarantee capacity; limits cap usage. Exceed a memory limit and the container is <strong>OOMKilled</strong>; exceed CPU and it's throttled, not killed. Setting no memory limit on a model server is how you take down a whole node.</p>`}
]},

{
title:"Caching, messaging & databases",
items:[
{q:"Why Redis? Caching patterns and what goes wrong",
roles:["aie"],lvl:"core",tags:["infra","high-freq"],
a:`<p><strong>Why:</strong> RAM access is nanoseconds, disk and network database round-trips are milliseconds. Caching a hot read removes a database query entirely.</p>
<pre><code>Without cache:  API → DB → response            (every request hits the DB)
With cache:     API → Redis → hit → response   (DB only on a miss)</code></pre>
<p><strong>Patterns:</strong></p>
<ul>
<li><strong>Cache-aside (lazy loading)</strong> — app checks cache, on miss reads the DB and writes the cache. Most common. Only caches what's actually requested; first request is always slow.</li>
<li><strong>Read-through</strong> — the cache layer fetches on miss. Same behaviour, cleaner app code.</li>
<li><strong>Write-through</strong> — write to cache and DB synchronously. Cache always fresh; writes are slower.</li>
<li><strong>Write-behind</strong> — write to cache, flush to DB asynchronously. Fast writes, risk of data loss.</li>
<li><strong>Write-around</strong> — write only to the DB, let reads populate the cache. Good for write-heavy, read-rare data.</li>
</ul>
<p><strong>Invalidation and eviction:</strong> TTL (simplest and usually right), explicit invalidation on write, and eviction policy when memory fills — <code>allkeys-lru</code> for a pure cache, <code>volatile-lru</code> when you also store non-cache data, <code>noeviction</code> if losing data is unacceptable (and then you must monitor memory).</p>
<p><strong>The failure modes to name — this is what distinguishes a real answer:</strong></p>
<ul>
<li><strong>Cache stampede / thundering herd</strong> — a hot key expires and 10,000 concurrent requests all miss and hit the DB simultaneously. Fix: a mutex/lock so only one request recomputes (others wait or serve stale), probabilistic early expiration, or refresh-ahead.</li>
<li><strong>Cache penetration</strong> — repeated requests for a key that doesn't exist bypass the cache every time. Fix: cache the negative result with a short TTL, or a Bloom filter.</li>
<li><strong>Hot key</strong> — one key concentrates all traffic onto one Redis shard. Fix: local in-process cache in front, or key sharding.</li>
<li><strong>Stale data</strong> — the eternal tradeoff. Be explicit about acceptable staleness per data type.</li>
</ul>
<p><strong>Redis beyond caching:</strong> session store, rate limiting (token bucket via INCR + EXPIRE), distributed locks (Redlock, with known caveats), pub/sub, Streams for lightweight queues, sorted sets for leaderboards, HyperLogLog for cardinality, and vector similarity search in Redis Stack.</p>`},

{q:"What happens if Redis goes down?",
roles:["aie"],lvl:"core",tags:["infra","incident","high-freq"],
a:`<p><strong>Immediate impact:</strong> every read becomes a cache miss, so <strong>100% of read traffic hits the database</strong>. If the cache was absorbing 90% of reads, the database instantly sees 10× its normal load. The database saturates its connection pool, latency climbs, timeouts begin, and the outage cascades from "the cache is down" to "the whole service is down."</p>
<p><strong>Secondary impact</strong> depends on what else you put in Redis: sessions gone means users logged out; rate limiting gone means no throttling (or, if it fails closed, everything is throttled); distributed locks gone means concurrency bugs.</p>
<p><strong>Recovery:</strong></p>
<ol>
<li><strong>Failover to a replica</strong> — Redis Sentinel or Cluster promotes a replica automatically. This is the primary answer.</li>
<li><strong>Circuit breaker on the cache client</strong> — after N consecutive failures, stop attempting Redis for a cooldown period. Otherwise every request pays the connection timeout <em>and then</em> hits the DB, which is strictly worse than no cache.</li>
<li><strong>Graceful degradation</strong> — the cache must be optional. A Redis error should log and fall through to the DB, never throw a 500 to the user.</li>
<li><strong>Load shedding and rate limiting</strong> to protect the database while the cache warms.</li>
<li><strong>Local in-process cache</strong> as a second tier, so a Redis outage isn't a total cache outage.</li>
<li><strong>Controlled cache warming</strong> — repopulate progressively rather than letting a stampede rebuild it.</li>
</ol>
<div class="say"><b>Say this:</b> "The real risk isn't the cache being unavailable — it's the database being overwhelmed by the traffic the cache was absorbing, which turns a degradation into a full outage. So I'd have three things in place: replica failover, a circuit breaker so requests don't pay a Redis timeout before falling through, and the cache treated as strictly optional in code so a Redis error never surfaces as a user-facing error. And I'd load-test the no-cache path deliberately, because that's the capacity that actually determines whether a cache outage is survivable."</div>`},

{q:"Kafka: why use it, and how do you fix consumer lag?",
roles:["aie"],lvl:"core",tags:["infra","high-freq"],
a:`<p><strong>Why:</strong> asynchronous, durable, decoupled communication.</p>
<pre><code>Tight coupling:   Service A ──sync HTTP──► Service B
                  (B down → A fails; B slow → A slow)

Decoupled:        Producer ──► Kafka (durable log) ──► Consumer
                  (B down → messages wait; B slow → lag, not failure)</code></pre>
<p><strong>Benefits:</strong> decoupling, buffering of traffic spikes, durability and replay (the log is retained, so you can reprocess history), multiple independent consumer groups reading the same topic, and horizontal scale via partitions.</p>
<p><strong>Core concepts:</strong> a <strong>topic</strong> is split into <strong>partitions</strong>; each partition is an ordered, append-only log. A <strong>consumer group</strong> divides partitions among its consumers — <strong>one partition is consumed by at most one consumer in a group</strong>, which is the fact that determines your maximum parallelism. <strong>Offsets</strong> track position. Ordering is guaranteed <em>within a partition only</em>, so if you need per-entity ordering you key by entity id so all its messages land on the same partition.</p>
<p><strong>Consumer lag — causes and fixes:</strong></p>
<table><thead><tr><th>Cause</th><th>Fix</th></tr></thead><tbody>
<tr><td>Consumers slower than producers</td><td>Scale consumers out — <strong>up to the partition count</strong>. Beyond that, adding consumers does nothing; you must add partitions.</td></tr>
<tr><td>Slow per-message processing (e.g. an LLM call per message)</td><td>Optimize the work, batch it, or move the heavy step to an async worker pool so the consumer only enqueues</td></tr>
<tr><td>Partition skew — one hot key</td><td>Change the partitioning key, or add a salt for high-volume keys</td></tr>
<tr><td>Downstream dependency slow (DB, API)</td><td>Fix the dependency; add bulkheads and timeouts so one slow call doesn't stall the consumer</td></tr>
<tr><td>Large messages</td><td>Store the payload in object storage, put a reference on the topic (claim-check pattern)</td></tr>
<tr><td>Frequent rebalances</td><td>Tune <code>max.poll.interval.ms</code> and <code>session.timeout.ms</code>; use cooperative sticky assignment. A consumer that takes too long between polls gets kicked, triggering a rebalance that makes lag worse</td></tr>
<tr><td>Poison message causing infinite retry</td><td>Dead-letter topic after N attempts</td></tr>
</tbody></table>
<p><strong>Also know:</strong> increasing partitions is effectively one-way (you can't reduce, and it changes key-to-partition mapping); delivery semantics (at-least-once is the default, so <strong>consumers must be idempotent</strong>; exactly-once requires transactions and the idempotent producer); and <code>acks=all</code> with <code>min.insync.replicas</code> for durability.</p>`},

{q:"SQL vs NoSQL, and database indexing",
roles:["aie","ds"],lvl:"core",tags:["databases","high-freq"],
a:`<table><thead><tr><th></th><th>SQL / Relational</th><th>NoSQL</th></tr></thead><tbody>
<tr><td>Schema</td><td>Fixed, enforced</td><td>Flexible</td></tr>
<tr><td>Guarantees</td><td>ACID transactions</td><td>Often eventual consistency (BASE)</td></tr>
<tr><td>Joins</td><td>First-class</td><td>Usually denormalize instead</td></tr>
<tr><td>Scaling</td><td>Vertical, then read replicas, then sharding</td><td>Horizontal by design</td></tr>
<tr><td>Best for</td><td>Financial transactions, anything needing correctness across rows, complex ad-hoc queries, reporting</td><td>High-volume writes, logs, events, flexible documents, key-value lookups, embeddings, time series</td></tr>
<tr><td>Examples</td><td>Postgres, MySQL, SQL Server</td><td>MongoDB (document), Cassandra (wide-column), Redis/DynamoDB (KV), Neo4j (graph), Milvus/Qdrant (vector), InfluxDB (time series)</td></tr>
</tbody></table>
<p><strong>The mature answer:</strong> pick by access pattern, not by fashion, and expect to use both. Postgres with JSONB covers a large share of "we need NoSQL flexibility" cases while keeping transactions — and pgvector means it can hold embeddings too, which is a genuinely good default for a small team. Mention <strong>CAP</strong> precisely: under a network partition you choose between consistency and availability; it is not a free three-way pick, and most systems are tunable (Cassandra lets you set consistency per query).</p>
<p><strong>Indexing:</strong> without an index, finding a row is a full table scan — O(n). With a B-tree index it's O(log n).</p>
<ul>
<li><strong>B-tree</strong> — the default. Supports equality, range, sorting, and prefix matching.</li>
<li><strong>Hash</strong> — equality only, slightly faster for that case.</li>
<li><strong>Composite</strong> — on (a, b, c). <strong>Leftmost-prefix rule:</strong> usable for queries filtering on a, or a+b, or a+b+c — but <em>not</em> for a query filtering only on b. Column order is a design decision, and getting it wrong is a very common cause of unused indexes.</li>
<li><strong>Covering index</strong> — includes all columns the query needs, so the engine never touches the table (index-only scan).</li>
<li><strong>Partial index</strong> — indexes a subset (<code>WHERE status = 'active'</code>). Much smaller and faster when your queries always include that predicate.</li>
<li><strong>GIN/GiST</strong> — full-text search, JSONB, arrays, geospatial.</li>
<li><strong>Clustered vs non-clustered</strong> — a clustered index determines physical row order (one per table); non-clustered indexes point at rows.</li>
</ul>
<p><strong>The downside — they always ask:</strong> every index consumes storage and must be updated on every INSERT, UPDATE and DELETE, so writes get slower. Unused indexes are pure cost. Indexes on low-cardinality columns (a boolean) are usually worthless because the planner will prefer a scan. And an index can't be used if you wrap the column in a function (<code>WHERE YEAR(created_at) = 2026</code> won't use an index on <code>created_at</code> — use a range predicate or a functional index instead). Read the <code>EXPLAIN ANALYZE</code> plan rather than guessing.</p>`}
]},

{
title:"APIs, auth & security",
items:[
{q:"REST API design: methods, status codes, and what makes a good API",
roles:["aie"],lvl:"core",tags:["api","high-freq"],
a:`<table><thead><tr><th>Method</th><th>Purpose</th><th>Idempotent?</th><th>Safe?</th></tr></thead><tbody>
<tr><td>GET</td><td>Read</td><td>Yes</td><td>Yes</td></tr>
<tr><td>POST</td><td>Create / action</td><td><strong>No</strong></td><td>No</td></tr>
<tr><td>PUT</td><td>Replace entire resource</td><td>Yes</td><td>No</td></tr>
<tr><td>PATCH</td><td>Partial update</td><td>Not necessarily</td><td>No</td></tr>
<tr><td>DELETE</td><td>Remove</td><td>Yes</td><td>No</td></tr>
</tbody></table>
<p><strong>Status codes:</strong> 200 OK · 201 Created · 202 Accepted (async work started) · 204 No Content · 304 Not Modified · <strong>400</strong> Bad Request (malformed) · <strong>401</strong> Unauthorized (not authenticated) · <strong>403</strong> Forbidden (authenticated but not permitted) · 404 Not Found · 409 Conflict · 422 Unprocessable Entity (valid syntax, invalid semantics) · <strong>429</strong> Too Many Requests · 500 Internal Server Error · 502 Bad Gateway · 503 Service Unavailable · 504 Gateway Timeout.</p>
<p><strong>The 401 vs 403 distinction is a favourite:</strong> 401 means "I don't know who you are" — retry with credentials. 403 means "I know who you are and you may not do this" — retrying won't help.</p>
<p><strong>What makes an API good:</strong></p>
<ul>
<li><strong>Resource-oriented naming</strong> — <code>/users/123/orders</code>, plural nouns, no verbs in paths.</li>
<li><strong>Versioning</strong> — <code>/v1/</code> in the path or an <code>Accept</code> header. Never break a published contract.</li>
<li><strong>Pagination</strong> — cursor-based for large or changing datasets (offset pagination gets slow and skips/duplicates rows as data shifts).</li>
<li><strong>Idempotency keys</strong> on POST, so a client retry doesn't double-charge.</li>
<li><strong>Consistent, structured errors</strong> — a machine-readable code plus a human message plus a request id.</li>
<li><strong>Rate limiting</strong> with <code>429</code> and <code>Retry-After</code>, plus <code>X-RateLimit-*</code> headers.</li>
<li><strong>Request ids propagated</strong> for tracing across services.</li>
<li>Timeouts, retries with exponential backoff <em>and jitter</em>, and circuit breakers on the client side.</li>
</ul>
<p><strong>For AI endpoints specifically:</strong> stream long generations (SSE); return a job id with a polling or webhook callback for anything over ~30 seconds; include token usage in the response; and surface the model and prompt version so responses are attributable.</p>`},

{q:"Explain JWT in full — structure, verification, and the tradeoffs",
roles:["aie"],lvl:"core",tags:["security","high-freq"],
a:`<p><strong>JWT (JSON Web Token)</strong> is a compact, signed token used to carry identity and claims between a client and a server — a digital identity card the client presents on every request, so the server doesn't need to store session state.</p>
<p><strong>Why it exists:</strong> HTTP is stateless. After login, the next request has no inherent way to say who the user is. The alternative — a server-side session — requires shared session storage across every instance.</p>
<pre><code>Login (credentials) → server verifies → issues JWT
                                            ↓
Client stores it, then on every request:
    Authorization: Bearer xxxxx.yyyyy.zzzzz
                                            ↓
Server verifies the signature → trusts the claims → responds</code></pre>
<p><strong>Structure — three base64url segments separated by dots:</strong></p>
<pre><code>Header.Payload.Signature

Header:    {"alg": "RS256", "typ": "JWT", "kid": "key-1"}
Payload:   {"sub": "101", "name": "Zaid", "role": "Admin",
            "iss": "https://auth.company.com",
            "aud": "api://reims",
            "iat": 1780000000, "exp": 1780003600}
Signature: RSASHA256(base64(header) + "." + base64(payload), privateKey)</code></pre>
<p><strong>The payload is encoded, NOT encrypted.</strong> Anyone holding the token can decode and read it. Never put passwords, secrets or sensitive PII in a JWT. (JWE exists for encrypted tokens, but a plain JWT is signed only.)</p>
<p><strong>Verification:</strong> the server recomputes the signature over the received header and payload using its secret (HS256) or the issuer's public key (RS256), and compares. If an attacker edits <code>"role": "User"</code> to <code>"role": "Admin"</code>, the payload no longer matches the signature and they cannot forge a new one without the key — so the token is rejected. The server must <em>also</em> validate <code>exp</code>, <code>iss</code>, <code>aud</code>, and the expected <code>alg</code>.</p>
<p><strong>Standard claims:</strong> <code>sub</code> (subject/user id), <code>iss</code> (issuer), <code>aud</code> (audience), <code>exp</code> (expiry), <code>iat</code> (issued at), <code>nbf</code> (not before), <code>jti</code> (unique token id, used for revocation lists).</p>
<table><thead><tr><th></th><th>JWT (stateless)</th><th>Server sessions (stateful)</th></tr></thead><tbody>
<tr><td>Server storage</td><td>None</td><td>Session store (Redis/DB)</td></tr>
<tr><td>Verification</td><td>Signature check — no DB lookup</td><td>Store lookup per request</td></tr>
<tr><td>Horizontal scaling</td><td>Trivial</td><td>Needs shared session storage</td></tr>
<tr><td><strong>Revocation</strong></td><td><strong>Hard</strong> — valid until expiry</td><td>Trivial — delete the session</td></tr>
<tr><td>Size</td><td>Larger (sent every request)</td><td>Small cookie</td></tr>
</tbody></table>
<div class="trap"><b>The revocation problem, and the real-world answer.</b> If a token is valid for 24 hours and an account is compromised, that token keeps working. The standard solution: <strong>short-lived access tokens (5–15 minutes) plus a long-lived refresh token</strong>. Revocation then only needs to invalidate the refresh token, and the access token expires on its own within minutes. For immediate revocation you add a denylist of <code>jti</code> values or a "tokens issued before" timestamp per user — but note that reintroduces state, which is the tradeoff.</div>
<p><strong>Storage:</strong> <strong>HttpOnly, Secure, SameSite cookies</strong> are preferred for web apps — localStorage is readable by any XSS payload. Cookies need CSRF protection in return. Mobile: Keychain / Keystore.</p>
<p><strong>Security pitfalls to name:</strong> accepting <code>alg: none</code>; algorithm confusion (a server configured for RS256 tricked into verifying an HS256 token using the public key as the HMAC secret); not validating <code>aud</code> so a token for one service is accepted by another; and putting too many claims in, making the token huge.</p>
<div class="say"><b>Two-minute answer:</b> "JWT is a compact signed token for stateless auth. After login the server issues a token containing claims — user id, role, expiry — signs it, and the client sends it in the Authorization header on every request. The server verifies the signature to confirm it wasn't tampered with and then trusts the claims, so no session storage and no per-request database lookup, which makes it ideal for microservices. The important caveats are that the payload is encoded rather than encrypted, so nothing sensitive goes in it, and that revocation before expiry is hard — which is why production systems use short-lived access tokens with refresh tokens rather than long-lived JWTs."</div>`},

{q:"What is OAuth, and how is it different from JWT?",
roles:["aie"],lvl:"core",tags:["security","high-freq"],
a:`<p><strong>The one-line distinction to lead with: JWT is a token <em>format</em>; OAuth 2.0 is an authorization <em>framework</em>.</strong> They solve different problems and are routinely used together.</p>
<p><strong>OAuth 2.0</strong> lets an application access a user's resources in another service <em>without ever seeing the user's password</em>, with scoped, revocable permissions.</p>
<pre><code>The bad way:                    OAuth:
App: "give me your              App → redirect to Google
      Google password"          Google authenticates the user
                                Google: "Allow this app to read your email?"
Problems:                       User: Allow
 · app knows your password      Google → Access Token → App
 · app breach = account breach  App → calls Google APIs with the token
 · no way to limit scope
 · no way to revoke             The app never sees the password.</code></pre>
<p><strong>Four actors:</strong></p>
<ul>
<li><strong>Resource Owner</strong> — the user.</li>
<li><strong>Client</strong> — the application requesting access.</li>
<li><strong>Authorization Server</strong> — issues tokens (Google, Microsoft Entra ID, Okta, Auth0, Keycloak).</li>
<li><strong>Resource Server</strong> — the API holding the data (Google Drive API, your own backend).</li>
</ul>
<p><strong>Scopes</strong> implement least privilege: a client granted <code>email profile</code> cannot read Drive, because it never requested <code>drive.read</code>. Scopes are also what the consent screen shows the user.</p>
<p><strong>Grant types:</strong> <strong>Authorization Code + PKCE</strong> is the correct choice for web and mobile apps today (PKCE prevents interception of the code); <strong>Client Credentials</strong> for machine-to-machine; Device Code for TVs and CLIs. <em>Implicit</em> and <em>Password</em> grants are deprecated — knowing that is a small but real signal.</p>
<p><strong>Access token vs refresh token:</strong> the access token is short-lived (minutes to an hour) and sent with every API call; the refresh token is long-lived and used only to obtain a new access token, so the user isn't forced to re-authenticate hourly. Refresh tokens should rotate on use.</p>
<table><thead><tr><th>Technology</th><th>Answers</th></tr></thead><tbody>
<tr><td><strong>JWT</strong></td><td>"How do I represent identity and claims in a verifiable token?" — a format</td></tr>
<tr><td><strong>OAuth 2.0</strong></td><td>"How does an app get permission to access a user's resources?" — <em>authorization</em></td></tr>
<tr><td><strong>OIDC</strong></td><td>"Who is this user?" — an <em>authentication</em> layer on top of OAuth 2.0, adding the <strong>ID token</strong> (a JWT), a userinfo endpoint and a discovery document</td></tr>
</tbody></table>
<p><strong>The precise point that impresses:</strong> OAuth 2.0 alone is <em>not</em> authentication — it answers "can this app access this resource," not "who is this person." Using a raw OAuth access token as proof of identity is a known anti-pattern. <strong>OpenID Connect</strong> is the authentication layer built on OAuth 2.0, and "Sign in with Google" is OIDC, not bare OAuth. Do OAuth and JWT overlap? Yes — OAuth defines <em>how</em> tokens are issued, and those tokens are usually JWTs. OAuth is the process; JWT is the container.</p>
<div class="say"><b>Analogy that lands:</b> "JWT is the passport — a signed document containing identity claims that anyone can verify. OAuth is the visa process — the procedure by which permission is granted and scoped. And OIDC is the part of the process that establishes who you actually are."</div>`},

{q:"A new user opens the app. Walk me through the full authentication and authorization flow.",
roles:["aie"],lvl:"senior",tags:["security","high-freq","senior-signal"],
a:`<pre><code> 1. User opens the app                      → not authenticated
 2. Clicks "Login with Microsoft"
 3. Redirect to the Identity Provider        ← authorization request + PKCE challenge
 4. IdP authenticates: password + MFA        ← AUTHENTICATION happens here, not in your app
 5. Consent screen: "App wants your profile" ← user grants scopes
 6. IdP redirects back with an auth CODE
 7. Backend exchanges code (+ PKCE verifier) for tokens
        → ID token (JWT: who the user is)
        → Access token (what the app may call)
        → Refresh token
 8. Backend VERIFIES the ID token
        · signature against the IdP's JWKS (by kid)
        · exp not passed, iss matches, aud matches, nonce matches
 9. First login? → create the local user record
        users: id=101, email, external_sub, role=User, created_at
10. Backend issues ITS OWN session JWT
        {"userId":101, "role":"Engineer", "plant":"Jamnagar", "tenant":"..."}
11. Frontend stores it — HttpOnly, Secure, SameSite cookie
12. Every subsequent request:  Authorization: Bearer <JWT>  (or the cookie)
13. AUTHENTICATION: verify signature + expiry → identity established
14. AUTHORIZATION: check role/permissions for THIS action
        DELETE /users with role=Engineer → 403 Forbidden
15. Response</code></pre>
<p><strong>Why the backend issues its own token at step 10</strong> — the question they'll drill into. The IdP knows the user's corporate identity; it does <em>not</em> know your application's internal user id, roles, tenant, feature flags or resource scopes. Your own token carries application-specific claims. It also decouples you from the IdP's token lifetime and lets you support multiple IdPs behind one internal session model.</p>
<p><strong>The two flows in production:</strong></p>
<ol>
<li><strong>Local credentials</strong> — your backend verifies the password (against an Argon2id/bcrypt hash) and issues the JWT itself.</li>
<li><strong>Federated / enterprise SSO</strong> — the IdP authenticates via OAuth 2.0 + OIDC, your backend verifies the ID token and issues its own session token. <strong>This is what almost every enterprise application does</strong>, and it's the one to describe.</li>
</ol>
<table><thead><tr><th>Authentication</th><th>Authorization</th></tr></thead><tbody>
<tr><td>Who are you?</td><td>What may you do?</td></tr>
<tr><td>Login, MFA, SSO</td><td>Roles, permissions, policies, ACLs</td></tr>
<tr><td>Happens first</td><td>Happens on every request, per action</td></tr>
<tr><td>Returns an identity</td><td>Returns allow / deny</td></tr>
<tr><td>401 on failure</td><td>403 on failure</td></tr>
</tbody></table>
<div class="say"><b>Tie it to your own system — this is the version to rehearse:</b> "In the enterprise assistant I built, employees authenticated through Microsoft Entra ID with MFA, so we never stored credentials. The backend validated the ID token against Entra's JWKS, then issued its own JWT carrying the internal user id, role, plant and allowed sites. Authorization then happened at two levels: the API gateway checked the role for the endpoint, and — the part that mattered most — the retrieval layer extracted the plant and role claims and applied them as metadata filters on the vector search, so the same question returned different documents depending on who asked. That's enforced server-side from the verified token, never from anything the model or the client could influence."</div>`},

{q:"Security best practices for a production AI system",
roles:["aie","agentic"],lvl:"senior",tags:["security","senior-signal"],
a:`<p><strong>Standard application security:</strong></p>
<ul>
<li>TLS everywhere, HSTS, no plaintext internal hops in a zero-trust setup</li>
<li>Secrets in a manager (Vault, AWS Secrets Manager, Azure Key Vault) — never in code, images or environment files committed to git; rotate them</li>
<li>OIDC/OAuth for identity, short-lived tokens, refresh rotation</li>
<li><strong>RBAC/ABAC with least privilege</strong>, enforced server-side on every request</li>
<li>Input validation and parameterized queries (never string-concatenate SQL — and never let an LLM write raw SQL against a privileged connection)</li>
<li>Rate limiting and quotas per user and per tenant</li>
<li>Encryption at rest and in transit; field-level encryption for sensitive columns</li>
<li>Dependency and container scanning in CI; patch cadence</li>
<li>Audit logging of who did what, when — immutable and retained</li>
</ul>
<p><strong>AI-specific, which is what they're really asking:</strong></p>
<ul>
<li><strong>Prompt injection defense</strong> — treat all retrieved content and tool output as untrusted data, never instructions. Structural separation plus least-privilege tools. (See the agent guardrails card.)</li>
<li><strong>PII handling</strong> — detect and mask before content reaches the model <em>and</em> before it reaches your logs. Traces are a serious and commonly overlooked PII sink. Confirm the provider's data retention and training terms, and use zero-retention endpoints where required.</li>
<li><strong>Multi-tenant isolation</strong> — tenant id in every cache key, every retrieval filter, every log line. The classic breach here is a semantic cache without tenant scoping serving one customer's answer to another.</li>
<li><strong>Document-level access control</strong> — store ACLs on chunks and resolve them against the caller's identity at query time. Do not rely on telling the model which documents it may use.</li>
<li><strong>Output filtering</strong> — scan generated text for secrets, PII, and internal identifiers before returning it. Models will happily echo an API key that appeared in retrieved context.</li>
<li><strong>Model/supply-chain security</strong> — pin model versions; never load a pickle or arbitrary checkpoint from an untrusted source (pickle deserialization is remote code execution — prefer safetensors); review MCP servers before enabling them.</li>
<li><strong>Sandboxed execution</strong> for code-running tools: no network, no credentials, resource limits, ephemeral filesystem.</li>
<li><strong>Jailbreak and abuse monitoring</strong> — track safety-filter trigger rates per user and alert on patterns.</li>
<li><strong>Training-data governance</strong> — know what's in your fine-tuning data, and be able to honour deletion requests.</li>
</ul>
<div class="say"><b>The framing that lands:</b> "The shift with AI systems is that the model is a confused-deputy risk: it has your tool permissions and it takes instructions from text it reads. So I stop trying to make the model un-trickable and instead make a successful trick survivable — scoped credentials per tool, the user's real ACLs enforced server-side at the retrieval layer, allowlisted egress, sandboxed execution, and human approval on anything irreversible. Prompt hardening and injection classifiers are defense in depth on top of that, not the control."</div>`}
]},

{
title:"Incident playbooks",
items:[
{q:"The production API is suddenly slow. How do you investigate?",
roles:["aie"],lvl:"core",tags:["incident","high-freq"],
a:`<p><strong>Answer with a framework, not a list of guesses.</strong> Interviewers are testing how you think under pressure.</p>
<div class="say"><b>The framework to state upfront:</b> Observe → Scope → Isolate the bottleneck → Mitigate → Root cause → Prevent recurrence.</div>
<p><strong>1. Observe — quantify before touching anything.</strong> Dashboards: latency p50/p95/p99, error rate, request rate, saturation. Is latency actually up, or is one client complaining? Has traffic changed?</p>
<p><strong>2. Scope it.</strong> Global or one endpoint? All users or one tenant/region? Started gradually (capacity) or as a step change (a deploy or config change)?</p>
<p><strong>3. Correlate with changes.</strong> <em>Check recent deployments first.</em> Most incidents are caused by a change — a deploy, a feature flag, a config push, a schema migration, a dependency upgrade. This is the highest-prior-probability cause and it's the fastest to rule out.</p>
<p><strong>4. Isolate the layer, using traces rather than intuition.</strong> A distributed trace gives you the latency breakdown per span immediately:</p>
<ul>
<li><strong>Infrastructure</strong> — CPU, memory, disk I/O, network, GC pauses, thread/connection pool saturation</li>
<li><strong>Database</strong> — slow query log, missing index, lock contention, connection pool exhaustion, replication lag</li>
<li><strong>Cache</strong> — hit rate dropped? Redis latency? Did a deploy change a cache key and invalidate everything?</li>
<li><strong>Downstream services and third-party APIs</strong> — is a dependency slow and is your timeout too generous?</li>
<li><strong>Queue depth</strong> — work backing up</li>
<li><strong>The application</strong> — a new N+1 query, a hot loop, synchronous I/O in a request path</li>
</ul>
<p><strong>5. Mitigate before you fully understand.</strong> Roll back the suspect deploy, flip the feature flag off, scale out, restart unhealthy instances, raise the cache TTL, shed non-critical load, enable a degraded mode. <em>Restore service, then investigate.</em> Saying this explicitly is a strong signal — junior answers keep debugging while users are down.</p>
<p><strong>6. Root cause</strong> with profilers, heap dumps, query plans, and logs from the affected window.</p>
<p><strong>7. Prevent</strong> — add the missing alert, fix the timeout, add the index, add a load test for this path, write the postmortem with action items.</p>
<p><strong>For an AI service specifically,</strong> add: LLM provider latency and rate-limit/429 rate, token counts per request (did a prompt change make context 5× longer?), vector search latency, reranker latency, retrieval result count, and whether the prefix cache hit rate collapsed because someone edited the system prompt.</p>`},

{q:"CPU is at 100%. Memory keeps increasing. A pod keeps crashing.",
roles:["aie"],lvl:"core",tags:["incident","high-freq"],
a:`<p><strong>CPU at 100% — check in this order:</strong></p>
<ol>
<li><strong>Is it a traffic spike or the same traffic costing more?</strong> Divide CPU by request rate. If cost-per-request rose, it's a code or data change, not load.</li>
<li>Recent deploy? An accidental O(n²), a regex catastrophe, a removed cache.</li>
<li>Infinite or hot loop — a thread dump or profiler shows it immediately.</li>
<li>Heavy queries or serialization of large payloads.</li>
<li>Excessive logging (especially debug logging left on, or logging full LLM prompts).</li>
<li>GC thrashing — high CPU with high GC time usually means a <em>memory</em> problem presenting as CPU.</li>
<li>Thread pool exhaustion / context-switch storms.</li>
<li>Is autoscaling working? Are CPU limits throttling the container (check <code>throttled_time</code>)?</li>
</ol>
<p><strong>Tools:</strong> <code>top</code>/<code>htop</code>, <code>kubectl top pod</code>, py-spy or async-profiler for a live flame graph, APM traces, GC logs.</p>
<p><strong>Memory climbing steadily — the classic leak signatures:</strong></p>
<ul>
<li><strong>Unbounded in-process cache or dict</strong> — the single most common cause. No TTL, no max size.</li>
<li><strong>Unclosed resources</strong> — DB connections, file handles, HTTP sessions not released.</li>
<li><strong>Accumulating conversation history</strong> — very common in chat/agent services: a session dict that never evicts.</li>
<li><strong>Reloading a model per request</strong> instead of once at startup.</li>
<li><strong>Listeners/callbacks registered and never removed.</strong></li>
<li><strong>Fragmentation</strong> in long-running processes.</li>
</ul>
<p><strong>Diagnose:</strong> heap dump and compare two snapshots (<code>tracemalloc</code>, <code>objgraph</code>, memray for Python), watch RSS vs heap, check GC logs. <strong>Mitigate:</strong> set a memory limit and let Kubernetes restart the pod while you fix it, bound every cache, and add a memory-growth alert rather than waiting for OOM.</p>
<p><strong>A pod keeps crashing — the exact sequence:</strong></p>
<pre><code>kubectl describe pod <name>        # Events: OOMKilled? CrashLoopBackOff? ImagePullBackOff?
kubectl logs <name>                # current container
kubectl logs <name> --previous     # ← THE crashed container's logs. Most people miss this.
kubectl get events --sort-by=.lastTimestamp</code></pre>
<table><thead><tr><th>Signal</th><th>Meaning</th><th>Fix</th></tr></thead><tbody>
<tr><td><code>OOMKilled</code> (exit 137)</td><td>Exceeded the memory limit</td><td>Raise the limit or fix the leak. Note: a model server's memory is dominated by the model, so size limits from measured RSS, not guesses</td></tr>
<tr><td><code>CrashLoopBackOff</code></td><td>Repeatedly failing to start</td><td>Read <code>--previous</code> logs: missing env var, missing secret, bad config, failed migration, port conflict</td></tr>
<tr><td>Liveness probe failing</td><td>App unhealthy, or just slow to start</td><td>Add a <strong>startup probe</strong> — a model that takes 3 minutes to load will be killed by a liveness probe before it ever becomes ready</td></tr>
<tr><td><code>ImagePullBackOff</code></td><td>Bad tag or registry credentials</td><td>Fix the tag / imagePullSecret</td></tr>
<tr><td>Exit 1 immediately</td><td>Unhandled startup exception</td><td>Logs</td></tr>
<tr><td>Node pressure / eviction</td><td>Node out of memory or disk</td><td>Set requests properly; check node capacity</td></tr>
</tbody></table>
<div class="say"><b>The line that shows you've done this:</b> "The first thing I run is <code>kubectl logs --previous</code>, because the current container's logs are from the fresh attempt and the interesting output is in the one that died. Then <code>describe</code> for the events — OOMKilled versus a probe failure versus an image pull are completely different problems, and the event tells you which one in one line."</div>`},

{q:"Database is overloaded. Traffic doubled overnight. How do you respond?",
roles:["aie"],lvl:"core",tags:["incident","high-freq"],
a:`<p><strong>Database overloaded — diagnose:</strong></p>
<ul>
<li><strong>Slow query log</strong> and <code>pg_stat_statements</code> — find the top queries by total time, not just by individual duration. A 20ms query run 100,000 times is the problem, not the 2-second report.</li>
<li>Missing indexes / full table scans — read the <code>EXPLAIN ANALYZE</code> plan.</li>
<li><strong>Connection pool exhaustion</strong> — often the real issue. Too many app instances × a large per-instance pool exceeds the DB's max connections.</li>
<li>Lock contention and long-running transactions blocking others.</li>
<li>Replication lag causing reads to fall back to the primary.</li>
<li>An N+1 query pattern introduced by an ORM change.</li>
<li>Autovacuum not keeping up; table bloat.</li>
</ul>
<p><strong>Reduce load, roughly in order of speed to apply:</strong></p>
<ol>
<li><strong>Cache</strong> the hot reads in Redis — fastest lever with the biggest effect.</li>
<li><strong>Add the missing index</strong> (concurrently, to avoid locking).</li>
<li><strong>Route reads to replicas</strong>; accept the replication lag where it's tolerable.</li>
<li><strong>Connection pooler</strong> (PgBouncer) so hundreds of app connections multiplex onto a few DB connections.</li>
<li><strong>Batch writes</strong> and move non-urgent work to a queue.</li>
<li><strong>Kill long-running queries</strong>, add statement timeouts.</li>
<li><strong>Rate limit</strong> or shed expensive endpoints.</li>
<li>Then the structural work: denormalize hot paths, materialized views for aggregations, archive cold data, partition large tables, and only then shard.</li>
</ol>
<p><strong>Traffic doubled overnight — the scaling playbook:</strong></p>
<ol>
<li><strong>Verify autoscaling actually fired.</strong> Check HPA events, node capacity, and whether you hit a max-replica ceiling or a cloud quota. Most "we couldn't scale" incidents are a ceiling nobody raised.</li>
<li><strong>Scale the stateless tier horizontally</strong> — API pods, workers. This should be automatic.</li>
<li><strong>Find the bottleneck that doesn't autoscale</strong> — usually the database, a third-party API rate limit, or a GPU pool.</li>
<li><strong>Kafka consumers</strong> — scale out, up to the partition count; add partitions if you're at the ceiling.</li>
<li><strong>Redis</strong> — add capacity/replicas to absorb the extra reads.</li>
<li><strong>Database</strong> — add read replicas, enable the pooler, raise cache TTLs to trade freshness for capacity.</li>
<li><strong>Protect the system:</strong> rate limit abusive clients, enable a queue with backpressure rather than dropping requests, and degrade gracefully (serve cached or simplified responses) rather than failing.</li>
<li><strong>For AI services specifically:</strong> check provider rate limits (you'll hit a 429 wall before you hit a compute wall), raise concurrency limits, spread across regions or providers, route more traffic to cheaper/smaller models, and let the request queue grow with a published SLO rather than timing everyone out.</li>
<li><strong>Watch continuously</strong> — latency, error rate, saturation, queue depth, cost per request. And afterwards, capacity-plan and load-test for 3× so the next doubling is boring.</li>
</ol>`},

{q:"The LLM started hallucinating after a deployment. Vector search latency spiked. Debug both.",
roles:["aie","agentic"],lvl:"senior",tags:["incident","rag","senior-signal"],
a:`<p><strong>LLM hallucinating after a deploy — this is a regression, so find the change.</strong> Diff the deployment, don't theorize:</p>
<ol>
<li><strong>Prompt change</strong> — was the system prompt edited? Did the grounding instruction or the "say I don't know" clause get removed or reworded?</li>
<li><strong>Model version change</strong> — did someone bump the model, or did the provider silently update an alias? Pin versions; this is a real and common cause with no code change on your side.</li>
<li><strong>Generation parameters</strong> — was temperature raised? Was max_tokens lowered so answers truncate mid-reasoning?</li>
<li><strong>Retrieval changed</strong> — different embedding model (did the index get re-embedded consistently, or is the query using a new model against an old index?), different chunk size, different top_k, reranker removed, threshold lowered.</li>
<li><strong>Context truncation</strong> — did the prompt grow past the window so retrieved context is being silently cut? Check token counts per request before and after.</li>
<li><strong>Context ordering</strong> — did the assembly order change, burying the relevant chunk mid-context?</li>
<li><strong>Index state</strong> — was the vector index rebuilt, partially rebuilt, or is it serving a stale snapshot? Was a data sync job failing quietly?</li>
<li><strong>Citations</strong> — are they present and do they actually resolve? Broken citations usually mean the context isn't reaching the model at all.</li>
</ol>
<p><strong>Then:</strong> roll back first, restore service, and only then bisect the change set against your eval suite. <strong>And afterwards, wire the eval suite into CI as a deploy gate</strong> — this incident is definitionally a missing gate, and saying so is the strongest part of the answer.</p>
<p><strong>Vector search latency spiked — diagnose:</strong></p>
<ul>
<li><strong>Collection growth</strong> — crossed a threshold where the index no longer fits in RAM and started paging. The most common cause, and it looks like a sudden cliff rather than a gradual slope.</li>
<li><strong>Index health</strong> — was it rebuilt? Is it in a degraded or rebuilding state? Are there unmerged segments from a bulk insert?</li>
<li><strong>Parameters changed</strong> — <code>ef_search</code> or <code>nprobe</code> raised (more accuracy, more latency); <code>top_k</code> increased.</li>
<li><strong>Metadata filtering</strong> — a newly-added selective filter can force a fallback to brute-force scan when the graph can't satisfy it. <strong>Check this early; it's the sneakiest cause.</strong></li>
<li><strong>Embedding dimensionality</strong> or model change increasing vector size.</li>
<li><strong>Query volume / concurrency</strong> — thread pool saturation, no connection pooling.</li>
<li><strong>Resource contention</strong> — CPU, memory pressure, noisy neighbours; network latency if the store is remote.</li>
<li><strong>Hot partition / shard imbalance.</strong></li>
</ul>
<p><strong>Optimize:</strong> tune <code>ef_search</code>/<code>nprobe</code> to the recall you actually need (measure it — people run at maximum recall by default and pay for it); switch to a better index type (HNSW if you're on flat, IVF-PQ if memory-bound); pre-filter on a partitioned index rather than post-filtering; reduce dimensions (Matryoshka truncation); cache frequent queries; scale horizontally or shard; and colocate the store with the application to remove a network hop.</p>
<div class="say"><b>The senior framing for both:</b> "Both of these are regressions, so my first move is the change log, not the theory — deploys, config pushes, index rebuilds and provider model updates, in that order. I'd roll back to restore service and bisect afterwards. And the follow-up action for the hallucination case is the real answer: if a prompt or retrieval change can reach production without running an eval suite, the incident will recur. The fix is a deploy gate, not a better prompt."</div>`}
]}
]});
