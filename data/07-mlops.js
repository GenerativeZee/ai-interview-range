PREP.push({
id:"mlops", n:"07", title:"MLOps & LLMOps", icon:"⟳",
blurb:"Lifecycle, MLflow and registries, feature stores, deployment patterns, LLM serving economics, drift detection with the actual thresholds, and retraining strategy. This is where candidates with notebook-only experience get filtered out.",
topics:[
{
title:"Lifecycle & tooling",
items:[
{q:"What is MLOps, and what does the full lifecycle look like?",
roles:["ds","aie"],lvl:"core",tags:["mlops","high-freq"],
a:`<p>DevOps principles applied to ML — but with three things software doesn't have: <strong>data as a versioned dependency</strong>, <strong>models that decay without any code change</strong>, and <strong>experiment reproducibility</strong>.</p>
<pre><code>     Business problem
            ↓
     Data ingestion ──────────┐
            ↓                 │
     Data validation          │  (Great Expectations,
            ↓                 │   Deequ, schema checks)
     Feature engineering ─────┤
            ↓                 │
     Training ────────────────┤  (tracked: params, metrics,
            ↓                 │   data version, code SHA)
     Evaluation + gates ──────┤
            ↓                 │
     Model registry ──────────┤  (versions, stage, lineage)
            ↓                 │
     Deployment ──────────────┤  (canary → full)
            ↓                 │
     Monitoring ──────────────┘
            ↓
     Drift / decay detected → retrain (back to the top)</code></pre>
<p><strong>What MLOps covers beyond DevOps:</strong> data versioning and validation, experiment tracking, a model registry with lineage, reproducible training pipelines, feature stores to kill training/serving skew, model and data monitoring, automated retraining, and governance (approval, audit trail, explainability records).</p>
<p><strong>Maturity levels — a good frame to offer:</strong></p>
<ul>
<li><strong>Level 0:</strong> manual. Notebook → pickle → someone deploys it. No tracking, no reproducibility.</li>
<li><strong>Level 1:</strong> automated training pipeline, tracked experiments, registry, manual deploy, basic monitoring.</li>
<li><strong>Level 2:</strong> CI/CD plus <strong>continuous training</strong> — drift or a schedule triggers a pipeline that retrains, evaluates against gates, and promotes automatically with a canary rollout and automatic rollback.</li>
</ul>
<div class="say"><b>Say this:</b> "MLOps is DevOps plus the two things that make ML different: the data is a versioned dependency, and the model degrades in production without anyone touching the code. So the pieces I care about are reproducibility — I can rebuild any model from a code SHA plus a data version — and closing the loop, where monitoring detects degradation and triggers a retraining pipeline with automated evaluation gates rather than a human noticing months later."</div>`},

{q:"Why MLflow, and what is a model registry for?",
roles:["ds","aie"],lvl:"core",tags:["mlops","high-freq"],
a:`<p><strong>MLflow's four components:</strong></p>
<ul>
<li><strong>Tracking</strong> — log parameters, metrics, artifacts, code version and data version per run. Solves "which of my 200 experiments produced the model we deployed?"</li>
<li><strong>Projects</strong> — packaged, reproducible runs.</li>
<li><strong>Models</strong> — a standard packaging format with a flavour (sklearn, pytorch, pyfunc) so the same artifact can be served anywhere.</li>
<li><strong>Model Registry</strong> — versioned models with stage transitions, annotations, approvals and lineage.</li>
</ul>
<p><strong>What the registry actually buys you:</strong></p>
<ul>
<li><strong>Versioning with lineage</strong> — model v5 traces back to the exact run, code commit, data snapshot and hyperparameters.</li>
<li><strong>Stage transitions</strong> — Staging → Production → Archived, with a controlled promotion step that can require approval.</li>
<li><strong>A stable reference for serving.</strong> The deployment points at <code>models:/churn_model@production</code> rather than a file path, so promoting a new version doesn't require a code change or redeploy.</li>
<li><strong>Rollback</strong> — reassign the alias to the previous version. Seconds, not a rebuild.</li>
<li><strong>Audit trail</strong> — who promoted what, when, with what metrics. In a regulated domain this is mandatory.</li>
</ul>
<p><strong>In Databricks specifically:</strong> models live in <strong>Unity Catalog</strong> (three-level namespace <code>catalog.schema.model</code>), which unifies model governance with table and volume governance — so the same permission model covers your data and your models, and lineage spans from source table to serving endpoint. Worth naming if Databricks is on your CV.</p>
<div class="say"><b>Say this:</b> "Tracking answers 'what did I run and what did it score'; the registry answers 'what is in production, where did it come from, and how do I roll back'. The operational value is that serving references an alias rather than an artifact path, so promotion and rollback are metadata operations instead of deployments. In my Databricks work the models lived in Unity Catalog, which put model permissions and lineage in the same governance model as the underlying tables."</div>`},

{q:"What is a feature store and what problem does it solve?",
roles:["ds","aie"],lvl:"senior",tags:["mlops","senior-signal"],
a:`<p>A centralized system for defining, computing, storing and serving features — with <strong>one definition</strong> used by both training and inference.</p>
<p><strong>The problem it solves — training/serving skew.</strong> The classic failure: training features are computed in a Spark/SQL batch job over historical data; serving features are recomputed in application code in Python at request time. The two implementations diverge in some small way — a different null handling, a different time-window boundary, a different rounding — and the model silently degrades in production while offline metrics stay perfect. This is one of the most common and hardest-to-diagnose ML production failures, and naming it is the point of the question.</p>
<p><strong>What it provides:</strong></p>
<ul>
<li><strong>Offline store</strong> (Delta, BigQuery, S3) for training — supports <strong>point-in-time correct joins</strong>, i.e. "what was this feature's value as of the label timestamp," which prevents temporal leakage.</li>
<li><strong>Online store</strong> (Redis, DynamoDB, Cassandra) for low-latency serving — single-digit-millisecond lookups by entity key.</li>
<li><strong>One transformation definition</strong> materialized to both stores, so skew is structurally impossible.</li>
<li><strong>Feature reuse and discovery</strong> — the "days since last login" feature is computed once and used by five models, rather than reimplemented five times.</li>
<li><strong>Versioning, lineage, monitoring and ownership</strong> per feature.</li>
</ul>
<p><strong>Options:</strong> Feast (open source), Databricks Feature Store / Unity Catalog feature tables, Tecton, Vertex AI Feature Store, SageMaker Feature Store.</p>
<p><strong>When you don't need one</strong> — worth saying, because it shows judgment: a single model, batch scoring only, features computed in the same pipeline as training. A feature store is real infrastructure; it earns its cost when you have multiple models, real-time serving, and shared features across teams.</p>`},

{q:"CI/CD for ML — what's different from software CI/CD?",
roles:["ds","aie"],lvl:"senior",tags:["mlops","senior-signal"],
a:`<p>Software CI/CD ships code. ML CI/CD ships a <strong>code + data + model</strong> triple, and any one of the three can change independently.</p>
<p><strong>Three pipelines, not one:</strong></p>
<ul>
<li><strong>CI</strong> — lint, unit tests, data validation tests, a fast training smoke test on a data sample, model contract tests.</li>
<li><strong>CT (Continuous Training)</strong> — retrain on fresh data, evaluate against gates, register if it passes. Triggered by schedule, drift alert, or new data volume.</li>
<li><strong>CD</strong> — deploy the registered model, canary, monitor, promote or roll back.</li>
</ul>
<p><strong>The ML testing pyramid</strong> — this is the substantive part of the answer:</p>
<ol>
<li><strong>Data tests</strong> — schema conformance, null rates within bounds, value ranges, category cardinality, freshness, row-count deltas, referential integrity. Run <em>before</em> training; bad data should fail the pipeline, not silently produce a bad model.</li>
<li><strong>Feature tests</strong> — unit tests on transformation logic, and point-in-time correctness assertions.</li>
<li><strong>Model tests</strong> —
<ul>
<li><em>Performance gates:</em> new model must beat the incumbent (and a naive baseline) on the holdout by a defined margin.</li>
<li><em>Behavioural tests:</em> invariance (changing an irrelevant feature shouldn't flip the prediction), directional expectation (increasing income should not increase default probability), minimum functionality on known cases. This is CheckList-style testing and almost nobody does it — mentioning it stands out.</li>
<li><em>Slice tests:</em> performance must not regress on key segments, even if the aggregate improves. Aggregate-only gates let you ship a model that got better overall and much worse for one region.</li>
<li><em>Fairness tests</em> where applicable.</li>
</ul></li>
<li><strong>Integration tests</strong> — the serving container loads the model, the API returns the right schema, latency is within SLO, features resolve correctly from the online store.</li>
<li><strong>Shadow/canary</strong> in production before full traffic.</li>
</ol>
<p><strong>What must be versioned:</strong> code (git), data (Delta time travel, DVC, LakeFS), features, model artifacts, the training environment (container image), <em>and</em> prompts and eval datasets for LLM systems.</p>
<div class="say"><b>Say this:</b> "The difference is that in ML the pipeline can break with no code change at all — an upstream schema change or a distribution shift is enough. So the tests I add that software CI doesn't have are data validation gates before training, behavioural tests on the model rather than just an aggregate metric, and per-slice regression checks, because aggregate improvement can hide a serious regression on one segment. And the deployment gate compares the candidate against the incumbent on a frozen holdout, not against a number in a notebook."</div>`}
]},

{
title:"Deployment & serving",
items:[
{q:"How did you deploy your model? Walk through the Databricks flow",
roles:["ds","aie"],lvl:"core",tags:["mlops","deployment","high-freq"],
a:`<pre><code>Train in a Databricks notebook / job
        ↓
MLflow autolog: params, metrics, artifacts, data version
        ↓
Compare runs → select best
        ↓
Register to Unity Catalog:  catalog.schema.model_name
        ↓
Evaluate against gates → promote alias @champion
        ↓
Model Serving endpoint (serverless, scale-to-zero)
        ↓
REST API  POST /serving-endpoints/{name}/invocations
        ↓
Application / batch job consumes predictions
        ↓
Inference tables log requests + responses
        ↓
Lakehouse Monitoring → drift + quality metrics → alerts</code></pre>
<p><strong>Give the concrete version, with numbers:</strong></p>
<div class="say">"I trained in Databricks with MLflow autologging so every run captured parameters, metrics, the data version and the git SHA. I compared runs in the experiment UI, registered the best model to Unity Catalog, and promoted it with an alias so the serving endpoint didn't need a redeploy to pick up a new version. Serving was a Databricks Model Serving endpoint exposing a REST API, consumed by the application. Requests and responses were logged to inference tables, and Lakehouse Monitoring computed drift and quality metrics on top of those with alerts on threshold breaches. We tracked p95 latency, throughput and error rate on the endpoint, and drift on the input features. Rollback was reassigning the alias to the previous version — seconds, not a deploy."</div>
<p><strong>Be ready for the follow-ups:</strong></p>
<ul>
<li><em>"How did you handle schema changes?"</em> Model signature enforcement on the endpoint rejects malformed requests; a schema change means a new model version, not a patched endpoint.</li>
<li><em>"What was your p95 latency and what drove it?"</em> Have a real number and know whether it was feature lookup, model inference or network.</li>
<li><em>"What happened when the endpoint went down?"</em> Client-side retries with backoff, a cached or rule-based fallback, and a defined degraded mode.</li>
<li><em>"Batch or real-time, and why?"</em> The honest answer is usually batch for scoring a population overnight and real-time only where the decision is in a user-facing flow. Choosing real-time when batch would do is a cost and complexity mistake.</li>
</ul>`},

{q:"Deployment patterns: blue-green, canary, shadow, rolling, A/B",
roles:["ds","aie"],lvl:"core",tags:["deployment","high-freq"],
a:`<table><thead><tr><th>Pattern</th><th>Mechanism</th><th>Rollback</th><th>Cost</th><th>Use when</th></tr></thead><tbody>
<tr><td><strong>Rolling</strong></td><td>Replace instances gradually</td><td>Roll forward/back gradually</td><td>Low</td><td>Default for stateless services</td></tr>
<tr><td><strong>Blue-green</strong></td><td>Two full environments; flip the router</td><td><strong>Instant</strong> — flip back</td><td>2× infra during the switch</td><td>Fast, clean rollback matters more than cost</td></tr>
<tr><td><strong>Canary</strong></td><td>Route 1% → 5% → 25% → 100%, watching metrics at each step</td><td>Fast — route back</td><td>Low</td><td><strong>Default for ML models.</strong> Limits blast radius, gives real-traffic signal</td></tr>
<tr><td><strong>Shadow / mirror</strong></td><td>New model receives a copy of live traffic; its output is logged, not served</td><td>N/A — nothing served</td><td>2× inference</td><td><strong>Zero-risk validation</strong> — best first step for a model whose live behaviour is unknown</td></tr>
<tr><td><strong>A/B test</strong></td><td>Split users, measure a business metric with statistical rigour</td><td>Stop the experiment</td><td>Low</td><td>When you need to prove <em>business</em> impact, not just offline metrics</td></tr>
<tr><td><strong>Multi-armed bandit</strong></td><td>Adaptively shift traffic toward the better arm</td><td>Continuous</td><td>Low</td><td>Many variants, want to minimize regret during the test</td></tr>
</tbody></table>
<p><strong>The ML-specific distinction to make:</strong> canary and shadow answer "does this model behave sanely on real traffic?" A/B answers "does this model make the business better?" They are different questions and a mature rollout does both — shadow first to catch crashes and gross prediction shifts, then canary for a small live exposure, then A/B for the business metric.</p>
<p><strong>Automated rollback triggers</strong> — the part that shows operational experience: error rate above X, p95 latency above the SLO, prediction distribution shifting more than Y from the incumbent (a strong early signal, available before any labels arrive), or a guardrail business metric degrading. Wire these to an automatic revert rather than a pager.</p>`},

{q:"LLM serving: throughput, latency and the economics",
roles:["aie"],lvl:"senior",tags:["serving","senior-signal"],
a:`<p><strong>The metrics that matter, and what each is driven by:</strong></p>
<table><thead><tr><th>Metric</th><th>Meaning</th><th>Driven by</th></tr></thead><tbody>
<tr><td><strong>TTFT</strong></td><td>Time to first token</td><td>Prefill — prompt length, queueing, prefix cache hit rate</td></tr>
<tr><td><strong>TPOT / ITL</strong></td><td>Time per output token</td><td>Decode — memory bandwidth, KV cache size, batch size</td></tr>
<tr><td>End-to-end latency</td><td>TTFT + TPOT × output tokens</td><td>Both, plus output length</td></tr>
<tr><td>Throughput</td><td>Tokens/sec across all requests</td><td>Batch size, GPU occupancy</td></tr>
<tr><td>Goodput</td><td>Requests/sec <em>meeting SLO</em></td><td>The metric that actually matters</td></tr>
</tbody></table>
<p><strong>The fundamental tension:</strong> throughput and latency trade against each other. Larger batches raise GPU utilization and total tokens/sec but increase each individual request's TPOT. You tune to an SLO ("p95 TTFT under 500ms, TPOT under 50ms"), not to maximum throughput.</p>
<p><strong>The serving optimization stack:</strong></p>
<ul>
<li><strong>Continuous (in-flight) batching</strong> — the single biggest win. Admit and retire requests per decoding step instead of per batch, so a finished short request frees its slot immediately. 2–10× throughput over static batching.</li>
<li><strong>PagedAttention</strong> — block-based KV cache management, eliminating the fragmentation of pre-allocating max-length buffers.</li>
<li><strong>Prefix caching</strong> — reuse the KV cache for a shared system prompt. Massive for RAG and agents where a long instruction block is identical every call.</li>
<li><strong>Quantization</strong> — fp8/int8 weights and KV cache; more requests per GPU.</li>
<li><strong>Speculative decoding</strong> — 2–3× on decode with identical output distribution.</li>
<li><strong>Chunked prefill</strong> — interleave prefill chunks with decode steps so one long prompt doesn't stall everyone's token stream.</li>
<li><strong>Disaggregated prefill/decode</strong> — separate pools, because the two phases have opposite hardware profiles.</li>
<li><strong>Tensor / pipeline parallelism</strong> when the model doesn't fit on one GPU.</li>
</ul>
<p><strong>Stacks:</strong> vLLM (the default), TensorRT-LLM (fastest on NVIDIA, harder to operate), SGLang (strong on structured output and prefix reuse), TGI, llama.cpp for CPU/edge.</p>
<p><strong>The cost conversation to bring up unprompted:</strong> self-hosting only beats an API above a throughput threshold, because a reserved GPU costs the same idle or saturated. Compute your break-even: (GPU $/hour ÷ achieved tokens/hour) vs API $/token. Then route — send the easy 70% of traffic to a small self-hosted model and the hard 30% to a frontier API. And measure cost per <em>task</em>, not per token, because a cheaper model that needs three retries is not cheaper.</p>`}
]},

{
title:"Monitoring, drift & retraining",
items:[
{q:"What do you monitor for a model in production?",
roles:["ds","aie"],lvl:"core",tags:["monitoring","high-freq"],
a:`<p><strong>Four layers.</strong> Candidates usually name one; name all four.</p>
<p><strong>1. Model quality</strong> — accuracy, precision, recall, F1, AUC, RMSE, calibration, per-segment breakdowns. <em>The catch:</em> these need ground-truth labels, which often arrive days or months later (or never). So you also need label-free proxies.</p>
<p><strong>2. Data quality &amp; integrity</strong> — <em>the layer that catches most real incidents:</em></p>
<ul>
<li>Schema conformance and type changes</li>
<li>Null / missing rate per feature (a spike means an upstream pipeline broke)</li>
<li>Value range and cardinality violations</li>
<li>Freshness / staleness of each feature source</li>
<li>Row-count anomalies</li>
<li>Duplicate rate</li>
</ul>
<p><strong>3. Drift</strong> — feature drift (P(X)), prediction drift (P(Ŷ)), concept drift (P(Y|X)), label drift (P(Y)). <strong>Prediction drift is the most valuable early signal</strong> because it needs no labels: if the mean predicted probability jumps from 0.08 to 0.31, something has changed regardless of whether you can measure accuracy yet.</p>
<p><strong>4. System / operational</strong> — p50/p95/p99 latency, throughput, error rate, CPU/memory/GPU utilization, queue depth, cache hit rate, cost per prediction, feature-store lookup latency.</p>
<p><strong>For LLM systems, add:</strong> token usage and cost per request, TTFT and TPOT, groundedness/faithfulness scores on a sample, refusal rate, safety-filter trigger rate, user thumbs up/down, retrieval recall on a canary set, and prompt/model version tagged on every trace.</p>
<div class="say"><b>Say this:</b> "Four layers: model quality, data quality, drift, and system health. In practice the one that has caught the most real incidents for me is data quality — an upstream schema change or a null-rate spike degrades the model with no alert anywhere else. And because labels arrive late, I lean on prediction drift as the early warning: I can detect that the output distribution has shifted today, even if I won't know the accuracy for six weeks."</div>`},

{q:"Data drift vs concept drift — and how do you measure drift?",
roles:["ds","aie"],lvl:"core",tags:["drift","high-freq","senior-signal"],
a:`<table><thead><tr><th>Type</th><th>What changes</th><th>Example</th><th>Detectable without labels?</th></tr></thead><tbody>
<tr><td><strong>Data / covariate drift</strong></td><td>P(X)</td><td>Training ages 20–40; production ages 50–80. New market, new device mix.</td><td><strong>Yes</strong></td></tr>
<tr><td><strong>Prediction drift</strong></td><td>P(Ŷ)</td><td>Mean predicted churn probability jumps from 8% to 31%</td><td><strong>Yes</strong></td></tr>
<tr><td><strong>Concept drift</strong></td><td>P(Y\\|X)</td><td>Fraud tactics evolve — the same features now imply a different label</td><td><strong>No</strong> — needs labels</td></tr>
<tr><td><strong>Label / prior drift</strong></td><td>P(Y)</td><td>Base default rate rises in a recession</td><td>No</td></tr>
<tr><td>Upstream drift</td><td>The pipeline</td><td>A unit changed from cents to dollars; a category was renamed</td><td>Yes — and it's a bug, not drift</td></tr>
</tbody></table>
<p><strong>Why the distinction matters:</strong> data drift may be harmless (the model may generalize fine to the new region), while concept drift always degrades performance. Detecting data drift tells you to <em>investigate</em>; detecting concept drift tells you to <em>retrain</em>.</p>
<p><strong>Measurement methods:</strong></p>
<table><thead><tr><th>Method</th><th>Type</th><th>Interpretation</th></tr></thead><tbody>
<tr><td><strong>PSI</strong> (Population Stability Index)<br><code>Σ (a%−e%)·ln(a%/e%)</code></td><td>Binned, numeric or categorical</td><td>&lt;0.1 stable · 0.1–0.25 moderate shift, investigate · &gt;0.25 significant shift, act. <strong>The industry standard in credit and finance.</strong></td></tr>
<tr><td><strong>KS test</strong></td><td>Continuous, two-sample</td><td>Max distance between CDFs. Non-parametric; over-sensitive at large n — with a million rows everything is "significant"</td></tr>
<tr><td><strong>Chi-square</strong></td><td>Categorical</td><td>Same large-n caveat</td></tr>
<tr><td><strong>KL divergence</strong></td><td>Distributions</td><td>Asymmetric, unbounded, undefined where the reference has zero mass. Needs smoothing</td></tr>
<tr><td><strong>JS distance</strong></td><td>Distributions</td><td>Symmetric, bounded [0,1]. Better default than KL</td></tr>
<tr><td><strong>Wasserstein / Earth Mover</strong></td><td>Continuous</td><td>Accounts for how far the mass moved, not just that it did. Good for ordered numeric features</td></tr>
<tr><td><strong>Domain classifier</strong></td><td>Multivariate</td><td>Train a classifier to distinguish reference from current data. AUC ≈ 0.5 means no drift; high AUC means drift, <em>and the feature importances tell you which features drifted</em>. The best multivariate method.</td></tr>
</tbody></table>
<div class="trap"><b>The nuance that marks a senior answer:</b> per-feature univariate tests miss <strong>multivariate drift</strong> — each feature's marginal distribution can be unchanged while their joint relationship shifts entirely. And statistical significance is not operational significance: with high traffic, KS will flag everything. So I set thresholds on <em>effect size</em> (PSI, Wasserstein) rather than p-values, tie alerts to a business impact estimate, and always monitor prediction drift alongside input drift — because input drift on an unimportant feature is noise, while prediction drift is always worth a look.</div>`},

{q:"Why does drift happen, and how do you handle it?",
roles:["ds","aie"],lvl:"core",tags:["drift","high-freq"],
a:`<p><strong>Causes:</strong></p>
<ul>
<li><strong>Seasonality and cycles</strong> — often not drift at all, just a period the model hasn't seen. Compare year-over-year before retraining.</li>
<li><strong>Genuine behaviour change</strong> — user habits, competitive moves, pricing changes.</li>
<li><strong>New segments</strong> — a new geography, a new channel, a new device class.</li>
<li><strong>External shocks</strong> — a pandemic, a regulatory change, a market crash.</li>
<li><strong>Product changes</strong> — a redesigned onboarding flow changes the feature distribution overnight.</li>
<li><strong>Upstream pipeline changes</strong> — a schema change, a unit change, a renamed category. <strong>This is a bug, and it's the most common cause. Diagnose before you retrain.</strong></li>
<li><strong>Feedback loops</strong> — the model's own actions change the data it sees next. A fraud model that blocks a tactic stops observing it, so the tactic looks extinct until it returns.</li>
</ul>
<p><strong>Handling, in order:</strong></p>
<ol>
<li><strong>Diagnose first.</strong> Is this a data bug, seasonality, or real drift? Retraining on corrupt data bakes the corruption in. This is the step people skip.</li>
<li><strong>Retrain</strong> on recent data — the standard remedy. Decide the window (rolling 90 days vs full history) and whether to weight recent samples more heavily.</li>
<li><strong>Recalibrate only</strong> — if the ranking is still good but the probabilities have shifted, refitting a calibrator is far cheaper than retraining.</li>
<li><strong>Adjust thresholds</strong> — if the score distribution shifted but ranking holds, moving the decision threshold restores the operating point.</li>
<li><strong>Engineer more stable features</strong> — ratios and rankings drift less than absolute levels. "Spend relative to the user's own 90-day average" is far more robust than "spend in rupees."</li>
<li><strong>Add the new segment explicitly</strong> as a feature or a separate model.</li>
<li><strong>Online / incremental learning</strong> for genuinely fast-moving domains — with guardrails, because online learning can be poisoned.</li>
</ol>
<p><strong>Tooling:</strong> Evidently AI, WhyLabs, Arize, Fiddler, Databricks Lakehouse Monitoring, or a custom PSI job on inference tables with alerting.</p>`},

{q:"Retraining strategy: when, how often, and how do you decide?",
roles:["ds","aie"],lvl:"senior",tags:["mlops","senior-signal"],
a:`<p><strong>Triggers:</strong></p>
<ul>
<li><strong>Scheduled</strong> — daily/weekly/monthly. Simple, predictable, easy to operate. Retrains when nothing changed (wasteful) and misses sudden shifts (risky). Still the right default for most teams because it's boring and reliable.</li>
<li><strong>Performance-triggered</strong> — retrain when a monitored metric drops below a threshold. The most principled trigger, but it requires timely labels.</li>
<li><strong>Drift-triggered</strong> — retrain when PSI or prediction drift breaches a threshold. Works without labels; risks retraining on a data bug.</li>
<li><strong>Data-volume-triggered</strong> — retrain after N new labelled examples.</li>
<li><strong>Event-triggered</strong> — a known product launch, a policy change, a new market.</li>
</ul>
<p><strong>What a mature setup looks like:</strong> a scheduled baseline cadence <em>plus</em> drift and performance triggers for off-cycle retraining, with every retrain going through the same automated evaluation gate as a manual one.</p>
<p><strong>The gate is the important part, and it's what interviewers are checking for:</strong></p>
<ol>
<li>Validate the training data (schema, nulls, ranges, volume) — fail fast on bad data.</li>
<li>Train the candidate.</li>
<li>Evaluate on a <strong>frozen out-of-time holdout</strong>, not a random split.</li>
<li>Compare against the <em>current production model</em> on the <em>same</em> data — and against a naive baseline.</li>
<li>Check per-slice performance; block on any material segment regression even if the aggregate improved.</li>
<li>Only promote if it wins by a defined margin. <strong>An automated retraining pipeline that promotes unconditionally is a loaded gun</strong> — a bad data day silently ships a bad model.</li>
<li>Canary the promotion with automatic rollback on metric breach.</li>
</ol>
<p><strong>Also decide explicitly:</strong> the training window (rolling vs expanding), whether to warm-start from the previous model or train from scratch, whether hyperparameters are re-tuned or fixed (fixed is usually right for automated retraining — re-tuning adds variance and cost), and how long you retain old model versions for rollback and audit.</p>
<div class="say"><b>Say this:</b> "Weekly scheduled retraining as a baseline, plus drift and performance triggers for off-cycle runs. The part I'd emphasize is the promotion gate: the candidate has to beat the current production model on a frozen out-of-time holdout, and it has to not regress on any key segment. Automated retraining without that gate is dangerous — one bad upstream data day and you've promoted a broken model automatically. And I always diagnose a drift alert before retraining, because more often than not it's an upstream pipeline change rather than real drift, and retraining would bake the bug in."</div>`},

{q:"What's different about LLMOps compared to MLOps?",
roles:["aie","agentic"],lvl:"senior",tags:["llmops","senior-signal"],
a:`<table><thead><tr><th></th><th>Traditional MLOps</th><th>LLMOps</th></tr></thead><tbody>
<tr><td>The artifact you version</td><td>Model weights</td><td><strong>Prompts, tool schemas, retrieval config, model version</strong> — the weights are usually someone else's</td></tr>
<tr><td>Evaluation</td><td>Deterministic metrics vs labels</td><td>Non-deterministic outputs; LLM-as-judge; rubrics; human review</td></tr>
<tr><td>Cost model</td><td>Compute per hour</td><td><strong>Per token</strong> — cost is proportional to usage and varies per request</td></tr>
<tr><td>Latency profile</td><td>Milliseconds, uniform</td><td>Seconds, highly variable; streaming changes perceived latency</td></tr>
<tr><td>Failure mode</td><td>Wrong number</td><td>Fluent, confident, wrong prose — much harder to detect automatically</td></tr>
<tr><td>Testing</td><td>Unit tests on deterministic output</td><td>Eval suites with tolerance; run n times and look at the distribution</td></tr>
<tr><td>Safety surface</td><td>Bias, fairness</td><td>Plus prompt injection, jailbreaks, PII leakage, harmful content, data exfiltration via tools</td></tr>
<tr><td>Model updates</td><td>You control them</td><td><strong>The provider updates the model underneath you</strong> — behaviour changes without a deploy</td></tr>
</tbody></table>
<p><strong>The practices that follow from this:</strong></p>
<ul>
<li><strong>Version prompts like code</strong> — in the repo, code-reviewed, with an eval run required to merge. A prompt is production logic; editing it in a UI with no review is the most common LLMOps anti-pattern.</li>
<li><strong>Pin model versions explicitly</strong> and run the regression suite before adopting a new one. A silent provider update is the LLM equivalent of a dependency changing under you in production.</li>
<li><strong>Eval suites as deployment gates</strong>, with golden datasets versioned alongside the prompts.</li>
<li><strong>Trace everything</strong> — prompt, retrieved context, tool calls, completion, tokens, cost, latency, model and prompt versions. Sample traces for human review continuously.</li>
<li><strong>Cost observability per feature and per tenant</strong>, with budget alerts. Token cost scales with usage in a way compute doesn't, and an unnoticed prompt regression can multiply your bill overnight.</li>
<li><strong>Guardrails as a deployed service</strong>, not prompt text.</li>
<li><strong>Feedback loop</strong> — thumbs up/down and human corrections flow back into the eval set and the fine-tuning data.</li>
<li><strong>Shadow-test model migrations</strong> — run the new model on mirrored traffic and diff the outputs before switching.</li>
</ul>
<div class="say"><b>Say this:</b> "The biggest practical differences are that the artifact I version is the prompt and retrieval configuration rather than weights, that evaluation is probabilistic so I run it n times and gate on a distribution, and that the provider can change the model underneath me without a deploy — so I pin versions and re-run the regression suite before adopting a new one. And cost becomes an observability concern in a way it isn't for a scikit-learn model: a single prompt regression can multiply the monthly bill, so I meter tokens per feature and per tenant with budget alerts."</div>`}
]}
]});
