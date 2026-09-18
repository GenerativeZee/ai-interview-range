PREP.push({
id:"rag", n:"05", title:"RAG Systems", icon:"⌕",
blurb:"The full retrieval stack — ingestion, chunking, ANN index internals, hybrid search and RRF, rerankers, advanced retrievers, evaluation and the failure taxonomy. Expect every design choice here to be challenged.",
topics:[
{
title:"Architecture & ingestion",
items:[
{q:"What is RAG, and why not just fine-tune?",
roles:["aie","agentic"],lvl:"core",tags:["rag","high-freq"],
a:`<p>Retrieval-Augmented Generation: retrieve relevant context from an external store at query time, put it in the prompt, and have the LLM answer <em>grounded in that context</em>.</p>
<pre><code>Query
  ↓ (optionally rewritten / expanded)
Embed
  ↓
Vector search (+ BM25) ──► candidates
  ↓
Rerank
  ↓
Assemble context (dedup, order, compress, budget)
  ↓
LLM with grounding instructions
  ↓
Answer + citations
  ↓
Eval / guardrails / trace</code></pre>
<table><thead><tr><th></th><th>RAG</th><th>Fine-tuning</th></tr></thead><tbody>
<tr><td>Knowledge freshness</td><td>Update the index — <strong>minutes</strong></td><td>Retrain — days, and a snapshot</td></tr>
<tr><td>Citations / provenance</td><td><strong>Native</strong></td><td>Impossible</td></tr>
<tr><td>Access control</td><td>Per-user metadata filters at query time</td><td>Baked in for everyone — a real blocker in enterprise</td></tr>
<tr><td>Cost to add knowledge</td><td>Embedding cost only</td><td>Full training run</td></tr>
<tr><td>Deletion / GDPR</td><td>Delete the row</td><td>Retrain from scratch</td></tr>
<tr><td>Teaches behaviour/format</td><td>Weakly, via prompt</td><td><strong>Strongly</strong></td></tr>
<tr><td>Per-request latency &amp; tokens</td><td>Higher — retrieval hop + long context</td><td>Lower</td></tr>
</tbody></table>
<div class="say"><b>Say this — and be specific about your own system:</b> "RAG because the corpus changes continuously, answers have to be citable, and access has to be enforced per user — none of which fine-tuning can do. In the enterprise document system I built, the deciding factor was permissions: the same question has to return different documents depending on the user's role and site, so retrieval-time metadata filtering was the only workable design. I'd still consider fine-tuning on top, but for answer <em>format</em> and domain phrasing, not for knowledge."</div>`},

{q:"Walk me through your document ingestion pipeline",
roles:["aie"],lvl:"senior",tags:["rag","ingestion","senior-signal"],
a:`<ol>
<li><strong>Source connectors</strong> — SharePoint, S3, Confluence, databases, email. Track source, version, ACLs and last-modified from the start.</li>
<li><strong>Parsing / layout extraction</strong> — the step that determines your ceiling. Native PDF text where available; OCR (Tesseract, Azure Document Intelligence, AWS Textract) for scans; layout-aware parsers (Unstructured, LlamaParse, Docling) to recover reading order, headings, and — critically — <strong>tables</strong>. A table flattened into prose is unretrievable and un-answerable.</li>
<li><strong>Normalization</strong> — strip headers/footers/watermarks, fix hyphenation and ligatures, de-column, convert tables to markdown or HTML, extract figure captions. Keep an image reference for figures so a multimodal model can be asked about them later.</li>
<li><strong>Enrichment</strong> — per-document summary, extracted entities, document type classification, effective/expiry dates, section hierarchy path. All of this becomes filterable metadata and improves retrieval more than most chunking tweaks.</li>
<li><strong>Deduplication</strong> — exact hash plus near-dup detection (MinHash/SimHash). Enterprise corpora are full of eight versions of the same SOP, and duplicates crowd out your top-k with the same passage.</li>
<li><strong>Chunking</strong> — structure-aware, with overlap. See the chunking card.</li>
<li><strong>Embedding</strong> — batched, with retry and rate-limit handling; record the model name and version per vector.</li>
<li><strong>Indexing</strong> — vector index + full-text (BM25) index + metadata index, written transactionally so partial updates don't produce a half-visible document.</li>
<li><strong>Incremental sync</strong> — change-data-capture on the source; upsert changed documents, hard-delete removed ones. <strong>Stale deletions are a compliance incident,</strong> not a bug.</li>
<li><strong>Quality gates</strong> — per-document parse-quality score, flag documents with near-zero extracted text (a scanned PDF that silently produced nothing), alert on ingestion failures rather than dropping them.</li>
</ol>
<div class="trap"><b>What separates a real answer here:</b> naming <strong>reindexing</strong> and <strong>ACL propagation</strong>. When you change the embedding model or chunking strategy you must re-embed the entire corpus — so design for a versioned index with blue-green swap and shadow evaluation, not an in-place rewrite. And when someone's permissions change in the source system, your index must reflect it; the usual pattern is to store ACL identifiers on each chunk and resolve them against the caller's groups at query time, rather than materializing per-user indexes.</div>`},

{q:"Chunking strategies — including recursive character splitting",
roles:["aie"],lvl:"core",tags:["rag","chunking","high-freq"],
a:`<p><strong>The tension:</strong> chunks must be small enough to be precise units of retrieval, large enough to be self-contained and answerable.</p>
<p><strong>1. Fixed-size</strong> — split every N tokens with overlap. Predictable, dumb, cuts mid-sentence. Only a baseline.</p>
<p><strong>2. Recursive character splitting</strong> (LangChain's <code>RecursiveCharacterTextSplitter</code>) — the practical default. Try the largest natural boundary first and fall back progressively:</p>
<pre><code>separators = ["\\n\\n", "\\n", ". ", " ", ""]

1. Split on paragraphs (\\n\\n)
2. Any resulting piece still > chunk_size?
     → split that piece on \\n
3. Still too large?  → split on sentences
4. Still too large?  → split on spaces, then hard-cut characters</code></pre>
<p>The result preserves semantic structure wherever it can while <em>guaranteeing</em> no chunk exceeds the limit. Use the model's tokenizer for the length function, not character count.</p>
<p><strong>3. Structure-aware / document-aware</strong> — split on markdown headings, HTML tags, code by function/class, or the document's own section hierarchy. Best when you have clean structure; carry the heading path into each chunk's text (<code>"SOP 4.2 &gt; Reactor Startup &gt; Safety Interlocks"</code>) so an isolated chunk still says what it's about.</p>
<p><strong>4. Semantic chunking</strong> — embed sentences, then split where consecutive-sentence similarity drops below a threshold. Topically coherent chunks; costs an embedding pass over every sentence and the threshold needs tuning.</p>
<p><strong>5. Parent-child / small-to-big</strong> — <em>embed</em> small precise chunks, but <em>return</em> the larger parent chunk or full section to the LLM. Precision in retrieval, completeness in generation. One of the highest-value patterns and the one I'd lead with.</p>
<p><strong>6. Contextual retrieval</strong> — prepend an LLM-generated sentence situating each chunk within its document before embedding it. Reported large recall improvements; costs one cheap LLM call per chunk at ingestion, made affordable by prompt caching.</p>
<p><strong>7. Late chunking</strong> — embed the whole document with a long-context embedding model, then pool token embeddings per chunk. Each chunk vector carries document-level context without duplicating text.</p>
<p><strong>8. Proposition / atomic-fact chunking</strong> — decompose into standalone factual statements. Very high precision, expensive, and can fragment reasoning that spans facts.</p>
<p><strong>Starting point:</strong> 400–800 tokens with 10–15% overlap, structure-aware splitting, heading path prepended, parent-child retrieval on top. <strong>Then tune against an eval set</strong> — this is the honest answer, and interviewers want to hear that you measured rather than guessed.</p>
<div class="say"><b>When asked "what chunk size did you use and why":</b> "I started at 512 tokens with 64 overlap because our SOP sections were roughly that length, then tuned against a golden set of about 200 question-answer pairs measuring context recall. Larger chunks improved answer completeness but hurt retrieval precision — the relevant sentence got diluted — so I moved to parent-child: embed 256-token children for precision, return the full section to the model for completeness. That was worth more than any single chunk-size value."</div>`}
]},

{
title:"Vector search & retrieval",
items:[
{q:"What is a vector database, and what are the ANN index types?",
roles:["aie"],lvl:"senior",tags:["rag","vectordb","senior-signal"],
a:`<p>A store for high-dimensional embeddings that supports approximate nearest-neighbour search plus metadata filtering. Exact search is O(n·d) per query — fine for 10k vectors, impossible for 100M.</p>
<table><thead><tr><th>Index</th><th>How</th><th>Recall</th><th>Speed</th><th>Memory</th><th>Use when</th></tr></thead><tbody>
<tr><td><strong>Flat / brute force</strong></td><td>Compare against everything</td><td>100%</td><td>Slow</td><td>Low</td><td>&lt;100k vectors, or as a recall ground truth</td></tr>
<tr><td><strong>IVF</strong></td><td>k-means into nlist cells; search nprobe nearest cells</td><td>Tunable</td><td>Fast</td><td>Low</td><td>Large static corpora; needs training</td></tr>
<tr><td><strong>HNSW</strong></td><td>Multi-layer navigable small-world graph; greedy descent from a sparse top layer</td><td><strong>Best</strong></td><td><strong>Fastest queries</strong></td><td><strong>High</strong></td><td>The default when RAM allows; supports incremental inserts</td></tr>
<tr><td><strong>PQ / OPQ</strong></td><td>Split vectors into subspaces, quantize each to a codebook</td><td>Lower</td><td>Fast</td><td><strong>Tiny</strong> (10–50×)</td><td>Billions of vectors; combine as IVF-PQ</td></tr>
<tr><td><strong>ScaNN</strong></td><td>Anisotropic quantization tuned for inner product</td><td>High</td><td>Very fast</td><td>Low</td><td>Google-scale; strong accuracy/memory frontier</td></tr>
<tr><td><strong>DiskANN</strong></td><td>Graph index resident on SSD</td><td>High</td><td>Moderate</td><td>Very low RAM</td><td>Huge corpora on modest hardware</td></tr>
</tbody></table>
<p><strong>The parameters you should be able to discuss:</strong></p>
<ul>
<li><strong>HNSW:</strong> <code>M</code> (edges per node — higher = better recall, more memory), <code>ef_construction</code> (build-time candidate list — higher = better graph, slower build), <code>ef_search</code> (query-time candidate list — <strong>the runtime recall/latency dial</strong>). Tuning ef_search is how you trade latency for recall without rebuilding.</li>
<li><strong>IVF:</strong> <code>nlist</code> ≈ √n as a rule of thumb, <code>nprobe</code> as the runtime dial.</li>
</ul>
<p><strong>Metadata filtering is where real systems break.</strong> Pre-filtering (filter then search) is exact but can leave the graph disconnected and force a fallback to brute force; post-filtering (search then filter) is fast but may return fewer than k results — or zero — if the filter is selective. Production systems use filtered-HNSW variants or partition the index by the high-cardinality filter key. <strong>Raise this unprompted; it's a strong senior signal</strong> and it is the most common cause of "the document exists but the bot says it doesn't."</p>
<p><strong>Options:</strong> Milvus and Qdrant (self-hosted, feature-rich, strong filtering), Pinecone (managed), Weaviate (hybrid built in), pgvector/pgvectorscale (excellent when you already run Postgres and want transactional consistency with your metadata), FAISS (a library, not a database — no persistence, filtering or multi-tenancy), Elasticsearch/OpenSearch (when you need BM25 and vectors in one engine), Databricks Vector Search (managed, syncs from a Delta table — the right choice inside a Databricks stack because the index follows the table).</p>`},

{q:"Hybrid search: why combine dense and sparse retrieval?",
roles:["aie"],lvl:"senior",tags:["rag","retrieval","high-freq"],
a:`<p>They fail in complementary ways, and the fix is to run both.</p>
<table><thead><tr><th></th><th>Dense (embeddings)</th><th>Sparse (BM25 / SPLADE)</th></tr></thead><tbody>
<tr><td>Matches on</td><td>Semantic meaning</td><td>Exact lexical terms</td></tr>
<tr><td>Handles paraphrase</td><td><strong>Yes</strong></td><td>No</td></tr>
<tr><td>Rare terms, IDs, codes, part numbers</td><td><strong>Poorly</strong> — "ERR-4471" has no learned meaning</td><td><strong>Exactly</strong></td></tr>
<tr><td>Acronyms &amp; jargon out of training distribution</td><td>Weak</td><td>Strong</td></tr>
<tr><td>Negation &amp; numbers</td><td>Weak</td><td>Weak</td></tr>
<tr><td>Zero-shot on a new domain</td><td>Degrades</td><td>Robust</td></tr>
<tr><td>Needs training/tuning</td><td>Yes</td><td>No</td></tr>
</tbody></table>
<p><strong>The canonical enterprise failure:</strong> a user searches for an exact error code, a policy number, a SKU, or a person's surname. The embedding model has never meaningfully seen that token, so dense retrieval returns topically-similar-but-wrong passages with high confidence. BM25 nails it instantly. In a technical or industrial corpus this is a large fraction of real queries.</p>
<p><strong>Fusion:</strong> either score-based (normalize and take a weighted sum — requires careful normalization because BM25 scores are unbounded and cosine is in [−1,1]) or <strong>rank-based (RRF)</strong>, which avoids the normalization problem entirely. See the RRF card.</p>
<p><strong>SPLADE</strong> is worth naming: a learned sparse representation that expands a query into weighted vocabulary terms, giving BM25's exactness with some semantic expansion — and it lives in the same inverted-index infrastructure.</p>
<div class="say"><b>Say this:</b> "Hybrid, always, in an enterprise corpus. Dense retrieval handles paraphrase, and BM25 handles the things embeddings are blind to — error codes, part numbers, policy IDs, surnames. I fuse with reciprocal rank fusion rather than weighted scores, because BM25 and cosine scores aren't on comparable scales and rank-based fusion sidesteps the normalization problem. Then a cross-encoder reranks the fused top 50."</div>`},

{q:"Explain Reciprocal Rank Fusion, including the code",
roles:["aie"],lvl:"senior",tags:["rag","retrieval","code","high-freq"],
a:`<p>RRF merges multiple ranked lists into one <strong>using only the ranks</strong>, never the raw scores. That's the whole appeal: you can fuse BM25, dense search, a graph retriever and a metadata filter without ever making their scores commensurable.</p>
<pre><code>RRF_score(d) = Σ_systems  1 / (K + rank_s(d))       K = 60 by default</code></pre>
<pre><code>from collections import defaultdict

def reciprocal_rank_fusion(*list_of_list_ranks_system, K=60):
    rrf_map = defaultdict(float)
    for rank_list in list_of_list_ranks_system:
        for rank, item in enumerate(rank_list, 1):   # ranks start at 1
            rrf_map[item] += 1 / (rank + K)
    sorted_items = sorted(rrf_map.items(), key=lambda x: x[1], reverse=True)
    return sorted_items, [item for item, score in sorted_items]

ir_system_a = ['Document1', 'Document3', 'Document5', 'Document7']
ir_system_b = ['Document2', 'Document1', 'Document4']
ir_system_c = ['Document5', 'Document3', 'Document2']</code></pre>
<p><strong>Trace Document1:</strong> rank 1 in A → 1/61 = 0.01639; rank 2 in B → 1/62 = 0.01613; absent from C → 0. Total ≈ <strong>0.0325</strong>.</p>
<p><strong>Trace Document3:</strong> rank 2 in A → 1/62 = 0.01613; rank 2 in C → 1/62 = 0.01613. Total ≈ <strong>0.0323</strong>.</p>
<p><strong>Trace Document5:</strong> rank 3 in A → 1/63 = 0.01587; rank 1 in C → 1/61 = 0.01639. Total ≈ <strong>0.0323</strong>.</p>
<p><strong>Now the consensus effect.</strong> Document3 sits at rank 2 in two systems and scores ≈0.0323. A document retrieved at <em>rank 1</em> by a single system and by nothing else scores only 1/61 ≈ <strong>0.0164</strong> — half as much. Document7, at rank 4 in one system alone, scores 1/64 ≈ 0.0156. So two mediocre agreements beat one confident outlier: <strong>RRF rewards consensus</strong>, which is exactly what you want when each retriever is individually noisy.</p>
<p><strong>What K does — the question they ask next.</strong> K dampens the influence of top ranks. With K=0, rank 1 scores 1.0 and rank 2 scores 0.5, so the #1 result from any single system dominates. With K=60, ranks 1 and 2 score 0.0164 and 0.0161 — nearly equal — so the ranking is driven by <em>how many</em> systems retrieved a document rather than how highly one system ranked it. Large K = trust consensus; small K = trust individual top hits. K=60 comes from the original Cormack et al. paper and is a reasonable default, but it is tunable on your own eval set.</p>
<p><strong>Why teams use it:</strong> no training, no score normalization, no per-system calibration, robust to one retriever failing, and trivially extensible to a fourth or fifth retriever. <strong>Weighted RRF</strong> — adding a per-system weight w_s to the numerator — is the natural extension when you know one retriever is stronger.</p>
<div class="trap"><b>Honest limitation to volunteer:</b> RRF discards score magnitude, so it cannot distinguish "rank 1 with a 0.95 match" from "rank 1 with a 0.31 match." If every retriever returns only weak matches, RRF will still confidently rank them. That's why I keep an absolute relevance threshold after fusion, and why a reranker on top matters — it restores a calibrated relevance score.</div>`},

{q:"Rerankers: what, why, and what they cost",
roles:["aie"],lvl:"senior",tags:["rag","retrieval"],
a:`<p>First-stage retrieval optimizes for <strong>recall</strong> at low cost — get the right document somewhere in the top 100. A reranker optimizes for <strong>precision</strong> at the top — get it into the top 3, where the LLM will actually use it.</p>
<p><strong>Why a cross-encoder is better:</strong> a bi-encoder must compress a document into a single vector with <em>no knowledge of the query</em>. A cross-encoder sees query and document jointly in one forward pass, so every query token can attend to every document token. That token-level interaction is what catches "this passage mentions the right entity but answers a different question."</p>
<table><thead><tr><th>Type</th><th>Latency (top-50)</th><th>Quality</th><th>Notes</th></tr></thead><tbody>
<tr><td>Cross-encoder (bge-reranker, Cohere Rerank, Jina)</td><td>~50–300ms</td><td>High</td><td>Production default. Batch the pairs.</td></tr>
<tr><td>ColBERT late interaction</td><td>Low</td><td>High</td><td>Pre-indexable; large storage cost</td></tr>
<tr><td>LLM-as-reranker (listwise/pairwise)</td><td>Seconds</td><td>Highest</td><td>Too slow for interactive use; great for offline eval and golden-set generation</td></tr>
<tr><td>MonoT5 / RankT5</td><td>Moderate</td><td>High</td><td>Seq2seq relevance scoring</td></tr>
</tbody></table>
<p><strong>Typical gain:</strong> retrieving top-50 and reranking to top-5 commonly moves NDCG@5 and answer accuracy by 10–25 points over taking the raw top-5 — usually the single highest-ROI addition to a mediocre RAG system, ahead of any chunking experiment.</p>
<p><strong>Also reranks for:</strong> diversity (MMR — Maximal Marginal Relevance, trading relevance against novelty so you don't fill the context with five near-identical chunks), recency (boost newer documents), and authority (prefer the approved SOP over a draft).</p>
<div class="say"><b>Say this:</b> "Two-stage retrieval: cast a wide net cheaply, then spend compute precisely. I retrieve 50 with hybrid search and rerank to 5 with a cross-encoder, because the bi-encoder has to embed a document without ever seeing the query while the cross-encoder gets full token-level interaction. On our eval set that was worth more than any chunking change I tried, and it also let me cut the context I sent to the model, which paid for the reranker latency in generation time."</div>`},

{q:"Query transformation: rewriting, HyDE, decomposition, step-back",
roles:["aie","agentic"],lvl:"senior",tags:["rag","retrieval"],
a:`<p>The user's raw query is often a bad search query. Fixing it upstream is cheap.</p>
<ul>
<li><strong>Query rewriting / normalization</strong> — expand abbreviations, fix typos, add domain terms. Essential in chat: <em>"what about for the second one?"</em> is meaningless standalone. <strong>Conversational query rewriting</strong> — resolving pronouns and ellipsis against the dialogue history into a self-contained query — is the highest-value transformation in any multi-turn RAG product, and the one most often missing.</li>
<li><strong>Multi-query / query expansion</strong> — generate 3–5 paraphrases, retrieve for each, fuse with RRF. Covers vocabulary mismatch between the user's words and the document's.</li>
<li><strong>HyDE (Hypothetical Document Embeddings)</strong> — have the LLM write a <em>hypothetical answer</em>, then embed <em>that</em> and search with it. Rationale: an answer is distributionally closer to the target passage than a question is, so it lands in a better region of embedding space. Works well zero-shot; risks drifting if the hallucinated answer is off-topic.</li>
<li><strong>Query decomposition</strong> — split a multi-hop question into sub-questions, retrieve for each, then synthesize. <em>"How does our parental leave policy compare to the statutory minimum in Karnataka?"</em> is two retrievals, not one.</li>
<li><strong>Step-back prompting</strong> — ask a more general question first to retrieve principles, then the specific one. Good for "why" questions where the specific phrasing retrieves nothing.</li>
<li><strong>Routing</strong> — classify the query and send it to the right index, tool, or SQL database. Not every question is a vector search; "how many open tickets do we have" is a query against a table.</li>
</ul>
<div class="trap"><b>Cost discipline:</b> every transformation adds an LLM call and latency before retrieval even starts. Naive multi-query plus HyDE plus decomposition can add 2–3 seconds to TTFT. Gate them: route cheaply, apply the expensive transformations only to queries a classifier marks as complex, cache rewrites, and use a small fast model for rewriting rather than your generation model.</div>`},

{q:"What is a recursive retriever? And how does it differ from parent-child?",
roles:["aie","agentic"],lvl:"senior",tags:["rag","retrieval"],
a:`<p>A <strong>recursive retriever</strong> performs retrieval in multiple dependent steps rather than one shot. Each step's query is informed by what the previous step returned, continuing until a stopping condition (depth limit, no new relevant documents, or the LLM judging it has enough).</p>
<pre><code>Flat retrieval:        query → search → top-k → done

Recursive retrieval:   query → search → top-k
                         ↓ identify gaps / referenced concepts
                       new query → search → more chunks
                         ↓ repeat until stopping condition
                       merge all → LLM</code></pre>
<p><strong>Example.</strong> "Explain the role of mitochondria in energy production and how it compares to chloroplasts."</p>
<ol>
<li>Retrieve on mitochondria.</li>
<li>Those chunks reference ATP synthesis and cellular respiration — retrieve on those.</li>
<li>Do the same branch for chloroplasts and photosynthesis.</li>
<li>Merge everything and answer.</li>
</ol>
<p><strong>Why:</strong> multi-hop questions where the answer isn't in any single chunk; cases where the first retrieval surfaces the <em>vocabulary</em> you needed to search properly; and hierarchical corpora where a summary node points you to the detailed nodes.</p>
<p><strong>Two distinct things go by similar names</strong> — be precise here, because it's a common confusion:</p>
<table><thead><tr><th></th><th>Recursive retriever</th><th>Parent-child (small-to-big)</th></tr></thead><tbody>
<tr><td>Number of search rounds</td><td><strong>Multiple</strong>, each informed by the last</td><td><strong>One</strong></td></tr>
<tr><td>Mechanism</td><td>Iterative query generation / node traversal</td><td>Embed small chunks, return their larger parents</td></tr>
<tr><td>Solves</td><td>Multi-hop reasoning, knowledge gaps</td><td>Precision/context tradeoff</td></tr>
<tr><td>Latency</td><td>High — sequential LLM + search rounds</td><td>Essentially free — a lookup</td></tr>
<tr><td>Failure mode</td><td>Drift, loops, runaway cost</td><td>Parent too large, wastes context</td></tr>
</tbody></table>
<p>LlamaIndex's <code>RecursiveRetriever</code> covers both senses: it traverses node <em>references</em>, so a retrieved summary node can point to child nodes or even to a query engine (e.g. a SQL tool) that gets invoked recursively.</p>
<p><strong>Where it's actually used:</strong> multi-hop QA, legal and regulatory research (a clause referencing another clause), scientific literature, and code assistants following imports and call graphs.</p>
<div class="trap"><b>Production caveats to name:</b> hard-cap depth and total retrievals, deduplicate across rounds (you will retrieve the same chunk repeatedly), budget the context so round three doesn't overflow it, and set a latency SLO — this pattern is the easiest way to turn a 1-second RAG call into a 15-second one. In practice I'd gate recursion behind a complexity classifier and answer simple queries in one hop.</div>`},

{q:"GraphRAG and agentic RAG — when do you need them?",
roles:["aie","agentic"],lvl:"senior",tags:["rag","senior-signal"],
a:`<p><strong>GraphRAG</strong> — build a knowledge graph of entities and relationships from the corpus at ingestion time, cluster it into communities, and generate summaries per community. At query time traverse the graph rather than (or alongside) doing similarity search.</p>
<ul>
<li><strong>Solves:</strong> global questions vector search structurally cannot answer. "What are the main themes across these 10,000 incident reports?" has no single similar chunk — the answer is an aggregation. Also multi-hop relational queries: "which of our suppliers are exposed to the same sub-tier vendor?"</li>
<li><strong>Costs:</strong> expensive ingestion (LLM entity and relation extraction over the whole corpus), a graph store to maintain, brittle extraction quality, and painful incremental updates. Typically 10–100× the ingestion cost of plain RAG.</li>
<li><strong>Verdict:</strong> justified for corpora where relationships <em>are</em> the value — supply chains, org knowledge, regulatory cross-references, fraud rings, drug interactions. Overkill for "answer questions about our SOPs." <strong>Saying this clearly is the point of the question</strong> — they're checking whether you chase architecture fashion.</li>
</ul>
<p><strong>Agentic RAG</strong> — hand retrieval to an agent that decides <em>whether</em>, <em>where</em> and <em>how many times</em> to search, and can critique and retry.</p>
<pre><code>Query → agent reasons
          ├─ route: vector index | SQL | web | API | no retrieval needed
          ├─ retrieve, then grade relevance of what came back
          ├─ if insufficient → rewrite query and retry (bounded)
          └─ synthesize with citations, self-check grounding</code></pre>
<ul>
<li><strong>Solves:</strong> heterogeneous sources, queries that need no retrieval at all, self-correction when retrieval returns junk, and multi-step research tasks. <strong>Self-RAG</strong> and <strong>CRAG</strong> (Corrective RAG) are named patterns here — grade the retrieved context, and fall back to web search or a query rewrite when it's inadequate.</li>
<li><strong>Costs:</strong> non-deterministic latency, multiplied token cost, harder to debug, and it can loop.</li>
<li><strong>Verdict:</strong> the right architecture when retrieval quality is genuinely variable or sources are diverse. Keep the simple path for the 80% of queries that are one-hop — route, don't agentify everything.</li>
</ul>`}
]},

{
title:"Generation, evaluation & failure modes",
items:[
{q:"How do you assemble the context window, and what is 'lost in the middle'?",
roles:["aie"],lvl:"senior",tags:["rag","senior-signal"],
a:`<p>Retrieval gives you candidates; context assembly decides what the model actually sees, and it's where a lot of quality is silently lost.</p>
<ol>
<li><strong>Deduplicate</strong> near-identical chunks — overlapping chunks and multiple document versions produce redundant passages that consume budget for no information.</li>
<li><strong>Order deliberately.</strong> <strong>Lost in the middle</strong> (Liu et al., 2023): models attend most strongly to the beginning and end of a long context, and accuracy on facts placed in the middle degrades measurably. So place the highest-ranked passages <em>first and last</em>, not in rank order top-to-bottom. This is a cheap, real win.</li>
<li><strong>Budget explicitly.</strong> Reserve tokens for system prompt, history, retrieved context and the output. Truncate the lowest-ranked chunks, never the instructions. Count with the actual tokenizer.</li>
<li><strong>Label each chunk</strong> with source, section and date, so the model can cite and so it can prefer the newer document when two conflict.</li>
<li><strong>Compress if needed</strong> — extractive sentence selection against the query, LLMLingua-style prompt compression, or a per-chunk summarization pass. Cheaper than a bigger model, at some information cost.</li>
<li><strong>Instruct for grounding</strong> — "answer only from the context; cite the source id after each claim; if the context is insufficient, say so." Explicitly licensing "I don't know" is what makes abstention possible.</li>
</ol>
<div class="trap"><b>The "just use a long-context model" counterargument — be ready for it.</b> Stuffing 200k tokens into every call is expensive, slow (prefill scales with prompt length), degrades on middle content, and still can't do access control or provenance. Long context raises the ceiling on how much retrieved material you can pass; it doesn't remove the need to retrieve the <em>right</em> material. Retrieval quality is still the dominant factor.</div>`},

{q:"How do you evaluate a RAG system?",
roles:["aie"],lvl:"senior",tags:["rag","eval","high-freq","senior-signal"],
a:`<p><strong>Evaluate the components separately, then end-to-end.</strong> An overall "accuracy" number tells you nothing actionable — you need to know whether retrieval or generation failed.</p>
<p><strong>Retrieval metrics</strong> (need a golden set of query → relevant-chunk labels):</p>
<ul>
<li><strong>Context recall</strong> — did we retrieve everything needed to answer? <em>The single most important RAG metric.</em> If the answer isn't in the context, no amount of prompt work saves you.</li>
<li><strong>Context precision</strong> — are the retrieved chunks relevant, and are the relevant ones ranked highly?</li>
<li><strong>Hit rate @k, MRR, NDCG@k</strong> — standard IR metrics for ranking quality.</li>
</ul>
<p><strong>Generation metrics:</strong></p>
<ul>
<li><strong>Faithfulness / groundedness</strong> — is every claim in the answer supported by the retrieved context? Catches hallucination. Measured by decomposing the answer into claims and checking entailment against the context (an NLI model or an LLM judge).</li>
<li><strong>Answer relevance</strong> — does it actually address the question asked?</li>
<li><strong>Answer correctness</strong> — against a reference answer, when you have one.</li>
<li><strong>Citation accuracy</strong> — do the cited sources genuinely support the cited claims? Frequently broken and rarely measured.</li>
<li><strong>Refusal / abstention quality</strong> — does it say "I don't know" when the context is insufficient, rather than guessing? This one matters enormously in enterprise and almost nobody measures it.</li>
</ul>
<p><strong>The diagnostic table — this is what makes the answer useful:</strong></p>
<table><thead><tr><th>Recall</th><th>Faithfulness</th><th>Diagnosis</th></tr></thead><tbody>
<tr><td>Low</td><td>—</td><td><strong>Retrieval problem.</strong> Fix chunking, embeddings, hybrid search, reranking. Don't touch the prompt.</td></tr>
<tr><td>High</td><td>Low</td><td><strong>Generation problem.</strong> The context was there and the model ignored it — fix the prompt, the context ordering, or the model.</td></tr>
<tr><td>High</td><td>High, answer still wrong</td><td>The corpus is wrong, outdated, or internally contradictory. A data problem, not an ML problem.</td></tr>
</tbody></table>
<p><strong>Building the golden set</strong> — the practical question: bootstrap with an LLM generating question-answer pairs from sampled chunks, then <strong>have a human review every one</strong>. 100–300 reviewed pairs beats 5,000 synthetic ones. Sample to cover query types (factual lookup, multi-hop, aggregation, out-of-scope, ambiguous), not just easy lookups. Mine real production queries — especially the ones users thumbs-downed — and fold them in continuously.</p>
<p><strong>Tooling:</strong> RAGAS, TruLens, DeepEval, Arize Phoenix, LangSmith / Langfuse datasets. Wire the eval suite into CI so a prompt or chunking change can't merge without a regression run.</p>
<div class="trap"><b>LLM-as-judge caveats you should raise:</b> judges have position bias (they favour the first option), verbosity bias (they favour longer answers), self-preference bias (a model rates its own outputs higher), and they drift when the provider updates the model. Mitigate with randomized ordering, a pinned judge version, few-shot rubric examples, and periodic human agreement checks — report the human-judge agreement rate so your metric has known validity.</div>`},

{q:"How do you reduce hallucination in a RAG system?",
roles:["aie","agentic"],lvl:"senior",tags:["rag","high-freq"],
a:`<p>Attack it at every layer — a single mitigation is never enough.</p>
<p><strong>Retrieval layer (most hallucination is actually retrieval failure):</strong></p>
<ul>
<li>Improve recall: hybrid search, reranking, better chunking. If the answer isn't in the context, the model either guesses or refuses.</li>
<li><strong>Relevance thresholding</strong> — if the top reranker score is below a floor, don't generate an answer at all. Return "I couldn't find this" or escalate to a human.</li>
<li>Keep the corpus clean: remove outdated documents, resolve contradictory versions, prefer the approved revision.</li>
</ul>
<p><strong>Prompt layer:</strong></p>
<ul>
<li>Explicit grounding instruction, and explicitly permit abstention: <em>"If the context does not contain the answer, say you don't know."</em> Models refuse far more readily when it's licensed.</li>
<li>Require inline citations per claim — the act of citing suppresses unsupported statements.</li>
<li>Temperature 0 for factual answers.</li>
<li>Structured output so the answer has a "supported_by" field per claim.</li>
</ul>
<p><strong>Verification layer:</strong></p>
<ul>
<li><strong>Post-hoc groundedness check</strong> — decompose the answer into claims, verify each against the retrieved context with an NLI model or a cheap LLM. Block, flag or regenerate on failure. This is the strongest single control.</li>
<li><strong>Citation validation</strong> — programmatically confirm each cited chunk id exists and that its text supports the claim.</li>
<li><strong>Self-consistency</strong> — sample n answers; disagreement across samples is a good hallucination signal.</li>
<li><strong>Constrained decoding</strong> when the output must conform to a schema or a closed vocabulary.</li>
</ul>
<p><strong>Product layer — the part engineers forget:</strong></p>
<ul>
<li>Show the sources inline and make them clickable, so the user can verify. This converts an unverifiable assertion into a verifiable one and changes the risk profile of the whole product.</li>
<li>Confidence signals, and a visible "not found" state rather than a fabricated answer.</li>
<li>Feedback capture on every answer, routed into the eval set.</li>
<li>Human-in-the-loop for high-stakes actions.</li>
</ul>
<div class="say"><b>Say this:</b> "Most of what gets called hallucination in RAG is retrieval failure — the model was asked a question it had no context for and filled the gap. So my first move is measuring context recall, not prompt tuning. Then I add a relevance threshold so we abstain rather than guess, require per-claim citations, and run a groundedness check on the output before it reaches the user. And I surface the sources in the UI, because a citable answer is a fundamentally different product risk than an unverifiable one."</div>`},

{q:"Semantic caching and cost/latency optimization for RAG",
roles:["aie","agentic"],lvl:"senior",tags:["rag","cost"],
a:`<p><strong>Caching layers, cheapest first:</strong></p>
<ol>
<li><strong>Exact-match cache</strong> — hash the normalized query (+ user scope + model version) → response. Trivial, zero risk, and in real traffic surprisingly effective; support and FAQ queries are heavily repeated.</li>
<li><strong>Semantic cache</strong> — embed the query, and if cosine similarity to a cached query exceeds a threshold (~0.95+), return the cached answer. <strong>Set the threshold high and validate it,</strong> because the failure mode is serving the answer to a <em>different</em> question. "How do I reset my password?" and "How do I change my password?" are ~0.95 similar and want different answers. Always include tenant/user scope in the cache key, or you leak one user's answer to another — a security bug, not a performance bug.</li>
<li><strong>Prompt / prefix cache</strong> — provider-side caching of the static system prompt and few-shot block. Large win with essentially no correctness risk, and it makes long instruction blocks affordable.</li>
<li><strong>Embedding cache</strong> — never re-embed unchanged text.</li>
<li><strong>Retrieval cache</strong> — cache the retrieved chunk ids per query, so a repeated query skips the ANN search and reranking but still regenerates.</li>
</ol>
<p><strong>Latency levers:</strong> stream the response (transforms perceived latency more than any backend optimization); run retrieval and reranking in parallel where possible; shrink the reranked set (top-5 not top-20 — less context is both faster and often more accurate); use a small fast model for query rewriting and routing; keep the ANN <code>ef_search</code> tuned rather than maxed; and colocate the vector store with the application to remove a network hop.</p>
<p><strong>Cost levers:</strong> model routing (classify difficulty, send the easy 70% to a small model); batch offline workloads; quantize the embedding model and self-host it — embeddings are high-volume and cheap to run locally; truncate embedding dimensions (Matryoshka) to cut storage; prune the corpus of documents nobody ever retrieves.</p>
<div class="say"><b>Say this:</b> "I'd instrument before optimizing — break the p95 down into retrieval, reranking, prefill and decode, because teams routinely optimize retrieval when 80% of the latency is generation. Then: stream the output, cache the static prompt prefix, and add an exact-match cache before a semantic one. I'm cautious with semantic caching specifically because a too-low threshold serves the right-looking answer to the wrong question, and the cache key has to include the user's access scope or it becomes a data-leak path."</div>`},

{q:"RAG failure taxonomy — how would you debug a RAG system that's giving bad answers?",
roles:["aie","agentic"],lvl:"senior",tags:["rag","debugging","senior-signal"],
a:`<p>Work the pipeline in order and isolate the stage. Never start by rewriting the prompt.</p>
<table><thead><tr><th>Stage</th><th>Failure</th><th>Symptom</th><th>Diagnostic</th></tr></thead><tbody>
<tr><td>Ingestion</td><td>Document never indexed, or OCR produced nothing</td><td>"That document doesn't exist" for a document that does</td><td>Query the index directly by document id; check parse-quality scores and ingestion error logs</td></tr>
<tr><td>Chunking</td><td>Answer split across two chunks, or table flattened</td><td>Partial or garbled answers on tabular/structured content</td><td>Read the actual chunk text for a failing query — do this first, it's fastest</td></tr>
<tr><td>Embedding</td><td>Query and document embedded with different models or normalization</td><td>Uniformly terrible retrieval</td><td>Compare embedding model versions in the index metadata vs the query path</td></tr>
<tr><td>Retrieval</td><td>Low recall; or exact identifiers missed</td><td>Right topic, wrong passage</td><td>Measure context recall on the golden set; test the same query with BM25 only</td></tr>
<tr><td>Filtering</td><td>Metadata filter too restrictive; ACL mismatch</td><td>Zero results, or results for admin but not for a user</td><td>Run the query with filters disabled; check the resolved filter expression in the trace</td></tr>
<tr><td>Reranking</td><td>Reranker demotes the correct chunk</td><td>Correct chunk in top-50 but not top-5</td><td>Log pre- and post-rerank ranks for the golden chunk</td></tr>
<tr><td>Context assembly</td><td>Correct chunk truncated, or buried mid-context</td><td>Answer ignores information that was retrieved</td><td>Log the exact final prompt; check where the golden chunk landed</td></tr>
<tr><td>Generation</td><td>Model ignores context, or over-refuses</td><td>Low faithfulness with high recall</td><td>Manually paste the exact context into the model and see if it can answer</td></tr>
<tr><td>Corpus</td><td>Two documents contradict; the source of truth is stale</td><td>Confidently wrong, well-cited answers</td><td>Read the cited source. Often the model is right and the document is wrong.</td></tr>
</tbody></table>
<p><strong>The one non-negotiable prerequisite:</strong> full tracing. Every request should log the raw query, the rewritten query, the retrieval candidates with scores, the post-rerank set, the assembled prompt, the raw completion, latency per stage, and token counts. Without that trace you're guessing, and interviewers will notice whether you reach for observability or for intuition.</p>
<div class="say"><b>The framework to state:</b> "I bisect. Is the right chunk in the index? Is it in the retrieved top-k? Did it survive reranking and land in the final prompt? Did the model use it? Each of those is a yes/no question with a log line behind it, and whichever one flips to 'no' is the bug. The instinct to go straight to prompt engineering is what makes RAG systems take months — most of the time it's a retrieval or ingestion problem."</div>`}
]}
]});
