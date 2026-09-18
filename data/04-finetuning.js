PREP.push({
id:"finetuning", n:"04", title:"Fine-tuning & Alignment", icon:"⚙",
blurb:"The post-training pipeline: SFT, PEFT, RLHF and DPO, quantization, distillation — and the decision framework for prompt vs RAG vs fine-tune that every AI Engineer loop asks in some form.",
topics:[
{
title:"The decision framework",
items:[
{q:"Prompt engineering vs RAG vs fine-tuning — how do you decide?",
roles:["aie","agentic"],lvl:"senior",tags:["llm","high-freq","senior-signal"],
a:`<p>Map the technique to the <strong>kind of gap</strong> you have. Stating this framing first is worth more than listing the techniques.</p>
<table><thead><tr><th>Gap</th><th>Fix</th><th>Why</th></tr></thead><tbody>
<tr><td>Model doesn't know your <strong>facts</strong></td><td><strong>RAG</strong></td><td>Knowledge is external, changes daily, needs citations and access control. Fine-tuning can't keep up and can't cite.</td></tr>
<tr><td>Model doesn't follow your <strong>format or style</strong></td><td>Prompt + few-shot → <strong>fine-tune</strong> if prompts get long or unreliable</td><td>Behaviour is learnable and stable; baking it in removes tokens from every request</td></tr>
<tr><td>Model lacks a <strong>skill or domain vocabulary</strong></td><td><strong>Fine-tune</strong></td><td>Radiology reports, legal drafting conventions, a proprietary DSL — not retrievable facts</td></tr>
<tr><td>Model reasons poorly on your task</td><td>Better prompting / decomposition / <strong>agentic workflow</strong>, then reasoning-model fine-tune</td><td>Usually a decomposition problem before it's a weights problem</td></tr>
<tr><td>Too slow or too expensive</td><td><strong>Distill</strong> to a smaller model; quantize; cache; route</td><td>Fine-tuning a small model on the big model's outputs is the standard cost play</td></tr>
<tr><td>Output needs a guaranteed schema</td><td><strong>Constrained decoding</strong></td><td>A hard guarantee; prompting is not</td></tr>
</tbody></table>
<p><strong>My actual order of operations:</strong></p>
<ol>
<li><strong>Prompt engineering.</strong> Free, instant, and the baseline you must beat. Get a proper eval set first.</li>
<li><strong>Few-shot / dynamic few-shot</strong> from a labelled pool.</li>
<li><strong>RAG</strong> if the failures are factual or freshness-related.</li>
<li><strong>Agentic decomposition</strong> if the failures are multi-step.</li>
<li><strong>PEFT fine-tune (LoRA)</strong> if failures persist and are behavioural, and I have 500+ good examples.</li>
<li><strong>Full fine-tune / continued pretraining</strong> only for a genuine domain shift with large data — rare and expensive.</li>
</ol>
<p><strong>They are not exclusive,</strong> and saying so is important: the strongest production systems fine-tune a small model to follow a specific format and reason over retrieved context, then feed it via RAG. Fine-tuning teaches <em>how to behave</em>; RAG supplies <em>what to know</em>.</p>
<div class="say"><b>Say this:</b> "I map the failure to the gap. If the model is wrong about facts, that's retrieval — fine-tuning would bake in a snapshot I can't update or cite. If it's wrong about form or process, that's behaviour and fine-tuning helps. The gate is always an eval set: I won't fine-tune without a measurable baseline, because otherwise I can't tell whether I improved anything or just moved the errors."</div>
<div class="trap"><b>Trap:</b> Saying "fine-tuning adds knowledge." It's a weak and unreliable way to add facts — it hallucinates confidently on the gaps, can't be updated without retraining, can't enforce per-user document permissions, and can't provide provenance. Interviewers use this to separate people who've shipped from people who've read about it.</div>`},

{q:"What is the full LLM training pipeline, pretraining through alignment?",
roles:["aie"],lvl:"senior",tags:["llm","training"],
a:`<ol>
<li><strong>Pretraining</strong> — next-token prediction on trillions of tokens of web text, code and books. Self-supervised. This is where all the capability and knowledge comes from, and it costs millions of dollars. Output: a <em>base model</em> that completes text but doesn't follow instructions.</li>
<li><strong>Continued / domain-adaptive pretraining</strong> (optional) — more next-token training on a domain corpus (medical, legal, code, a new language). Use when your domain's vocabulary and distribution are genuinely different. Needs billions of tokens to be worthwhile.</li>
<li><strong>Supervised Fine-Tuning (SFT) / instruction tuning</strong> — train on (instruction, ideal response) pairs. This is what turns a completion engine into an assistant. Typically 10k–1M curated examples; data <em>quality</em> dominates quantity (LIMA showed 1,000 excellent examples beat 50,000 mediocre ones).</li>
<li><strong>Preference alignment</strong> — RLHF, DPO or a variant, on pairs of (preferred, rejected) responses. Teaches helpfulness, harmlessness, tone, refusal behaviour, and the things that are easier to <em>rank</em> than to <em>write</em>.</li>
<li><strong>Reasoning post-training</strong> (current frontier) — RL on verifiable outcomes (math, code that passes tests) to elicit long chain-of-thought.</li>
<li><strong>Task-specific fine-tuning</strong> — what you do as a practitioner: LoRA on your own few thousand examples.</li>
</ol>
<p><strong>The key distinction to state:</strong> pretraining creates capability, SFT makes it accessible, alignment makes it usable and safe. Alignment doesn't add knowledge; it shapes how existing knowledge is expressed. This is why an aligned model sometimes scores <em>worse</em> on raw benchmarks than its base model — the "alignment tax."</p>`}
]},

{
title:"Parameter-efficient fine-tuning",
items:[
{q:"Explain LoRA and QLoRA, including how to pick the hyperparameters",
roles:["aie"],lvl:"senior",tags:["peft","high-freq","senior-signal"],
a:`<p><strong>LoRA (Low-Rank Adaptation).</strong> The hypothesis: the weight <em>update</em> needed for a downstream task has low intrinsic rank, even though W itself is full-rank. So don't learn ΔW — learn its factorization.</p>
<pre><code>W_effective = W_frozen + ΔW = W + BA

W: (d × k) frozen
B: (d × r) initialized to ZERO
A: (r × k) initialized random Gaussian
r ≪ min(d,k)     typically 8, 16, 32, 64

trainable params: r(d + k)  instead of  d·k</code></pre>
<p>For d = k = 4096 and r = 16: 131k parameters instead of 16.8M — a <strong>128× reduction</strong> per matrix.</p>
<p><strong>Why B starts at zero:</strong> BA = 0 at initialization, so the adapted model is exactly the pretrained model on step one. No random perturbation of a carefully pretrained network. (A is random so gradients flow — if both were zero, the product's gradient would be zero forever.)</p>
<p><strong>Hyperparameters, and what they actually do:</strong></p>
<ul>
<li><strong>r (rank)</strong> — capacity. 8–16 for style/format tasks, 32–64 for harder domain adaptation. Higher r rarely helps beyond a point and starts to overfit.</li>
<li><strong>alpha (α)</strong> — the update is scaled by α/r. Common convention α = 2r (or α = r). The point of the scaling is that changing r doesn't require retuning the learning rate.</li>
<li><strong>target_modules</strong> — which matrices get adapters. Original paper: q_proj and v_proj only. Current practice: <strong>all linear layers</strong> (q, k, v, o, gate, up, down) usually performs meaningfully better for the same parameter budget than a high rank on few modules.</li>
<li><strong>dropout</strong> — 0.05–0.1 on the LoRA path.</li>
<li><strong>learning rate</strong> — 1e-4 to 3e-4, roughly 10× higher than full fine-tuning, because you're training few, freshly-initialized parameters.</li>
</ul>
<p><strong>QLoRA</strong> adds three things so a 65B model fits on a single 48GB GPU:</p>
<ol>
<li><strong>4-bit NormalFloat (NF4)</strong> quantization of the frozen base weights — an information-theoretically optimal datatype for normally-distributed weights. Weights are dequantized to bf16 on the fly for each matmul.</li>
<li><strong>Double quantization</strong> — quantize the quantization constants too, saving ~0.4 bits/param.</li>
<li><strong>Paged optimizers</strong> — page optimizer state to CPU on memory spikes, avoiding OOM crashes.</li>
</ol>
<p>LoRA adapters stay in bf16 and train normally on top of the frozen 4-bit base.</p>
<p><strong>Serving advantages:</strong> merge BA into W for zero inference overhead, or keep them separate and hot-swap adapters per request — one base model in memory serving dozens of task-specific adapters (S-LoRA, vLLM multi-LoRA). That's a strong production argument to make.</p>
<div class="trap"><b>Honest limitations to volunteer:</b> LoRA underperforms full fine-tuning when you need to <em>add substantial new knowledge</em> rather than adjust behaviour — low rank constrains how much the model can move. And merged QLoRA has a subtlety: you trained against a 4-bit base, so merging the bf16 adapter into a bf16 base isn't exactly what you trained. Evaluate the merged artifact, not just the training-time one.</div>`},

{q:"Compare all the PEFT methods",
roles:["aie"],lvl:"senior",tags:["peft"],
a:`<table><thead><tr><th>Method</th><th>Mechanism</th><th>Trainable %</th><th>Inference cost</th><th>Notes</th></tr></thead><tbody>
<tr><td><strong>LoRA</strong></td><td>Low-rank update to existing weights, W + BA</td><td>0.1–1%</td><td><strong>Zero if merged</strong></td><td>The default. Best quality/complexity ratio.</td></tr>
<tr><td><strong>QLoRA</strong></td><td>LoRA on a 4-bit NF4 frozen base</td><td>0.1–1%</td><td>Zero if merged</td><td>Lets you fine-tune 65B+ on one GPU</td></tr>
<tr><td><strong>DoRA</strong></td><td>Decompose W into magnitude + direction, LoRA the direction</td><td>~1%</td><td>Zero if merged</td><td>Consistently beats LoRA at low rank</td></tr>
<tr><td><strong>Adapters</strong></td><td>New bottleneck layers inserted in series</td><td>0.5–5%</td><td>Real — adds depth</td><td>Predates LoRA; still good for multi-task</td></tr>
<tr><td><strong>Prefix tuning</strong></td><td>Trainable key/value vectors prepended at every layer</td><td>0.1–1%</td><td>Consumes context length</td><td>Harder to optimize; sensitive to init</td></tr>
<tr><td><strong>Prompt tuning</strong></td><td>Trainable soft-prompt embeddings at the input only</td><td>&lt;0.1%</td><td>Consumes context</td><td>Only works well at large scale (10B+)</td></tr>
<tr><td><strong>P-tuning v2</strong></td><td>Prefix tuning at all layers with reparameterization</td><td>0.1–3%</td><td>Consumes context</td><td>Competitive on NLU</td></tr>
<tr><td><strong>IA³</strong></td><td>Learned scaling vectors on K, V and FFN activations</td><td>~0.01%</td><td>Negligible</td><td>Extremely light; good for few-shot</td></tr>
<tr><td><strong>BitFit</strong></td><td>Train only the bias terms</td><td>~0.08%</td><td>Zero</td><td>Surprisingly decent baseline</td></tr>
<tr><td><strong>Full FT</strong></td><td>All weights</td><td>100%</td><td>Zero</td><td>Best ceiling; ~16× the memory of LoRA; forgetting risk</td></tr>
</tbody></table>
<p><strong>Memory intuition for why PEFT matters:</strong> full fine-tuning a 7B model in mixed precision needs roughly 14GB for weights, 14GB for gradients, and 56GB for Adam's two moment estimates in fp32 — around 84GB+ before activations. LoRA eliminates the gradient and optimizer state for 99%+ of parameters, bringing that to roughly 16–20GB. That's the difference between a cluster and one consumer GPU.</p>`}
]},

{
title:"Alignment: RLHF, DPO and friends",
items:[
{q:"Explain RLHF end to end",
roles:["aie"],lvl:"senior",tags:["alignment","senior-signal"],
a:`<p><strong>The motivation:</strong> for "write a helpful, harmless response," there's no single correct string to supervise against — but humans can reliably say which of two responses is better. RLHF turns that comparative signal into a training signal.</p>
<p><strong>Three stages:</strong></p>
<ol>
<li><strong>SFT.</strong> Fine-tune the base model on demonstration data to get a reasonable starting policy.</li>
<li><strong>Reward model.</strong> Collect human rankings over pairs of responses to the same prompt. Train a model r(x,y) → scalar on the Bradley–Terry loss:
<pre><code>L = −log σ( r(x, y_preferred) − r(x, y_rejected) )</code></pre>
The reward model is usually the SFT model with the LM head replaced by a scalar head.</li>
<li><strong>RL optimization (PPO).</strong> Optimize the policy to maximize reward, with a KL penalty anchoring it to the SFT policy:
<pre><code>objective = E[ r(x,y) ] − β · KL( π_RL(y|x) ‖ π_SFT(y|x) )</code></pre>
</li>
</ol>
<p><strong>Why the KL term is the whole game:</strong> without it the policy finds adversarial strings that score highly under the reward model but are gibberish to humans — <strong>reward hacking</strong>. The KL penalty keeps the policy in the distribution where the reward model is actually valid.</p>
<p><strong>Why PPO is painful in practice — and why this question is a good filter:</strong> you need four models in memory simultaneously (policy, reference/frozen SFT, reward model, value/critic head), the training is unstable and hyperparameter-sensitive, and reward-model quality caps everything. This operational pain is exactly what motivated DPO.</p>
<p><strong>Also know:</strong> <strong>RLAIF / Constitutional AI</strong> replaces human labels with AI-generated preferences guided by a written set of principles, which makes the process far cheaper and more consistent, and makes the value judgments auditable.</p>`},

{q:"DPO vs PPO — and what's replaced what",
roles:["aie"],lvl:"senior",tags:["alignment","senior-signal"],
a:`<p><strong>DPO (Direct Preference Optimization)</strong> proves that the RLHF objective has a closed-form optimal policy, so you can skip the reward model and the RL loop entirely and optimize the preference data directly with a simple classification-style loss:</p>
<pre><code>L_DPO = −log σ( β·log[π(y_w|x)/π_ref(y_w|x)] − β·log[π(y_l|x)/π_ref(y_l|x)] )</code></pre>
<p>Read it plainly: <em>raise the policy's log-probability of the preferred response relative to the reference, and lower it for the rejected one.</em> The implicit reward is <code>β·log(π/π_ref)</code>, so the reward model is folded into the policy.</p>
<table><thead><tr><th></th><th>PPO (RLHF)</th><th>DPO</th></tr></thead><tbody>
<tr><td>Models in memory</td><td>4 (policy, ref, reward, critic)</td><td><strong>2</strong> (policy, ref)</td></tr>
<tr><td>Separate reward model</td><td>Required</td><td>Not needed</td></tr>
<tr><td>Stability</td><td>Finicky</td><td>Much more stable</td></tr>
<tr><td>Implementation</td><td>Complex RL loop</td><td>~30 lines on top of SFT</td></tr>
<tr><td>Online exploration</td><td><strong>Yes</strong> — can sample new responses and learn from them</td><td>No — offline, limited to the collected pairs</td></tr>
<tr><td>Ceiling</td><td>Higher with a good reward model and online data</td><td>Bounded by the preference dataset's distribution</td></tr>
</tbody></table>
<p><strong>The honest current picture:</strong> DPO is the default for most teams because the cost/quality ratio is excellent. Frontier labs still use online RL (PPO, GRPO) because online exploration and iterative preference collection push past what any fixed offline dataset supports. The real distinction is <strong>offline vs online</strong>, not DPO vs PPO.</p>
<p><strong>The family, briefly:</strong> <strong>IPO</strong> (fixes DPO's tendency to over-optimize on deterministic preferences), <strong>KTO</strong> (learns from single thumbs-up/down labels, no pairs needed — much easier to collect in production), <strong>ORPO</strong> (merges SFT and preference optimization into one stage, no reference model), <strong>SimPO</strong> (length-normalized, reference-free), <strong>GRPO</strong> (group-relative, drops the value network — behind recent reasoning models).</p>
<div class="say"><b>Say this:</b> "DPO derives the closed-form optimum of the RLHF objective, which lets you optimize preferences directly with a classification-style loss and drop the reward model and the RL loop. Two models instead of four and far more stable, so it's the pragmatic default. The thing it gives up is online exploration — you can only learn from the pairs you already collected — which is why labs doing the frontier work still run online RL with iterative preference collection. If I were shipping this, I'd start with DPO and only move to online methods if the eval showed a real ceiling."</div>`},

{q:"Quantization: what the formats are and what the quality tradeoffs actually look like",
roles:["aie"],lvl:"senior",tags:["serving","quantization"],
a:`<p>Reduce the numerical precision of weights (and sometimes activations) to cut memory and increase throughput.</p>
<pre><code>fp32  4 bytes/param   7B model → 28 GB
bf16  2 bytes/param   7B → 14 GB     ← training/serving standard
fp8   1 byte/param    7B →  7 GB     ← native on H100+
int8  1 byte/param    7B →  7 GB
int4  0.5 bytes/param 7B →  3.5 GB   ← fits a consumer GPU</code></pre>
<p><strong>Post-Training Quantization (PTQ)</strong> — quantize an already-trained model. Fast, no retraining.</p>
<ul>
<li><strong>GPTQ</strong> — layer-by-layer, second-order (Hessian-based) error compensation. 3–4 bit with small loss.</li>
<li><strong>AWQ</strong> — Activation-aware: identifies the ~1% of <em>salient</em> weight channels (those multiplying large activations) and protects them by per-channel scaling. Often better than GPTQ at 4-bit and faster to apply.</li>
<li><strong>GGUF / llama.cpp k-quants</strong> — CPU and Apple-silicon friendly; Q4_K_M is the common sweet spot.</li>
<li><strong>bitsandbytes NF4</strong> — what QLoRA uses; good for fine-tuning, less optimized for throughput.</li>
<li><strong>SmoothQuant</strong> — migrates activation outliers into the weights so W8A8 becomes viable.</li>
</ul>
<p><strong>Quantization-Aware Training (QAT)</strong> — simulate quantization during training so the weights adapt. Better quality at very low bit-widths, but requires a training run.</p>
<p><strong>Rough quality picture:</strong> 8-bit is essentially lossless. 4-bit with GPTQ/AWQ typically costs a small, task-dependent amount — often within noise on summarization and chat, more visible on multi-step reasoning, math and code. Below 4-bit degrades sharply. <strong>A useful rule of thumb to offer: a 4-bit larger model usually beats an fp16 smaller model at the same memory footprint.</strong></p>
<p><strong>What to say about where it hurts:</strong> quantization damage is not uniform. Long-chain reasoning, exact arithmetic, code generation and low-resource languages degrade first; always re-run your own task eval after quantizing rather than trusting a published perplexity delta. Also note that <strong>activation</strong> outliers, not weights, are the hard part — a handful of channels have magnitudes orders of magnitude larger than the rest, which is what AWQ and SmoothQuant exist to handle.</p>`},

{q:"Knowledge distillation — how and why",
roles:["aie"],lvl:"senior",tags:["serving","training"],
a:`<p>Train a small <em>student</em> to reproduce a large <em>teacher</em>'s behaviour, so you serve the small one.</p>
<p><strong>Why soft targets beat hard labels:</strong> the teacher's full probability distribution carries "dark knowledge" — that a given image is 70% husky, 25% malamute, 0.1% cat tells the student about class similarity structure that a one-hot label destroys. Temperature softening amplifies this:</p>
<pre><code>L = α · CE(student, hard_labels)
  + (1−α) · T² · KL( softmax(student_logits/T) ‖ softmax(teacher_logits/T) )</code></pre>
<p>T &gt; 1 (typically 2–5) flattens both distributions so small probabilities carry signal; the T² factor rescales the gradient magnitude back.</p>
<p><strong>Flavours:</strong></p>
<ul>
<li><strong>Response / black-box distillation</strong> — the practical LLM version: generate outputs from the big model on your task distribution, fine-tune the small model on those (instruction, output) pairs. You don't need logits, so it works through an API. This is how most production cost reduction actually happens.</li>
<li><strong>Logit distillation</strong> — needs teacher logits; stronger signal, requires model access.</li>
<li><strong>Feature / hidden-state distillation</strong> — match intermediate representations (TinyBERT, DistilBERT).</li>
<li><strong>Rationale distillation</strong> — have the teacher produce chain-of-thought, train the student on reasoning traces, not just answers. Transfers reasoning far better than answers alone.</li>
<li><strong>Self-distillation</strong> — teacher and student the same size; still improves generalization.</li>
</ul>
<p><strong>The production pitch:</strong> a task-specific distilled 7B model routinely matches a frontier model on that <em>one</em> task at 10–50× lower cost and much lower latency. The tradeoffs to name: it's brittle outside the distilled distribution, it needs re-distilling when the task shifts, and you must check the teacher's API terms of service before training on its outputs.</p>
<div class="say"><b>Say this:</b> "For a narrow, high-volume task I distil: run the frontier model over a representative sample of real traffic, curate and verify the outputs, then LoRA-fine-tune a small open model on them — and distil the reasoning traces, not just the final answers, because that's what transfers the capability. I keep the big model as a fallback for low-confidence cases and as the labeller for the next distillation round."</div>`}
]}
]});
