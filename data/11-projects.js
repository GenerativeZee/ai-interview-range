PREP.push({
id:"projects", n:"11", title:"Project Deep Dives", icon:"◆",
blurb:"Most senior interviews are decided here, not on fundamentals. This section is a framework for narrating your own work and defending every decision in it — plus a place to keep your own private script.",
topics:[
{
title:"How to narrate a project",
items:[
{q:"The structure for describing any project",
roles:["aie","agentic","ds"],lvl:"senior",tags:["projects","high-freq","senior-signal"],
a:`<p>Interviewers are not testing whether you built something. They're testing whether <em>you</em> made the decisions and understood the alternatives. Use this seven-part structure and keep the opening to 90 seconds — then let them drive.</p>
<ol>
<li><strong>Problem &amp; stakes (15s).</strong> Who was blocked, on what, and what it cost. Lead with the human cost, not the technology.</li>
<li><strong>Your scope (10s).</strong> Be precise and honest about what was yours. <em>"I owned the retrieval pipeline and evaluation end to end; a colleague built the frontend."</em></li>
<li><strong>Architecture (30s).</strong> The data flow in one breath, no more. Let them ask for depth.</li>
<li><strong>Two or three hard decisions with alternatives (30s).</strong> This is the part that scores. Plant a hook: <em>"the hardest was X — I'll come back to that."</em></li>
<li><strong>Measurement.</strong> Baseline → intervention → result, with a number and how you measured it.</li>
<li><strong>Outcome.</strong> Business impact, adoption, what shipped.</li>
<li><strong>What you'd do differently.</strong> Volunteer this. It signals reflection rather than defensiveness, and it lets you choose which weakness gets discussed.</li>
</ol>
<div class="trap"><b>Answer patterns that lose the round:</b> "we used LangChain and it worked" — no decision content · "the accuracy improved a lot" — no number, no baseline · "I used GPT-4 because it's the best" — no evaluation · describing the tool list instead of the problem · saying "we" for everything so the interviewer can't tell what you did · and having no answer to "what would you change," which reads as never having reflected on it.</div>
<div class="say"><b>Prepare exactly three projects</b> at this depth: one AI/LLM system, one with a classical ML or analytics component, and one where something went wrong and you fixed it. The third is the one most candidates skip and the one senior interviewers weight most heavily.</div>`},

{q:"Build your own project script — the template",
roles:["aie","agentic","ds"],lvl:"senior",tags:["projects","template","high-freq"],
a:`<p>Fill this in for your own work, out loud, and record yourself once. The gaps you discover while doing it are exactly the gaps an interviewer will find.</p>
<h4>The 90-second opener</h4>
<pre><code>[WHO] needed [WHAT] from [WHAT DATA].
They were [COST: time wasted / errors / blocked decisions].

I built [SYSTEM, in one clause].

The pipeline: [SOURCE] → [PROCESSING] → [STORAGE] →
              [RETRIEVAL/INFERENCE] → [OUTPUT].

I owned [YOUR EXACT SCOPE]. The hardest problem wasn't
[THE OBVIOUS ONE] — it was [THE REAL ONE], because
[WHY IT WAS HARD].</code></pre>
<h4>The numbers to have memorised</h4>
<p>Not to recite — to have available when a follow-up demands one. Every blank you can't fill is a question you can't answer.</p>
<table><thead><tr><th>Figure</th><th>The question it answers</th></tr></thead><tbody>
<tr><td>Scale of the data (documents, rows, users, requests/day)</td><td>"What scale was this?" — decides whether your architecture choices were proportionate</td></tr>
<tr><td>Your key design parameter and its value <em>(chunk size, model choice, feature count, threshold)</em></td><td>"Why that value?" — and the real question behind it: did you measure or guess?</td></tr>
<tr><td>Eval set size and how you built it</td><td>"How do you know it works?" — the strongest senior signal available</td></tr>
<tr><td>Headline metric: baseline → final</td><td>"What did you improve?" A number without a baseline is not a result</td></tr>
<tr><td>p95 latency, and which stage dominated it</td><td>"Where did the time go?" — separates people who profiled from people who assumed</td></tr>
<tr><td>Cost per request or per run</td><td>Senior-level. Most candidates have never looked</td></tr>
<tr><td>Team size and your specific scope</td><td>"What did <em>you</em> do?" They cannot credit you for what "we" did</td></tr>
<tr><td>One thing that broke in production</td><td>"What went wrong?" — no war story reads as no production experience</td></tr>
</tbody></table>
<div class="say"><b>Where to keep your filled-in version:</b> copy <code>data/local-my-project.example.js</code> to <code>data/local-my-project.js</code> and write your script there. That filename is in <code>.gitignore</code>, so it stays on your machine and never gets committed — your real figures shouldn't live in a public repo. It appears in the app as its own section once the file exists.</div>`},

{q:"The questions you will be asked about a RAG or retrieval system",
roles:["aie"],lvl:"senior",tags:["projects","rag","high-freq"],
a:`<p>If your project involved retrieval, expect most of these. The right-hand column is what a strong answer contains — not the answer itself, which has to come from your own system.</p>
<table><thead><tr><th>Question</th><th>What a strong answer contains</th></tr></thead><tbody>
<tr><td>"Why RAG and not fine-tuning?"</td><td>Freshness, citability, and <strong>per-user permissions</strong> — lead with permissions if your system had them, it's the argument fine-tuning cannot answer</td></tr>
<tr><td>"What chunk size, and why?"</td><td>A starting value tied to your document structure, then <em>measured</em> against an eval set. "It's the default" loses; "I tested three and here's what moved" wins</td></tr>
<tr><td>"Which embedding model, and why that one?"</td><td>Named candidates, evaluation on <em>your own</em> data rather than a public leaderboard alone, and the axes you weighed: quality, dimensions and storage cost, sequence length, self-host vs API, latency, multilingual need</td></tr>
<tr><td>"Why that vector store?"</td><td>Scale, filtered-search support, operational burden, what you already ran. Admit the simpler option: "under a few million chunks I'd have used pgvector and operated one less system"</td></tr>
<tr><td>"Why hybrid search?"</td><td><strong>A concrete failure it fixed.</strong> Usually: queries containing codes, IDs or part numbers returned topically-similar-but-wrong documents, because the embedding model had never meaningfully seen those tokens</td></tr>
<tr><td>"How did you measure quality?"</td><td>Golden-set construction, the metrics (context recall, context precision, faithfulness, citation accuracy, refusal quality), and the diagnostic logic: low recall means fix retrieval; high recall with low faithfulness means fix generation</td></tr>
<tr><td>"How did you reduce hallucination?"</td><td>The layered answer: improve recall first, relevance threshold to abstain, grounding instruction that licenses "I don't know", per-claim citations, post-hoc groundedness check, sources visible in the UI</td></tr>
<tr><td>"What was your p95 latency and where did it go?"</td><td>A real breakdown across retrieval, reranking, prefill and decode — and which one you actually optimised. Streaming as the perceived-latency fix</td></tr>
<tr><td>"How did you control cost?"</td><td>Prompt prefix caching, response cache scoped by user permissions, self-hosted embeddings, a small model for query rewriting, less reranked context</td></tr>
<tr><td>"What broke in production?"</td><td>A real story. Common and credible: scanned documents silently producing empty text, a stale index after a failing sync job, a permissions edge case, or a prompt change that regressed answers with no eval gate to catch it</td></tr>
<tr><td>"What would you do differently?"</td><td>Eval suite before the first prompt · parent-child chunking from day one · access control designed before indexing rather than retrofitted · tracing from day one</td></tr>
</tbody></table>
<div class="trap"><b>The accuracy-claim trap.</b> If you say "improved accuracy by 30%," the immediate follow-up is "from what to what, measured how, on what dataset, with how many examples?" Have the full chain ready — baseline, eval set size and construction, metric definition, and which intervention contributed what. A vague percentage is worse than no number, because it invites a question you can't answer.</div>`},

{q:"The questions you will be asked about an agentic system",
roles:["agentic"],lvl:"senior",tags:["projects","agents"],
a:`<div class="say"><b>Opener shape:</b> "The task needed multiple data sources and a variable number of steps — the path genuinely couldn't be known in advance, which is why it was an agent rather than a pipeline. I built it as [ARCHITECTURE], with [STATE HANDLING], a bounded tool loop, and [HUMAN OVERSIGHT]."</div>
<p><strong>The questions, and what each one is really checking:</strong></p>
<ul>
<li><strong>"Why an agent and not a workflow?"</strong> — whether you reach for agency by default. Name the specific reason the path was unknowable, and say what you'd have built instead if it weren't.</li>
<li><strong>"How do you stop it looping?"</strong> — step cap, token and cost cap, wall-clock timeout, and a no-progress detector on hashed (tool, arguments). All in code, never in the prompt.</li>
<li><strong>"How do you know it works?"</strong> — end-state assertions wherever the outcome is programmatically checkable, trajectory metrics for diagnosis, run each task n times and report the distribution, eval suite as a CI deploy gate.</li>
<li><strong>"What's your tool design philosophy?"</strong> — intent-level not implementation-level, strict schemas with enums, structured actionable errors, capped response sizes, idempotent writes, fewer tools rather than more.</li>
<li><strong>"How do you handle a tool failing?"</strong> — a structured error the model can recover from, bounded retries with backoff, a defined fallback. Then: "I test this by injecting tool failures in the eval suite, because in production tools time out and an agent that's never seen a failure won't handle one."</li>
<li><strong>"Multi-agent or single?"</strong> — whichever you built, justify by context isolation or parallelism, and name the cost: reliability composes multiplicatively.</li>
<li><strong>"What about prompt injection?"</strong> — the architectural answer: assume it will sometimes succeed and bound the blast radius with scoped tool credentials, server-side permission enforcement, egress allowlists, sandboxing, and approval gates on irreversible actions.</li>
<li><strong>"What did it cost per task, and how did you reduce it?"</strong> — have a number. Model routing, prompt caching, smaller context, fewer steps.</li>
<li><strong>"What was the hardest bug?"</strong> — the strongest answers here are context degradation over a long run, or a cascading error where one bad intermediate result quietly poisoned everything downstream.</li>
</ul>`},

{q:"Quantifying impact when you don't have clean numbers",
roles:["aie","agentic","ds"],lvl:"senior",tags:["projects","senior-signal"],
a:`<p>Many real projects don't have a tidy A/B result. Interviewers know this. What they won't accept is <em>no</em> attempt at measurement.</p>
<p><strong>Legitimate ways to quantify:</strong></p>
<ul>
<li><strong>Time saved × users × frequency.</strong> State it as an estimate with the assumptions visible, not as a fact.</li>
<li><strong>Offline eval improvement.</strong> "Context recall went from A to B on an N-pair human-reviewed set" is a strong, honest, verifiable number — and usually the easiest one to produce.</li>
<li><strong>Adoption and retention.</strong> Weekly active users, queries per user, return rate. Adoption is a real signal of usefulness.</li>
<li><strong>Deflection.</strong> Support tickets or expert escalations avoided.</li>
<li><strong>Latency and cost.</strong> p95 down from X to Y; cost per request down N%. Always measurable, always credible.</li>
<li><strong>Qualitative with specifics.</strong> A named user saying a specific thing beats a vague percentage.</li>
</ul>
<div class="say"><b>How to handle the gap honestly — this answer scores well:</b> "We didn't have a controlled experiment, and I want to be straight about that. What I can measure precisely is the offline retrieval improvement and the adoption curve. For business impact I have an estimate built from time-per-query and usage volume, and I'd flag that it's an estimate with those assumptions. If I were starting again I'd instrument the baseline before building anything, because the absence of a pre-period measurement is the main thing limiting what I can claim."</div>
<div class="trap"><b>Never inflate.</b> A senior interviewer will probe a suspicious number, and a collapsing claim damages your credibility far more than a modest honest one. "I improved recall from A to B and I can show you how I measured it" beats an unverifiable "30% better."</div>`},

{q:"Defending the decision you'd now make differently",
roles:["aie","agentic","ds"],lvl:"senior",tags:["projects","senior-signal"],
a:`<p>Every project has decisions you'd revisit. The skill is discussing them without either defensiveness or self-flagellation.</p>
<p><strong>The three-part move:</strong></p>
<ol>
<li><strong>Own it plainly.</strong> "That was the wrong call."</li>
<li><strong>Explain the reasoning at the time.</strong> Not as an excuse — as evidence you were reasoning, not guessing. "We had two weeks and no eval infrastructure, so I optimised for shipping something people could react to."</li>
<li><strong>State what you learned and what you'd do now.</strong> Concretely.</li>
</ol>
<p><strong>Good, real examples to have ready:</strong></p>
<ul>
<li><em>"I built the pipeline before the eval set."</em> Universal, honest, and the lesson is genuinely load-bearing.</li>
<li><em>"I tuned a parameter by intuition for weeks; one afternoon building a golden set would have answered it in an hour."</em></li>
<li><em>"I reached for an agent where a router and two tools would have done it — cheaper, faster, and testable."</em></li>
<li><em>"I added a reranker before fixing first-stage recall, so I was reranking candidates that didn't contain the answer."</em></li>
<li><em>"I didn't add tracing until debugging forced me to, and I lost real time to guessing."</em></li>
<li><em>"I designed access control after indexing, and retrofitting permissions onto an existing index was far more painful than designing for it."</em></li>
</ul>
<div class="trap"><b>Avoid:</b> fake weaknesses ("I care too much about quality") · blaming teammates or management · a weakness so severe it disqualifies you ("I shipped without testing and it lost data") · and "nothing, I'd do it the same way," which reads as either dishonest or incurious.</div>`}
]}
]});
