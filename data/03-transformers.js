PREP.push({
id:"transformers", n:"03", title:"Transformers & LLM Internals", icon:"◈",
blurb:"Attention from first principles through to the engineering that makes serving viable — KV cache, GQA, RoPE, MoE, decoding strategies. This is where AI Engineer loops get deep.",
topics:[
{
title:"Attention mechanism",
items:[
{q:"Explain the attention mechanism from first principles",
roles:["aie"],lvl:"core",tags:["transformers","high-freq"],
a:`<p>Attention lets a model compute a representation of one position as a <strong>learned weighted average of information from all positions</strong>, where the weights are content-dependent rather than fixed.</p>
<pre><code>Attention(Q, K, V) = softmax( Q Kᵀ / √d_k ) V</code></pre>
<p>The database analogy is the one to use out loud:</p>
<ul>
<li><strong>Q (Query)</strong> — what this position is looking for.</li>
<li><strong>K (Key)</strong> — what each position advertises about itself.</li>
<li><strong>V (Value)</strong> — the content each position contributes if it's attended to.</li>
</ul>
<p>Q·Kᵀ measures relevance between every query and every key. Softmax turns those scores into a probability distribution over positions. Multiplying by V produces a weighted blend of content.</p>
<p><strong>Why divide by √d_k — they will ask this.</strong> If q and k have components with variance 1 and dimension d_k, their dot product has variance d_k. For d_k = 64 the scores have standard deviation 8; feed values that large into softmax and it saturates — one weight goes to ~1, the rest to ~0, and the gradient through softmax vanishes. Dividing by √d_k renormalizes the variance back to 1, keeping softmax in its responsive range.</p>
<p><strong>Complexity:</strong> O(n²·d) in time and O(n²) in memory for the attention matrix — quadratic in sequence length. This single fact drives FlashAttention, sliding-window attention, sparse attention, and the entire long-context research agenda.</p>`},

{q:"Walk me through self-attention with a numerical example",
roles:["aie"],lvl:"core",tags:["transformers","math","high-freq"],
a:`<p>Two tokens, embedding dim 2, identity weight matrices for clarity.</p>
<p><strong>Step 1 — embeddings:</strong></p>
<pre><code>x_the = [1.0, 0.0]
x_cat = [0.0, 1.0]
X = [[1,0],
     [0,1]]</code></pre>
<p><strong>Step 2 — project to Q, K, V.</strong> With W_Q = W_K = W_V = I, we get Q = K = V = X.</p>
<p><strong>Step 3 — scores = Q Kᵀ:</strong></p>
<pre><code>Q Kᵀ = [[1·1+0·0, 1·0+0·1],
        [0·1+1·0, 0·0+1·1]]
     = [[1.0, 0.0],
        [0.0, 1.0]]</code></pre>
<p><strong>Step 4 — softmax each row</strong> (skipping the √d_k scaling for this toy case):</p>
<pre><code>softmax([1.0, 0.0]) = [e¹/(e¹+e⁰), e⁰/(e¹+e⁰)] ≈ [0.73, 0.27]
softmax([0.0, 1.0]) ≈ [0.27, 0.73]</code></pre>
<p><strong>Step 5 — weighted sum of V:</strong></p>
<pre><code>out_the = 0.73·[1,0] + 0.27·[0,1] = [0.73, 0.27]
out_cat = 0.27·[1,0] + 0.73·[0,1] = [0.27, 0.73]</code></pre>
<p>Each token's new vector now contains a share of the other token's content — it's a <strong>contextual embedding</strong>. Before attention, "the" was [1,0] in every sentence; after, it depends on its neighbours.</p>
<p><strong>Be ready to state the shapes,</strong> which is the follow-up:</p>
<pre><code>X:        (B, n, d_model)
W_Q/K/V:  (d_model, d_k)
Q,K,V:    (B, n, d_k)
Q Kᵀ:     (B, n, n)          ← the quadratic term
output:   (B, n, d_k)</code></pre>`},

{q:"If every token's Q is dotted with its own K, won't each token always attend most to itself?",
roles:["aie"],lvl:"senior",tags:["transformers","senior-signal"],
a:`<p>Sharp question, and the honest answer is <strong>partly yes — and the architecture is built to handle it.</strong></p>
<p><strong>Why the concern is real:</strong> with untrained or near-identity projections, <code>q_i · k_i</code> is the dot product of a vector with (nearly) itself, which is maximized at zero angle. Early in training, and in the early layers, tokens do attend heavily to themselves. Attention-map studies on trained models confirm a strong diagonal.</p>
<p><strong>Why it isn't a problem — four mechanisms:</strong></p>
<ol>
<li><strong>Q and K come from different learned projections.</strong> <code>q_i = W_Q x_i</code> and <code>k_i = W_K x_i</code>. Since W_Q ≠ W_K, q_i and k_i are <em>not</em> the same vector, and training is free to make them point in quite different directions. The model learns to make the query of "sat" align with the key of "cat" rather than with its own key. This is the core of the answer.</li>
<li><strong>Training pressure.</strong> Attending only to yourself produces no contextualization and therefore high loss. Gradient descent actively pushes W_Q and W_K apart to reduce it.</li>
<li><strong>Softmax spreads mass.</strong> Even with the self-score highest, other tokens receive substantial weight. A realistic trained pattern for "sat": cat 0.45, sat 0.40, the 0.10, mat 0.05 — the subject wins.</li>
<li><strong>Multi-head attention and depth.</strong> Different heads specialize — some are positional (attend to the previous token), some syntactic (verb→subject), some are "no-op" heads that park attention on a sink token. With 32 layers × 32 heads, a diagonal-dominant head costs nothing.</li>
</ol>
<p><strong>Senior extras worth volunteering:</strong> dropout on attention weights breaks over-fixation during training; residual connections mean a token retains its own information through the skip path <em>without</em> needing to attend to itself, which frees attention to look outward. And the phenomenon has a known pathology — <strong>attention sinks</strong>, where models dump excess attention mass on the first token (often BOS) as a soft no-op. That's a practical detail: naively evicting the first token from a streaming KV cache destroys quality, which is why StreamingLLM keeps the sink tokens pinned.</p>
<div class="say"><b>Say this:</b> "The intuition is right for an untrained model, and you do see a strong diagonal in early layers. But Q and K come from two different learned projections, so a token's query is not its own key — training pushes them apart precisely because self-attention-only gives no contextualization and high loss. The residual connection also means a token already carries its own information forward, so attention is free to spend its budget looking elsewhere."</div>`},

{q:"Multi-head attention — why multiple heads, and what are the shapes?",
roles:["aie"],lvl:"core",tags:["transformers","high-freq"],
a:`<pre><code>MultiHead(Q,K,V) = Concat(head₁, …, head_h) W_O
head_i = Attention(Q W_Q^i, K W_K^i, V W_V^i)</code></pre>
<p><strong>Why not one big head:</strong> a single softmax produces a single distribution per query, so it can only represent one relationship at a time. In "The cat that the dog chased sat", the word "sat" needs to attend to its subject (cat), its clause boundary, and nearby positional context simultaneously. Splitting into h subspaces lets each head learn a different relation type, and averaging inside one head would blur them together.</p>
<p><strong>Shapes</strong> — note that d_k = d_model / h, so multi-head attention costs roughly the same as single-head:</p>
<pre><code>d_model = 512, h = 8  →  d_k = d_v = 64

per head:   Q,K,V  (B, n, 64)
            scores (B, n, n)
            out    (B, n, 64)
concat:            (B, n, 512)
W_O:               (512, 512)
final:             (B, n, 512)</code></pre>
<p><strong>Observed head specializations</strong> in trained models: previous-token heads, positional heads, syntactic-dependency heads, rare-token/"copy" heads, induction heads (the mechanism behind in-context learning), and no-op heads that can be pruned with little loss.</p>
<p><strong>Senior follow-up they may ask:</strong> "Are all heads useful?" No — Michel et al. showed a large fraction can be pruned at little cost, which motivated MQA/GQA and head pruning as inference optimizations.</p>`},

{q:"MHA vs MQA vs GQA — what problem do they solve?",
roles:["aie"],lvl:"senior",tags:["transformers","serving","senior-signal"],
a:`<p>All three are about the <strong>KV cache size at inference</strong>, not model quality. During autoregressive decoding you cache K and V for every past token; that cache is the memory bottleneck and it dominates the memory bandwidth cost of each generated token.</p>
<table><thead><tr><th></th><th>MHA</th><th>MQA</th><th>GQA</th></tr></thead><tbody>
<tr><td>Query heads</td><td>h</td><td>h</td><td>h</td></tr>
<tr><td>K/V heads</td><td>h</td><td><strong>1</strong></td><td>g (groups), 1 &lt; g &lt; h</td></tr>
<tr><td>KV cache size</td><td>1×</td><td>1/h ×</td><td>g/h ×</td></tr>
<tr><td>Quality</td><td>Best</td><td>Noticeable degradation</td><td><strong>Near-MHA</strong></td></tr>
<tr><td>Used by</td><td>Original transformer, GPT-2/3</td><td>PaLM, Falcon</td><td>Llama 2 70B+, Llama 3, Mistral, most current models</td></tr>
</tbody></table>
<p><strong>KV cache size formula</strong> — worth being able to compute live:</p>
<pre><code>bytes = 2 (K and V) × n_layers × n_kv_heads × d_head × seq_len × batch × dtype_bytes

Llama-2-70B, MHA, 4k context, batch 1, fp16:
  2 × 80 × 64 × 128 × 4096 × 1 × 2  ≈  10.7 GB
With GQA (8 KV heads instead of 64):  ≈ 1.3 GB   — 8× smaller</code></pre>
<p>That difference is the difference between serving 1 concurrent request and 8 on the same GPU. <strong>GQA is the compromise that made long-context, high-throughput serving economically viable.</strong></p>
<p><strong>Also know:</strong> <strong>MLA</strong> (Multi-head Latent Attention, DeepSeek) compresses KV into a low-rank latent, shrinking the cache further; <strong>sliding-window attention</strong> (Mistral) bounds the cache by window size; and <strong>cross-layer KV sharing</strong> reuses one layer's cache across several.</p>
<div class="say"><b>Say this:</b> "They're KV-cache optimizations. Multi-query collapses all K/V heads to one, which cuts the cache by a factor of h but costs quality. Grouped-query shares K/V across groups of query heads and recovers almost all of it — that's why Llama 3 and Mistral use it. The reason it matters is memory bandwidth: during decoding you re-read the entire KV cache for every single token, so cache size directly sets your tokens-per-second and your maximum batch size."</div>`},

{q:"What is FlashAttention and why does it matter?",
roles:["aie"],lvl:"senior",tags:["transformers","serving"],
a:`<p>A <strong>memory-IO-aware exact</strong> attention implementation. It computes the same result as standard attention but never materializes the n×n attention matrix in high-bandwidth memory.</p>
<p><strong>The insight:</strong> attention is memory-bandwidth-bound, not compute-bound. The expensive part isn't the FLOPs — it's writing the n×n score matrix to HBM and reading it back for softmax and the V multiply.</p>
<p><strong>How:</strong> tile Q, K and V into blocks that fit in SRAM, and compute softmax incrementally with the <em>online softmax</em> trick (running max and running sum, rescaling partial outputs as new blocks arrive). Each block of the output is accumulated without the full matrix ever existing. For the backward pass it recomputes attention from the stored statistics rather than storing the matrix — trading a little compute for a large memory saving.</p>
<p><strong>Result:</strong> memory drops from O(n²) to O(n), with 2–4× wall-clock speedups and much longer feasible context lengths. FlashAttention-2 improves parallelism and work partitioning; FlashAttention-3 targets Hopper-generation hardware.</p>
<p><strong>Say the distinction clearly:</strong> it is <em>exact</em>, not an approximation. Sparse attention, Linformer, Performer and friends approximate; FlashAttention gives bit-comparable results and is purely an implementation win. That's why it was adopted universally within months.</p>`}
]},

{
title:"Architecture: encoder, decoder, and the full stack",
items:[
{q:"Explain the complete transformer architecture",
roles:["aie"],lvl:"core",tags:["transformers","high-freq"],
a:`<p>From "Attention is All You Need" (Vaswani et al., 2017). Two stacks of N identical layers (N=6 originally), relying entirely on attention rather than recurrence — which is what made training parallelizable across sequence positions.</p>
<p><strong>Encoder layer:</strong></p>
<ol>
<li>Multi-head <strong>self</strong>-attention (every position attends to every position, no mask)</li>
<li>Add &amp; Norm (residual + LayerNorm)</li>
<li>Position-wise feed-forward network: <code>FFN(x) = W₂ · act(W₁x + b₁) + b₂</code>, with inner dim typically 4× d_model, applied identically to each position</li>
<li>Add &amp; Norm</li>
</ol>
<p><strong>Decoder layer:</strong></p>
<ol>
<li><strong>Masked</strong> multi-head self-attention — a causal mask sets scores for future positions to −∞ so position t sees only ≤ t</li>
<li>Add &amp; Norm</li>
<li><strong>Cross-attention:</strong> Q from the decoder, K and V from the <em>encoder output</em>. This is the bridge between the two stacks.</li>
<li>Add &amp; Norm</li>
<li>Feed-forward + Add &amp; Norm</li>
</ol>
<p>Final decoder output → linear projection to vocab size → softmax → next-token distribution.</p>
<p><strong>Plus:</strong> input embeddings scaled by √d_model, positional encoding added to embeddings, dropout on sublayer outputs, and often weight tying between the input embedding and the output projection.</p>
<table><thead><tr><th>Variant</th><th>Encoder</th><th>Decoder</th><th>Task</th><th>Examples</th></tr></thead><tbody>
<tr><td>Encoder-only</td><td>✔</td><td>—</td><td>Understanding: classification, NER, extractive QA, embeddings</td><td>BERT, RoBERTa, DeBERTa, most embedding models</td></tr>
<tr><td>Decoder-only</td><td>—</td><td>✔</td><td>Generation, and in practice everything via prompting</td><td>GPT, Llama, Mistral, Claude</td></tr>
<tr><td>Encoder-decoder</td><td>✔</td><td>✔</td><td>Seq2seq with a distinct input and output: translation, summarization</td><td>Original transformer, T5, BART, Flan-T5</td></tr>
</tbody></table>
<div class="trap"><b>Follow-up they ask:</b> "Why did decoder-only win?" Simpler to scale (one stack, one objective), the next-token objective is self-supervised on any text at internet scale, in-context learning emerges from it, and seq2seq tasks can be expressed as prompted continuation — so the separate encoder buys little for the added complexity.</div>`},

{q:"How do encoder and decoder work together? Walk through generation step by step",
roles:["aie"],lvl:"core",tags:["transformers"],
a:`<p><strong>Encoder</strong> processes the entire input once and produces H_enc — a contextual vector per input token. This is computed a single time and reused at every decoding step.</p>
<p><strong>Decoder</strong> generates autoregressively. At step t it uses two information sources:</p>
<ul>
<li><strong>Masked self-attention</strong> — "what have I generated so far?" (Q, K, V all from the decoder)</li>
<li><strong>Cross-attention</strong> — "what in the input is relevant now?" (Q from decoder, K and V from H_enc)</li>
</ul>
<pre><code>SelfAttn:  softmax( Q_d K_dᵀ / √d + mask ) V_d
CrossAttn: softmax( Q_d K_eᵀ / √d ) V_e          ← K_e, V_e from encoder</code></pre>
<p><strong>Trace it on "Translate: I love AI" → French:</strong></p>
<table><thead><tr><th>Step</th><th>Decoder input</th><th>Output</th><th>What's happening</th></tr></thead><tbody>
<tr><td>1</td><td>&lt;BOS&gt;</td><td>"J'"</td><td>Self-attn sees only BOS; cross-attn scans the whole encoded input</td></tr>
<tr><td>2</td><td>&lt;BOS&gt; J'</td><td>"aime"</td><td>Self-attn now sees the first token; cross-attn focuses on "love"</td></tr>
<tr><td>3</td><td>&lt;BOS&gt; J' aime</td><td>"l'IA"</td><td>Cross-attn shifts to "AI"</td></tr>
<tr><td>4</td><td>… l'IA</td><td>&lt;EOS&gt;</td><td>Stop</td></tr>
</tbody></table>
<p><strong>Training vs inference asymmetry — the follow-up.</strong> At training time the decoder is fed the ground-truth prefix (<em>teacher forcing</em>) so all positions are computed in parallel in a single pass. At inference it must feed back its own predictions, one token at a time, sequentially. The resulting mismatch is called <strong>exposure bias</strong>: the model never trained on its own mistakes, so errors compound. Scheduled sampling and, more effectively, RL-based post-training partially address it.</p>`},

{q:"What are the dimensions of the encoder output, and what does '768' mean?",
roles:["aie"],lvl:"core",tags:["transformers"],
a:`<pre><code>Encoder output shape:  (batch_size, seq_len, d_model)

batch 1, 1000 tokens, d_model 768   →  (1, 1000, 768)
batch 32, 1000 tokens, d_model 768  →  (32, 1000, 768)</code></pre>
<p><strong>768 is the embedding dimension</strong> — the number of features in each token's vector. It has <em>nothing</em> to do with how many tokens a token can attend to.</p>
<p>The common confusion: "does 768 mean a token only sees 768 tokens of context?" No. Self-attention lets every token attend to <strong>all</strong> tokens in the sequence — 1000 of them in this example — regardless of d_model. What 768 controls is the <em>richness</em> of each token's representation, not the <em>reach</em> of attention. Attention reach is limited by the context window, a separate parameter.</p>
<p><strong>Analogy:</strong> in a 1000-word document, each word ends up described by 768 numbers, and those numbers were computed by looking at all 1000 words. The 768 is the resolution of the description; the 1000 is what it describes.</p>
<p><strong>Reference dimensions:</strong> BERT-base 768 (12 layers, 12 heads), BERT-large 1024 (24 layers, 16 heads), Llama-2-7B 4096 (32 layers, 32 heads), Llama-2-70B 8192 (80 layers, 64 heads).</p>
<p><strong>Getting one vector per sequence</strong> — the practical follow-up for embeddings: take the [CLS] token (BERT-style), mean-pool over tokens (attention-mask-weighted, the most common choice for sentence embeddings), max-pool, or use a trained pooling head. Mean pooling with proper masking usually beats raw [CLS] unless the model was explicitly trained for [CLS] pooling.</p>`},

{q:"Positional encoding: sinusoidal, learned, RoPE, ALiBi",
roles:["aie"],lvl:"senior",tags:["transformers","senior-signal"],
a:`<p><strong>Why any of it:</strong> attention is permutation-equivariant. Shuffle the input tokens and the set of output vectors is just shuffled too — "dog bites man" and "man bites dog" are indistinguishable. Position must be injected explicitly.</p>
<p><strong>1. Sinusoidal (original transformer)</strong> — fixed, not learned, added to the embeddings:</p>
<pre><code>PE(pos, 2i)   = sin( pos / 10000^(2i/d_model) )
PE(pos, 2i+1) = cos( pos / 10000^(2i/d_model) )</code></pre>
<p>Different frequencies per dimension, so the vector is a unique multi-scale "clock reading." The intended property is that PE(pos+k) is a linear function of PE(pos), so relative offsets are in principle learnable. Extrapolates poorly in practice.</p>
<p><strong>2. Learned absolute</strong> (BERT, GPT-2) — a trainable embedding per position. Simple and effective, but <em>hard-capped</em> at the trained maximum length; position 1025 has no embedding at all.</p>
<p><strong>3. RoPE — Rotary Position Embedding</strong> (Llama, Mistral, Qwen, most current models). Instead of adding a vector, <em>rotate</em> Q and K in 2D subspaces by an angle proportional to position:</p>
<pre><code>q'_m = R_m q_m,   k'_n = R_n k_n
⟨q'_m, k'_n⟩ depends only on (m − n)</code></pre>
<p>The dot product becomes a function of <em>relative</em> distance, which is what attention actually needs. It's applied inside attention (to Q and K, not to V), decays naturally with distance, and — crucially — supports context extension after training via <strong>NTK-aware scaling</strong>, <strong>position interpolation</strong> or <strong>YaRN</strong>, which rescale the rotation frequencies so a 4k-trained model works at 32k+. That extensibility is why RoPE won.</p>
<p><strong>4. ALiBi</strong> — add a linear, head-specific distance penalty directly to the attention scores: <code>score − m_h · |i−j|</code>. No position vectors at all. Extrapolates to far longer sequences than trained on, essentially free.</p>
<div class="say"><b>Say this:</b> "RoPE, because rotating queries and keys makes the attention score depend on relative distance rather than absolute position, and because you can rescale the rotation frequencies to extend context after training — position interpolation and YaRN are how a 4k model becomes a 32k model without pretraining from scratch. Learned absolute embeddings can't do that; they simply have no parameters for unseen positions."</div>`},

{q:"What is a Mixture of Experts (MoE) model?",
roles:["aie"],lvl:"senior",tags:["transformers","senior-signal"],
a:`<p>Replace the dense feed-forward block in each transformer layer with N parallel expert FFNs plus a small <strong>router</strong> that sends each token to only the top-k experts (typically k=1 or 2).</p>
<pre><code>Dense FFN:  every token → the one FFN            (all params active)
MoE FFN:    token → router → top-2 of 8 experts  (¼ of params active)

output = Σ_{i ∈ top-k} g_i(x) · Expert_i(x)</code></pre>
<p><strong>The point:</strong> decouple <em>total</em> parameters from <em>active</em> parameters per token. Mixtral 8×7B has ~47B total parameters but activates ~13B per token — roughly 13B inference cost with substantially better-than-13B quality.</p>
<p><strong>What interviewers probe:</strong></p>
<ul>
<li><strong>Load balancing.</strong> Without intervention the router collapses onto a few favourite experts and the rest never train. Fixed with an auxiliary load-balancing loss, expert capacity factors with token dropping, and noisy top-k routing.</li>
<li><strong>Memory vs compute.</strong> MoE saves FLOPs, not VRAM — <em>all</em> experts must be resident in memory even though only a couple run. That's why Mixtral needs ~90GB in fp16 despite 13B active params. This nuance is the senior differentiator.</li>
<li><strong>Serving complexity.</strong> Expert parallelism means all-to-all communication across devices; batching is harder because different tokens in a batch route to different experts.</li>
<li><strong>Fine-tuning instability.</strong> MoE models are more prone to overfitting and routing collapse during fine-tuning.</li>
</ul>
<p><strong>Examples:</strong> Switch Transformer, GLaM, Mixtral 8×7B / 8×22B, DeepSeek-MoE (fine-grained experts + shared always-on experts), Qwen-MoE. Widely believed to be behind several frontier models.</p>`}
]},

{
title:"Inference, decoding & serving internals",
items:[
{q:"What is the KV cache and why does it dominate LLM inference?",
roles:["aie"],lvl:"senior",tags:["serving","high-freq","senior-signal"],
a:`<p>In autoregressive decoding, generating token t requires attention over tokens 1..t−1. Their K and V projections don't change as new tokens arrive, so you cache them instead of recomputing. Without the cache, generating n tokens costs O(n³); with it, O(n²).</p>
<p><strong>Two phases with completely different characteristics — this distinction is the answer:</strong></p>
<table><thead><tr><th></th><th>Prefill</th><th>Decode</th></tr></thead><tbody>
<tr><td>What</td><td>Process the whole prompt, build the cache</td><td>Generate one token at a time</td></tr>
<tr><td>Parallelism</td><td>All prompt tokens at once</td><td>Strictly sequential</td></tr>
<tr><td>Bottleneck</td><td><strong>Compute-bound</strong> (large matmuls)</td><td><strong>Memory-bandwidth-bound</strong></td></tr>
<tr><td>Sets</td><td>Time To First Token (TTFT)</td><td>Time Per Output Token (TPOT), tokens/sec</td></tr>
<tr><td>Scales with</td><td>Prompt length</td><td>KV cache size × output length</td></tr>
</tbody></table>
<p><strong>Why decode is bandwidth-bound:</strong> to produce one token you must read every model weight and the entire KV cache from HBM, but perform only a single token's worth of arithmetic. Arithmetic intensity is terrible. This is why the cache size — not FLOPs — sets your throughput ceiling, and why every optimization below targets memory rather than compute.</p>
<p><strong>The optimization stack:</strong></p>
<ul>
<li><strong>GQA/MQA</strong> — fewer KV heads (see that card).</li>
<li><strong>PagedAttention (vLLM)</strong> — manage the cache in fixed-size blocks like OS virtual memory. Eliminates the internal fragmentation of pre-allocating max-length contiguous buffers, raising achievable batch size 2–4×.</li>
<li><strong>Continuous batching</strong> — admit and retire requests per decoding step rather than per batch, so a finished short request frees its slot immediately instead of waiting for the longest sequence in the batch.</li>
<li><strong>Prefix caching</strong> — reuse the KV cache for a shared system prompt across requests. Enormous win for RAG and agents, where a long instruction block is identical every call.</li>
<li><strong>Quantized KV cache</strong> — store K/V in int8 or fp8.</li>
<li><strong>Chunked prefill / disaggregated serving</strong> — split long prefills into chunks, or run prefill and decode on separate pools so a long prompt doesn't stall everyone's token stream.</li>
</ul>
<div class="say"><b>Say this:</b> "The KV cache turns O(n³) generation into O(n²), but it becomes the memory bottleneck. Prefill is compute-bound and sets TTFT; decode is memory-bandwidth-bound and sets tokens per second, because every token requires re-reading all the weights and the full cache for one token of math. So the levers are GQA to shrink the cache, PagedAttention and continuous batching to raise occupancy, and prefix caching to skip recomputing shared prompts — which in a RAG or agent system is most of the prompt."</div>`},

{q:"Decoding strategies: temperature, top-k, top-p, and the rest",
roles:["aie"],lvl:"core",tags:["llm","high-freq"],
a:`<p>The model outputs a distribution over the vocabulary. Decoding is how you pick from it.</p>
<ul>
<li><strong>Greedy</strong> — always the argmax. Deterministic, but repetitive and prone to degenerate loops.</li>
<li><strong>Beam search</strong> — keep the b highest-probability partial sequences. Good for translation and summarization where there's one right answer; produces bland, generic text for open-ended generation, and is rarely used for chat.</li>
<li><strong>Temperature</strong> — rescale the logits before softmax: <code>softmax(logits / T)</code>.
<ul>
<li>T → 0: approaches greedy, fully deterministic.</li>
<li>T = 1: the model's own distribution.</li>
<li>T &gt; 1: flatter, more diverse, more errors.</li>
</ul>
Use 0 for extraction, classification, SQL generation, and anything where you want reproducibility; 0.7–1.0 for creative writing.</li>
<li><strong>Top-k</strong> — sample from only the k highest-probability tokens. Problem: k is fixed regardless of how peaked the distribution is. When the model is certain, k=50 admits 49 bad options.</li>
<li><strong>Top-p / nucleus</strong> — sample from the smallest set whose cumulative probability ≥ p (e.g. 0.9). <strong>Adaptive:</strong> a confident step keeps 2 tokens, an uncertain step keeps 200. Generally preferred over top-k.</li>
<li><strong>Min-p</strong> — keep tokens with probability ≥ p × max_prob. Newer, more robust at high temperature.</li>
<li><strong>Repetition / frequency / presence penalties</strong> — reduce logits of tokens already produced. Useful, but overly aggressive settings cause the model to avoid necessary words.</li>
<li><strong>Constrained / structured decoding</strong> — mask logits so only tokens valid under a grammar or JSON schema can be sampled (Outlines, XGrammar, JSON mode). <strong>This is the correct answer to "how do you guarantee valid JSON"</strong> — it's a hard guarantee, unlike prompting and retrying.</li>
<li><strong>Speculative decoding</strong> — a small draft model proposes k tokens, the large model verifies them in one parallel forward pass, accepting the longest correct prefix. 2–3× speedup with <em>identical</em> output distribution. Variants: Medusa (extra heads), EAGLE, n-gram/prompt lookup.</li>
</ul>
<div class="trap"><b>Note on determinism:</b> temperature 0 is not a guarantee of identical outputs across runs in a distributed serving stack — batching changes floating-point reduction order, and MoE routing depends on batch composition. If reproducibility is a requirement, say this and add a seed, pinned model version, and cached-response layer.</div>`},

{q:"Tokenization: BPE, and why token counts matter commercially",
roles:["aie"],lvl:"core",tags:["llm"],
a:`<p><strong>Byte-Pair Encoding (BPE):</strong> start from bytes/characters, then repeatedly merge the most frequent adjacent pair into a new token, for a fixed number of merges. The learned merge list is the tokenizer. Variants: WordPiece (BERT, merges by likelihood gain), SentencePiece/Unigram (language-agnostic, no pre-tokenization), byte-level BPE (GPT — never produces unknown tokens because it falls back to bytes).</p>
<p><strong>Why subwords at all:</strong> word-level vocabularies can't handle unseen words and explode in size; character-level sequences are far too long. Subwords give a fixed vocabulary (~32k–200k) with full coverage — frequent words are single tokens, rare words decompose.</p>
<p><strong>Practical consequences worth raising unprompted:</strong></p>
<ul>
<li><strong>Cost and latency are per token, not per word.</strong> English averages ~1.3 tokens/word; code, JSON and non-Latin scripts are far worse. Hindi or Thai text can take 3–5× the tokens of equivalent English — a real cost and context-window issue for multilingual products.</li>
<li><strong>Arithmetic and character tasks fail</strong> partly because of tokenization — "1234" may be one token or three, and the model can't see the digits. Same reason models miscount letters in a word.</li>
<li><strong>Chunking must be token-aware.</strong> Splitting on characters gives unpredictable chunk sizes; use the model's own tokenizer.</li>
<li><strong>Prompt engineering for cost:</strong> verbose JSON keys and deep indentation burn tokens on every call. In a high-volume agent this is a measurable line item.</li>
<li><strong>Glitch tokens</strong> — rare tokens present in the tokenizer but essentially absent from training data produce bizarre behaviour.</li>
</ul>`},

{q:"Scaling laws, and what changed with inference-time compute",
roles:["aie"],lvl:"senior",tags:["llm","senior-signal"],
a:`<p><strong>Kaplan et al. (2020):</strong> loss follows a power law in parameters, data and compute — smooth and predictable over orders of magnitude. This is what justified spending ever-larger training budgets.</p>
<p><strong>Chinchilla (Hoffmann et al., 2022)</strong> corrected the recipe: for a fixed compute budget, earlier models were badly <em>under-trained</em>. The compute-optimal ratio is roughly <strong>20 tokens per parameter</strong>. GPT-3 (175B params, 300B tokens) was heavily under-trained; a 70B model on 1.4T tokens beat it at the same compute.</p>
<p><strong>The production nuance beyond Chinchilla:</strong> compute-optimal <em>training</em> is not cost-optimal <em>serving</em>. If a model will serve billions of requests, you deliberately over-train a smaller model past the Chinchilla point — it costs more to train once and far less to serve forever. That's why Llama 3 8B saw 15T tokens — roughly 1,875 tokens per parameter, nearly 100× the Chinchilla-optimal ratio of 20.</p>
<p><strong>What's changed more recently:</strong> a second scaling axis — <strong>inference-time compute</strong>. Letting a model reason for longer (extended chain-of-thought, sampling many candidates and selecting, tree search, verifier-guided search) improves accuracy in a way that also follows a predictable curve. Reasoning-focused models are trained specifically to exploit this.</p>
<p><strong>Why an interviewer cares:</strong> it's a direct architecture decision. "Do I fine-tune a bigger model, or keep the smaller one and give it more reasoning steps and better retrieval?" Increasingly the second is cheaper and more controllable — and framing the tradeoff that way is exactly the senior signal they're listening for.</p>`},

{q:"How are text embeddings trained, and bi-encoder vs cross-encoder?",
roles:["aie"],lvl:"senior",tags:["llm","rag"],
a:`<p><strong>Training:</strong> contrastive learning. Given an anchor, a positive (a relevant passage) and negatives, pull the anchor and positive together in vector space and push negatives away.</p>
<pre><code>InfoNCE:  L = −log[ exp(sim(q,p⁺)/τ) / Σⱼ exp(sim(q,pⱼ)/τ) ]</code></pre>
<ul>
<li><strong>In-batch negatives</strong> — other examples in the batch serve as negatives for free, so larger batches give a better signal.</li>
<li><strong>Hard negatives</strong> — passages that are topically similar but wrong. These matter enormously; models trained only on random negatives learn topic matching, not relevance.</li>
<li>Stages: unsupervised contrastive pretraining on weakly-paired web data → supervised fine-tuning on labelled retrieval sets → optional task/instruction tuning ("query:" / "passage:" prefixes).</li>
<li><strong>Matryoshka representation learning</strong> — train so that prefixes of the vector are themselves valid embeddings, letting you truncate 1536→256 dims and trade a little recall for 6× less storage and faster search.</li>
</ul>
<table><thead><tr><th></th><th>Bi-encoder</th><th>Cross-encoder</th></tr></thead><tbody>
<tr><td>Input</td><td>Query and document encoded <strong>separately</strong></td><td>Query and document encoded <strong>together</strong>, one sequence</td></tr>
<tr><td>Output</td><td>Two vectors → cosine similarity</td><td>A single relevance score</td></tr>
<tr><td>Precompute docs?</td><td><strong>Yes</strong> — index once, search forever</td><td>No — must run per (query, doc) pair</td></tr>
<tr><td>Cost at query time</td><td>1 encode + ANN search</td><td>N forward passes</td></tr>
<tr><td>Accuracy</td><td>Good</td><td><strong>Much better</strong> — full token-level interaction</td></tr>
<tr><td>Role</td><td>First-stage retrieval over millions</td><td>Reranking the top 50–100</td></tr>
</tbody></table>
<p><strong>The standard production pattern</strong> is therefore two-stage: a bi-encoder retrieves 100 candidates cheaply from a vector index, then a cross-encoder reranks them accurately. <strong>ColBERT</strong> sits in between — it stores per-token embeddings and uses late interaction (MaxSim), getting much of the cross-encoder's accuracy while remaining pre-indexable, at the cost of far larger storage.</p>
<p><strong>Similarity metrics:</strong> cosine (magnitude-invariant; the default), dot product (equals cosine when vectors are L2-normalized, and favours longer/higher-norm documents when they aren't), Euclidean/L2 (monotonically related to cosine for normalized vectors). Normalize consistently at index and query time — mismatched normalization is a common and silent retrieval bug.</p>`}
]}
]});
