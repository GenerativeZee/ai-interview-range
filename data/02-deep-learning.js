PREP.push({
id:"deep-learning", n:"02", title:"Deep Learning", icon:"∇",
blurb:"Neural network mechanics from forward pass to backprop, the normalization and regularization stack, and the continual-learning questions that come up in every LLM interview.",
topics:[
{
title:"Network anatomy & forward pass",
items:[
{q:"Walk me through a three-layer neural network",
roles:["ds","aie"],lvl:"core",tags:["dl","basics"],
a:`<p>Input layer, one hidden layer, output layer.</p>
<ul>
<li><strong>Input layer</strong> — one node per feature. No computation; it just presents the data. 5 features → 5 input nodes.</li>
<li><strong>Hidden layer</strong> — each neuron computes a weighted sum of all inputs plus a bias, then applies a non-linear activation. This is where representations are learned. Say 4 neurons.</li>
<li><strong>Output layer</strong> — shape and activation determined by the task.</li>
</ul>
<pre><code>Hidden:  h = ReLU(W₁ · x + b₁)      W₁: (4, 5),  b₁: (4,)
Output:  ŷ = σ(W₂ · h + b₂)         W₂: (1, 4),  b₂: (1,)</code></pre>
<table><thead><tr><th>Task</th><th>Output units</th><th>Activation</th><th>Loss</th></tr></thead><tbody>
<tr><td>Binary classification</td><td>1</td><td>Sigmoid</td><td>Binary cross-entropy</td></tr>
<tr><td>Multi-class (single label)</td><td>C</td><td>Softmax</td><td>Categorical cross-entropy</td></tr>
<tr><td>Multi-label</td><td>C</td><td>Sigmoid per unit</td><td>Sum of BCEs</td></tr>
<tr><td>Regression</td><td>1</td><td>None (linear)</td><td>MSE / MAE / Huber</td></tr>
<tr><td>Count data</td><td>1</td><td>Exp / softplus</td><td>Poisson NLL</td></tr>
</tbody></table>
<div class="trap"><b>Why the non-linearity is non-negotiable:</b> stack two linear layers and you get <code>W₂(W₁x) = (W₂W₁)x</code> — a single linear map. Without activations, a 100-layer network has exactly the expressive power of one layer. Say this; it's the point of the question.</div>
<pre><code>import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

model = Sequential([
    Dense(4, activation='relu', input_shape=(5,)),
    Dense(1, activation='sigmoid'),
])
model.compile(optimizer='adam', loss='binary_crossentropy',
              metrics=['accuracy', tf.keras.metrics.AUC(name='auc')])
model.fit(X, y, epochs=10, batch_size=32, validation_split=0.2)</code></pre>`},

{q:"Activation functions — sigmoid, tanh, ReLU, GELU, SwiGLU, and when to use which",
roles:["ds","aie"],lvl:"core",tags:["dl","high-freq"],
a:`<table><thead><tr><th>Function</th><th>Form</th><th>Range</th><th>Notes</th></tr></thead><tbody>
<tr><td>Sigmoid</td><td><code>1/(1+e⁻ˣ)</code></td><td>(0,1)</td><td>Saturates both ends; max derivative 0.25 → vanishing gradients. Output layer only, for binary probability.</td></tr>
<tr><td>Tanh</td><td><code>(eˣ−e⁻ˣ)/(eˣ+e⁻ˣ)</code></td><td>(−1,1)</td><td>Zero-centered (better than sigmoid) but still saturates. Used inside LSTM/GRU gates.</td></tr>
<tr><td>ReLU</td><td><code>max(0,x)</code></td><td>[0,∞)</td><td>Derivative 1 when active — no vanishing. Cheap, sparse. <strong>Dying ReLU:</strong> a neuron pushed permanently negative has zero gradient forever.</td></tr>
<tr><td>Leaky ReLU / PReLU</td><td><code>max(αx, x)</code></td><td>(−∞,∞)</td><td>Small negative slope (α≈0.01) keeps dead neurons alive. PReLU learns α.</td></tr>
<tr><td>ELU / SELU</td><td>exponential for x&lt;0</td><td>(−α,∞)</td><td>Smooth, pushes activations toward zero mean. SELU is self-normalizing under strict conditions.</td></tr>
<tr><td>GELU</td><td><code>x·Φ(x)</code></td><td>≈(−0.17,∞)</td><td>Smooth, probabilistic gating. <strong>Standard in BERT and GPT-family transformers.</strong></td></tr>
<tr><td>Swish / SiLU</td><td><code>x·σ(x)</code></td><td>≈(−0.28,∞)</td><td>Smooth, non-monotonic, learned-ish. Common in modern vision nets.</td></tr>
<tr><td>SwiGLU</td><td><code>Swish(xW)⊙(xV)</code></td><td>—</td><td>Gated variant used in Llama/PaLM FFN blocks. Adds a third projection, so the hidden dim is scaled to ⅔ to keep parameter count comparable.</td></tr>
<tr><td>Softmax</td><td><code>eˣⁱ/Σeˣʲ</code></td><td>(0,1), sums to 1</td><td>Output layer for multi-class. Not a hidden activation.</td></tr>
</tbody></table>
<div class="say"><b>Say this:</b> "ReLU by default for anything convolutional or MLP — it's cheap and it doesn't vanish. GELU or SwiGLU inside transformer feed-forward blocks, because the smooth gating empirically trains better at scale. Sigmoid and softmax belong at the output, not in hidden layers, and tanh survives mainly inside recurrent gates."</div>`},

{q:"Loss functions: which one for which problem, and why cross-entropy over MSE for classification",
roles:["ds","aie"],lvl:"core",tags:["dl"],
a:`<table><thead><tr><th>Loss</th><th>Use</th></tr></thead><tbody>
<tr><td>MSE / L2</td><td>Regression. Penalizes large errors quadratically → outlier-sensitive.</td></tr>
<tr><td>MAE / L1</td><td>Regression with outliers. Robust; but constant gradient magnitude and non-differentiable at 0.</td></tr>
<tr><td>Huber / Smooth L1</td><td>Regression: L2 near zero, L1 in the tails. Best of both.</td></tr>
<tr><td>Quantile / pinball</td><td>Predicting an interval or a specific percentile (e.g. p90 demand for inventory).</td></tr>
<tr><td>Binary cross-entropy</td><td>Binary and multi-label classification.</td></tr>
<tr><td>Categorical cross-entropy</td><td>Multi-class, single label.</td></tr>
<tr><td>Focal loss</td><td>Extreme imbalance / dense detection. <code>−α(1−p)^γ log p</code> down-weights easy examples so the gradient concentrates on hard ones.</td></tr>
<tr><td>Contrastive / triplet / InfoNCE</td><td>Embedding and retrieval models — pull positives together, push negatives apart.</td></tr>
<tr><td>KL divergence</td><td>Distillation (match a teacher's soft distribution), VAEs.</td></tr>
<tr><td>CTC</td><td>Unaligned sequence tasks — ASR, handwriting.</td></tr>
</tbody></table>
<p><strong>Why cross-entropy and not MSE for classification:</strong></p>
<ol>
<li><strong>Gradient behaviour.</strong> With sigmoid + MSE, the gradient carries a σ'(z) factor, which is nearly zero when the model is confidently wrong — exactly when you most need a large update, learning stalls. With sigmoid + BCE, the σ' cancels and the gradient reduces to <code>(ŷ − y)·x</code>: proportional to the error. Confidently wrong produces a large gradient.</li>
<li><strong>Correct probabilistic objective.</strong> Cross-entropy is the negative log-likelihood of a Bernoulli/categorical model, so minimizing it is maximum likelihood estimation and yields calibrated probabilities. MSE corresponds to a Gaussian likelihood, which is the wrong noise model for a label.</li>
<li><strong>Convexity.</strong> BCE is convex in the logits for logistic regression; MSE with a sigmoid is not.</li>
</ol>
<div class="say"><b>Say this:</b> "Cross-entropy, because with a sigmoid or softmax output the activation derivative cancels and the gradient becomes proportional to the raw error — so a confidently wrong prediction produces a strong correction, where MSE would produce a vanishing one. It's also the maximum-likelihood objective for a categorical target, so the probabilities mean something."</div>`}
]},

{
title:"Backpropagation",
items:[
{q:"Derive backpropagation for a 2-input, 2-hidden, 1-output network",
roles:["ds","aie"],lvl:"core",tags:["dl","math","high-freq"],
a:`<pre><code>x1 ──w11──┐
          ├──► h1 ──v1──┐
x2 ──w21──┘             ├──► o ──► ŷ ──► L
x1 ──w12──┐             │
          ├──► h2 ──v2──┘
x2 ──w22──┘</code></pre>
<p><strong>Forward:</strong></p>
<pre><code>z_h1 = w11·x1 + w21·x2 + b_h1      h1 = f(z_h1)
z_h2 = w12·x1 + w22·x2 + b_h2      h2 = f(z_h2)
z_o  = v1·h1  + v2·h2  + b_o       ŷ  = g(z_o)
L    = L(ŷ, y)</code></pre>
<p><strong>Backward — output weights are easiest (shortest path):</strong></p>
<pre><code>∂L/∂v1 = (∂L/∂ŷ) · (∂ŷ/∂z_o) · (∂z_o/∂v1)
       = (∂L/∂ŷ) · g'(z_o)    · h1

∂L/∂v2 = (∂L/∂ŷ) · g'(z_o) · h2
∂L/∂b_o = (∂L/∂ŷ) · g'(z_o)</code></pre>
<p><strong>Hidden weights — follow the full path:</strong> <code>w11 → z_h1 → h1 → z_o → ŷ → L</code></p>
<pre><code>∂L/∂w11 = (∂L/∂ŷ)·g'(z_o)· v1 · f'(z_h1) · x1
∂L/∂w21 = (∂L/∂ŷ)·g'(z_o)· v1 · f'(z_h1) · x2
∂L/∂w12 = (∂L/∂ŷ)·g'(z_o)· v2 · f'(z_h2) · x1
∂L/∂w22 = (∂L/∂ŷ)·g'(z_o)· v2 · f'(z_h2) · x2</code></pre>
<p><strong>Define the local error signal δ</strong> and it collapses into the standard form:</p>
<pre><code>δ_o  = (∂L/∂ŷ) · g'(z_o)
δ_h1 = δ_o · v1 · f'(z_h1)

∂L/∂v1  = δ_o  · h1
∂L/∂w11 = δ_h1 · x1</code></pre>
<p>Every weight gradient is <strong>(local error at the downstream node) × (activation at the upstream node)</strong>. That single sentence is backprop.</p>
<div class="say"><b>The drill:</b> draw the network, pick any weight, and write every path from it to the loss. The chain rule is the product along one path. That's the whole algorithm.</div>`},

{q:"What happens to the gradient when a weight feeds multiple outputs?",
roles:["ds","aie"],lvl:"senior",tags:["dl","math","senior-signal"],
a:`<p><strong>Gradients add across paths.</strong> This is the multivariable chain rule, and it's the specific thing interviewers use to check whether you understand backprop or memorized it.</p>
<pre><code>              ┌──► o1 ──► L1
h1, h2 ───────┤
              └──► o2 ──► L2

L = L1 + L2</code></pre>
<p>Now w11 reaches the loss through two routes:</p>
<pre><code>Path 1: w11 → z_h1 → h1 → o1 → L1
Path 2: w11 → z_h1 → h1 → o2 → L2

∂L/∂w11 = ∂L1/∂w11 + ∂L2/∂w11</code></pre>
<p>Generally, for the hidden node's error signal:</p>
<pre><code>δ_h1 = f'(z_h1) · Σ_k ( δ_ok · v_{1k} )</code></pre>
<p>— the sum over every downstream node h1 feeds.</p>
<p><strong>Why it matters in practice:</strong></p>
<ul>
<li>It's why the backward pass is a matrix multiply by <strong>Wᵀ</strong> rather than by W — the transpose is exactly "sum the contributions from all downstream units."</li>
<li>It's why shared/tied weights (embedding tied to output head, weight-sharing in CNNs, an adapter reused across layers) accumulate gradient from every use site.</li>
<li>It's why PyTorch <em>accumulates</em> into <code>.grad</code> and you must call <code>zero_grad()</code> — the accumulation semantics are the multi-path rule, and gradient accumulation across micro-batches exploits the same property.</li>
<li>It's why multi-task learning needs loss weighting: each task's gradient is summed into the shared trunk, so a task with a larger-scale loss silently dominates.</li>
</ul>
<div class="say"><b>Say this:</b> "Products along a single path, sums across parallel paths. That's the whole content of reverse-mode autodiff — and it's why the backward pass multiplies by W transpose, and why PyTorch accumulates gradients instead of overwriting them."</div>`}
]},

{
title:"Normalization & regularization",
items:[
{q:"What is batch normalization and why do we use it?",
roles:["ds","aie"],lvl:"core",tags:["dl","high-freq"],
a:`<p>Normalize a layer's pre-activations across the <strong>batch dimension</strong> to zero mean and unit variance, then rescale with two learned parameters.</p>
<pre><code>μ_B  = (1/m) Σ xᵢ
σ²_B = (1/m) Σ (xᵢ − μ_B)²
x̂ᵢ   = (xᵢ − μ_B) / √(σ²_B + ε)
yᵢ   = γ·x̂ᵢ + β            γ, β learned</code></pre>
<p>γ and β let the network undo the normalization if that's optimal — without them, BN would strictly reduce expressiveness.</p>
<p><strong>Why it helps:</strong></p>
<ul>
<li><strong>Enables higher learning rates</strong> and much faster convergence. This is the main practical benefit.</li>
<li><strong>Smooths the loss landscape.</strong> The original "reduces internal covariate shift" explanation is what you'll be asked to recite, but the better-supported explanation (Santurkar et al., 2018) is that BN reduces the Lipschitz constant of the loss, making gradients more predictive and larger steps safe. <strong>Saying both earns real credit.</strong></li>
<li><strong>Mild regularization</strong> — batch statistics inject noise, so each example is normalized slightly differently each epoch. Often lets you reduce dropout.</li>
<li><strong>Reduces sensitivity to initialization.</strong></li>
</ul>
<p><strong>Train vs inference — the question they follow up with:</strong> at training time BN uses the current mini-batch's μ and σ². At inference there is no batch, so it uses <strong>running (exponential moving average) estimates</strong> collected during training. Forgetting <code>model.eval()</code> in PyTorch means inference uses batch statistics — this is a real production bug that makes single-sample predictions wildly unstable.</p>
<p><strong>Where BN fails:</strong> small batch sizes (statistics are noisy), variable-length sequences, RNNs, and distributed training without synchronized BN. That's why transformers use LayerNorm instead.</p>`},

{q:"BatchNorm vs LayerNorm vs RMSNorm — and why transformers use LayerNorm",
roles:["aie"],lvl:"senior",tags:["dl","transformers","senior-signal"],
a:`<table><thead><tr><th></th><th>BatchNorm</th><th>LayerNorm</th><th>RMSNorm</th></tr></thead><tbody>
<tr><td>Normalizes across</td><td>The batch, per feature</td><td>The features, per example</td><td>The features, per example</td></tr>
<tr><td>Depends on batch size</td><td><strong>Yes</strong></td><td>No</td><td>No</td></tr>
<tr><td>Train ≠ inference</td><td>Yes (running stats)</td><td>No — identical</td><td>No</td></tr>
<tr><td>Centers (subtracts mean)</td><td>Yes</td><td>Yes</td><td><strong>No</strong> — divides by RMS only</td></tr>
<tr><td>Learned params</td><td>γ, β</td><td>γ, β</td><td>γ only</td></tr>
<tr><td>Home</td><td>CNNs, tabular MLPs</td><td>Transformers, RNNs</td><td>Llama, Mistral, most modern LLMs</td></tr>
</tbody></table>
<p><strong>Why transformers can't use BatchNorm:</strong></p>
<ol>
<li>Sequences have variable length and are padded — batch statistics get polluted by padding tokens.</li>
<li>Token position t in one sequence has no meaningful relationship to position t in another, so normalizing across the batch at a position mixes unrelated things.</li>
<li>Autoregressive inference processes one token at a time with batch size effectively 1 — batch statistics are undefined.</li>
<li>LLM training uses gradient accumulation and model/pipeline parallelism, where a "batch" is split across devices; BN would need expensive cross-device synchronization every layer.</li>
</ol>
<p>LayerNorm normalizes each token's own feature vector independently, so it behaves identically in training and inference, at any batch size, for any sequence length.</p>
<p><strong>RMSNorm</strong> drops the mean-centering: <code>y = γ · x / √(mean(x²) + ε)</code>. Empirically as good, ~10–15% cheaper (one less reduction pass, no mean to store), and it's what Llama, Mistral and most current open models use.</p>
<p><strong>Pre-LN vs Post-LN</strong> — worth volunteering. The original transformer put LayerNorm <em>after</em> the residual add (post-LN); this needs careful warmup and is unstable deep. Modern models use <strong>pre-LN</strong> (normalize before the sublayer, <code>x + Attn(LN(x))</code>), which leaves a clean identity path through the residual stream and trains stably to 100+ layers.</p>`},

{q:"Regularization in deep learning — the whole toolkit",
roles:["ds","aie"],lvl:"core",tags:["dl"],
a:`<ul>
<li><strong>Dropout</strong> — randomly zero a fraction p of activations each training step, then scale by 1/(1−p) so expectations match (inverted dropout). Prevents co-adaptation of neurons; approximates an ensemble over 2^n subnetworks. <strong>Disabled at inference.</strong> Typical p: 0.1–0.3 in transformers, 0.5 in older dense nets.</li>
<li><strong>Weight decay / L2</strong> — shrinks weights toward zero. Use <strong>AdamW</strong> so the decay is decoupled from the adaptive scaling.</li>
<li><strong>Early stopping</strong> — halt when validation loss stops improving, with patience. Effectively free regularization; always restore the best checkpoint, not the last.</li>
<li><strong>Data augmentation</strong> — the most effective form when applicable. Images: crop, flip, colour jitter, Mixup, CutMix, RandAugment. Text: back-translation, synonym replacement, paraphrasing with an LLM. Audio: SpecAugment, time/pitch shift.</li>
<li><strong>Label smoothing</strong> — replace the one-hot target with (1−ε) on the true class and ε/(K−1) elsewhere. Reduces overconfidence and improves calibration; standard in classification and MT.</li>
<li><strong>Batch/Layer normalization</strong> — regularizes as a side effect.</li>
<li><strong>Stochastic depth / LayerDrop</strong> — randomly skip entire residual blocks; used in very deep nets.</li>
<li><strong>Gradient noise, weight noise</strong> — less common but effective for small data.</li>
<li><strong>Ensembling / snapshot ensembles / SWA</strong> — averaging weights along the trajectory (Stochastic Weight Averaging) finds flatter minima that generalize better.</li>
<li><strong>Transfer learning</strong> — starting from pretrained weights is itself a strong prior and the highest-leverage regularizer when data is limited.</li>
</ul>
<div class="say"><b>Say this:</b> "In order of leverage: more or better data, then transfer learning, then early stopping, then weight decay and dropout. I tune dropout last because it's the one most likely to cost me capacity I actually needed. And with modern over-parameterized models I lean more on data and augmentation than on explicit penalties."</div>`},

{q:"Weight initialization — why not zeros, and what's the right scheme?",
roles:["ds","aie"],lvl:"core",tags:["dl"],
a:`<p><strong>Not zeros:</strong> every neuron in a layer computes the same output, receives the same gradient, and updates identically — the layer collapses to a single neuron forever. This is the <em>symmetry-breaking</em> problem. (Biases can safely start at zero; weights cannot.)</p>
<p><strong>Not too large:</strong> activations and gradients explode with depth. <strong>Not too small:</strong> they vanish. The goal is to keep activation variance roughly constant layer to layer.</p>
<table><thead><tr><th>Scheme</th><th>Variance</th><th>Use with</th></tr></thead><tbody>
<tr><td><strong>Xavier / Glorot</strong></td><td><code>2/(n_in + n_out)</code></td><td>tanh, sigmoid — symmetric activations</td></tr>
<tr><td><strong>He / Kaiming</strong></td><td><code>2/n_in</code></td><td>ReLU family — the 2× compensates for ReLU zeroing half the inputs</td></tr>
<tr><td>LeCun</td><td><code>1/n_in</code></td><td>SELU</td></tr>
<tr><td>Orthogonal</td><td>—</td><td>RNNs; preserves gradient norm through time</td></tr>
<tr><td>Small-σ normal (0.02)</td><td>—</td><td>GPT-style transformers, often with residual-branch scaling by 1/√(2N)</td></tr>
</tbody></table>
<div class="say"><b>Say this:</b> "He initialization for ReLU networks, Xavier for tanh. The factor of two in He exists because ReLU zeros roughly half its inputs, halving the output variance — so you double the initialization variance to compensate. And in practice normalization layers make the network far less sensitive to this, which is part of why they were such a big deal."</div>`}
]},

{
title:"Continual learning & transfer",
items:[
{q:"What is catastrophic forgetting and how do you prevent it?",
roles:["aie"],lvl:"senior",tags:["llm","finetuning","high-freq"],
a:`<p>A network trained sequentially on a new task loses performance on previously learned tasks, because gradient descent overwrites the weights that encoded the old knowledge.</p>
<pre><code>Train on Task A (cats vs dogs)        → 98%
Fine-tune same model on Task B        → B: 97%
Re-test Task A                        → 55%   ← forgotten

After A:  W = [ 0.4,  1.2, -0.8,  0.9]
After B:  W = [ 0.9, -0.3,  1.5, -0.2]   ← same weights, rewritten</code></pre>
<p><strong>Mitigations, strongest-first for LLM work:</strong></p>
<ol>
<li><strong>Parameter-efficient fine-tuning (LoRA / adapters).</strong> Freeze the base model entirely and train a small set of new parameters. The pretrained knowledge is structurally untouchable. This is the practical answer for LLMs, and the one to lead with.</li>
<li><strong>Replay / experience replay.</strong> Mix old data into new batches — a 70/30 new/old split is typical. Simple and very effective; requires storing old data.</li>
<li><strong>Elastic Weight Consolidation (EWC).</strong> Penalize changes to weights that mattered for the old task, weighted by Fisher information:
<pre><code>L = L_new + λ Σᵢ Fᵢ (wᵢ − w*ᵢ)²</code></pre>
where w* are the post-Task-A weights and F is the Fisher diagonal (importance). High importance → the weight barely moves. Related: Synaptic Intelligence, Memory Aware Synapses.
<br><em>Intuition:</em> replay is repainting the old parts of the wall too; EWC is taping over the important areas before you paint.</li>
<li><strong>Learning without Forgetting (LwF).</strong> Keep the old model as a teacher and add a distillation term so the new model's outputs on old-task inputs stay close to the teacher's. No old data needed — good when data can't be retained for privacy reasons.</li>
<li><strong>Progressive networks.</strong> Freeze the old network, add a new column with lateral connections to it. Essentially zero forgetting, but the model grows with every task.</li>
<li><strong>Multi-task learning.</strong> Train on everything jointly instead of sequentially. Best result when you can afford it; often you can't, because the pretraining corpus is unavailable.</li>
<li><strong>Lower learning rate + fewer epochs + layer freezing.</strong> The cheapest partial mitigation: freeze the lower layers, train only the top, and keep the LR small (1e-5 range).</li>
</ol>
<p><strong>The LLM-specific version:</strong> fine-tune Llama only on legal documents and it gets better at legal text and measurably worse at general reasoning and instruction-following — "alignment tax." Mitigate by mixing 5–20% general instruction data into the fine-tuning mix, using LoRA instead of full fine-tuning, and — critically — <strong>running a regression eval suite on general capabilities, not just the target task</strong>, so you can see the degradation before shipping.</p>
<div class="say"><b>One-minute answer:</b> "Catastrophic forgetting is when sequential training overwrites the weights that stored earlier knowledge. For LLMs I default to LoRA or adapters, because freezing the base model makes forgetting structurally impossible. If I must fully fine-tune, I mix replay data — typically 10–30% general instruction data — and I always keep a held-out general-capability eval alongside the task eval, because the task metric will look great while the model quietly loses its general behaviour."</div>`},

{q:"How do adapters work?",
roles:["aie"],lvl:"senior",tags:["llm","finetuning","peft","high-freq"],
a:`<p><strong>The problem with full fine-tuning:</strong> every weight is updated, you must store a complete model copy per task, and the model can forget its pretrained knowledge.</p>
<p><strong>The adapter idea:</strong> freeze the pretrained model and insert a small trainable bottleneck network inside each transformer block.</p>
<pre><code>Input
  │
Frozen sublayer (attention / FFN)
  │  h
Adapter (trainable)
  │  u
Output = h + u          ← residual</code></pre>
<p><strong>The bottleneck architecture,</strong> for hidden dim 768 and bottleneck 64:</p>
<pre><code>768  ──W_down──►  64  ──ReLU/GELU──►  64  ──W_up──►  768

z = W_down · h        (768 → 64)
a = GELU(z)
u = W_up · a          (64 → 768)
out = h + u           ← residual connection</code></pre>
<p><strong>Why the residual matters:</strong> initialize W_up near zero, so <code>u ≈ 0</code> at the start and the adapted model is <em>numerically identical</em> to the pretrained one. Training then nudges it away gradually. Without this, inserting a random network mid-stack would destroy the pretrained behaviour on step one.</p>
<p><strong>Parameter count:</strong> a transformer layer might have 10M parameters; its adapter has ~100K. For a 7B model, adapters total roughly 10–50M trainable parameters — <strong>under 1%</strong> — while recovering most of full fine-tuning quality on many tasks.</p>
<table><thead><tr><th></th><th>Adapters</th><th>LoRA</th></tr></thead><tbody>
<tr><td>Base frozen</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Mechanism</td><td>Adds new <strong>layers</strong> in series</td><td>Adds a low-rank <strong>update</strong> to existing weight matrices: <code>W + BA</code></td></tr>
<tr><td>Inference overhead</td><td>Real — extra sequential depth per block</td><td><strong>Zero if merged</strong> — fold BA into W</td></tr>
<tr><td>Serving many tasks</td><td>Swap adapter modules</td><td>Swap or hot-stack LoRA weights; can batch multiple LoRAs</td></tr>
<tr><td>Typical target</td><td>After attention and/or FFN</td><td>q/v projections (often all four, plus FFN)</td></tr>
</tbody></table>
<div class="say"><b>Interview answer:</b> "Adapters are a PEFT method: freeze the pretrained model and insert a small bottleneck network into each transformer block — down-project the hidden state to a low dimension, apply a non-linearity, project back up, and add the result through a residual connection. The up-projection is initialized near zero so the adapted model starts identical to the original. Only the adapter parameters are trained, typically under 1% of the total, so you get low memory cost, preserved pretrained knowledge, and one small artifact per task instead of a full model copy. The tradeoff versus LoRA is that adapters add sequential depth at inference, whereas a LoRA update can be merged into the base weights for zero overhead."</div>`}
]}
]});
