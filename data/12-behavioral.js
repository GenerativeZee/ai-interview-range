PREP.push({
id:"behavioral", n:"12", title:"Behavioral & Senior Signals", icon:"◎",
blurb:"What 'senior' actually means in each loop, a STAR bank you can adapt, self-intro scripts per role, and the questions to ask that make you look like a peer rather than a candidate.",
topics:[
{
title:"Positioning",
items:[
{q:"What does each role actually screen for?",
roles:["aie","agentic","ds"],lvl:"senior",tags:["positioning","high-freq"],
a:`<table><thead><tr><th>Role</th><th>Core screen</th><th>Emphasize</th><th>De-emphasize</th></tr></thead><tbody>
<tr><td><strong>AI Engineer</strong></td><td>Can you ship an LLM system that survives production?</td><td>RAG depth, evaluation discipline, serving and cost engineering, LLM internals, tracing</td><td>Deriving classical ML theory</td></tr>
<tr><td><strong>Agentic AI Engineer</strong></td><td>Can you build a bounded, observable, safe agent?</td><td>Tool design, state and memory, orchestration, guardrails, agent eval, failure modes, cost control</td><td>Framework trivia</td></tr>
<tr><td><strong>Data Scientist</strong></td><td>Can you turn an ambiguous business problem into a measurable one?</td><td>Problem framing, statistics, experimentation, causal inference, SQL, stakeholder communication</td><td>Kubernetes internals</td></tr>
<tr><td><strong>ML Engineer</strong></td><td>Can you productionize and operate models?</td><td>MLOps, pipelines, serving, monitoring, drift, retraining</td><td>Novel research</td></tr>
<tr><td><strong>Senior / Lead (any)</strong></td><td>Can you own ambiguity and raise the team's ceiling?</td><td>Scoping, tradeoffs, technical judgment, mentoring, influence without authority, knowing when <em>not</em> to build</td><td>Individual tool fluency</td></tr>
</tbody></table>
<p><strong>What "senior" concretely means in the answers, not the title:</strong></p>
<ul>
<li><strong>Tradeoffs, always.</strong> Never one-sided. "X, because of Y, at the cost of Z — and I'd choose differently if W."</li>
<li><strong>Measurement before building.</strong> Every proposal comes with how you'd know it worked.</li>
<li><strong>Simplest thing first.</strong> You justify complexity against a requirement rather than reaching for it.</li>
<li><strong>Failure modes unprompted.</strong> You bring up what breaks, how you'd detect it, how it degrades.</li>
<li><strong>Cost and operational burden</strong> treated as real constraints, not afterthoughts.</li>
<li><strong>Calibrated uncertainty.</strong> "I'd benchmark that rather than guess" is a senior answer.</li>
<li><strong>Business framing.</strong> You connect technical choices to the decision they serve.</li>
<li><strong>Multiplier evidence.</strong> You've made other people better, not just shipped.</li>
</ul>
<div class="trap"><b>The most common way strong engineers fail senior loops:</b> answering at the level of "what I did" instead of "why that was the right call and what I gave up." Same experience, different framing, completely different outcome. Rehearse the second framing out loud.</div>`},

{q:"Two-minute self-introduction — four variants",
roles:["aie","agentic","ds"],lvl:"core",tags:["positioning","high-freq"],
a:`<p><strong>The structure:</strong> who you are (10s) → what you've built, with one specific system (45s) → the technical range (20s) → why this role (20s). Then stop. Do not narrate your CV chronologically.</p>
<div class="say"><b>For an AI Engineer role:</b> "I'm a data scientist and GenAI engineer with about three years of experience, most of it building and deploying LLM systems in production rather than in notebooks.<br><br>
The system I'd point to is an enterprise document assistant over a large SOP and technical-document corpus. I owned the retrieval pipeline and evaluation end to end — document ingestion with OCR and layout extraction, chunking strategy, hybrid retrieval with reciprocal rank fusion and cross-encoder reranking, an evaluation harness on a human-reviewed golden set, and per-user access control enforced at the retrieval layer.<br><br>
Alongside that I've worked across the stack that keeps these systems running — Databricks and Azure, MLflow, vector search, LangChain and LangGraph, semantic caching, and observability with Langfuse. And I have a solid classical ML foundation: classification, feature engineering, model validation, deployment and monitoring.<br><br>
What I'm looking for now is to work on AI systems at larger scale, where the retrieval and evaluation problems are harder and the reliability bar is higher."</div>
<div class="say"><b>For an Agentic AI Engineer role — shift the emphasis to control and reliability:</b> "...The part of this work I've gone deepest on is making these systems behave predictably: bounded tool loops, structured errors the model can recover from, state that survives a restart, approval gates on write actions, and evaluation that runs the same task repeatedly because a single pass on a stochastic system tells you nothing. That reliability engineering is the part I find most interesting and where I think the real difficulty in agents actually is."</div>
<div class="say"><b>For a Data Scientist role — lead with problem framing:</b> "...What I enjoy most is the framing step — turning 'users are churning' into a defined prediction horizon, a label definition, and a threshold derived from the actual cost of a false positive versus a miss. I've built end-to-end models with feature engineering, validation and deployment on Databricks, and I care a lot about measuring honestly: out-of-time validation rather than random splits, and per-segment checks rather than a single aggregate number."</div>
<div class="say"><b>For a senior role — add scope and multiplier:</b> "...Beyond building, I've owned the technical direction on the retrieval side — deciding what we <em>didn't</em> build, setting up the evaluation discipline the team now works against, and bringing colleagues up to speed on retrieval evaluation, which was the bottleneck on how fast we could iterate."</div>`},

{q:"Why are you looking to change? Why this company?",
roles:["aie","agentic","ds"],lvl:"core",tags:["positioning","high-freq"],
a:`<p><strong>Why change — the rule is: pull toward something, never push away from something.</strong></p>
<div class="say">"I've had a good run here — I've been able to build end-to-end AI systems and own real decisions, which is rare this early. What I'm looking for is a bigger version of the same problem: larger scale, harder retrieval and evaluation problems, and a team where I'll be the less experienced person in the room on some of this. I've hit the point where I'm mostly repeating patterns I already know, and I want the next set."</div>
<div class="trap"><b>Never say:</b> bad manager · toxic team · underpaid (raise compensation separately, with recruiting, not as your motivation) · bored · no growth <em>without</em> saying what growth you want. Every one of these makes the interviewer wonder what you'll say about <em>them</em> in two years.</div>
<p><strong>Why this company — do the specific homework. Three ingredients:</strong></p>
<ol>
<li><strong>Something concrete about their problem space</strong> that you could only know by looking. Their product, their scale, a paper or engineering blog post they published, a public technical talk.</li>
<li><strong>The honest overlap</strong> with what you've built.</li>
<li><strong>The honest stretch</strong> — what you'd be learning. This is more convincing than claiming a perfect fit.</li>
</ol>
<div class="say">"Two things. The first is the nature of the data problem — measurement and analytics at that scale means the modelling questions are genuinely about representativeness and drift rather than squeezing another point of AUC, and that's a harder and more interesting problem than what I work on now. The second is honest: my recent work has been GenAI-heavy, and I want to keep that while strengthening the classical ML and experimentation side. This role looks like it uses both rather than asking me to pick one."</div>`}
]},

{
title:"STAR bank",
items:[
{q:"How to build a STAR answer that lands",
roles:["aie","agentic","ds"],lvl:"core",tags:["behavioral","high-freq"],
a:`<p><strong>Situation</strong> (1 sentence) → <strong>Task</strong> (what was yours) → <strong>Action</strong> (the bulk: what <em>you</em> specifically did and why) → <strong>Result</strong> (a number where possible) → <strong>Reflection</strong> (what you'd do differently).</p>
<p><strong>Rules:</strong></p>
<ul>
<li><strong>Keep it to 2 minutes.</strong> Long answers lose the room. Give the shape, let them probe.</li>
<li><strong>Say "I" for your actions</strong> and "we" only for genuine collective work. Interviewers cannot credit you for what "we" did.</li>
<li><strong>Front-load the outcome</strong> if the story is complex: "This is the one where we shipped a regression to production and I built the eval gate that stopped it happening again."</li>
<li><strong>Include the reasoning,</strong> not just the action. The <em>why</em> is what's being assessed.</li>
<li><strong>Add the reflection unprompted.</strong> It signals self-awareness and pre-empts the critical follow-up.</li>
</ul>
<p><strong>Prepare 6–8 stories</strong> that can be re-angled across many questions. One strong story about a production failure can answer: tell me about a failure · a time you took a risk · a conflict · how you handle pressure · and your biggest learning. Build the bank, not a script per question.</p>`},

{q:"The stories to have ready, and what each is really asking",
roles:["aie","agentic","ds"],lvl:"senior",tags:["behavioral","high-freq"],
a:`<table><thead><tr><th>Question</th><th>What they're assessing</th><th>Story to bring</th></tr></thead><tbody>
<tr><td>Tell me about a project you're proud of</td><td>Scope, ownership, judgment</td><td>Your deepest technical project — with the <em>decisions</em>, not the tool list</td></tr>
<tr><td>Tell me about a failure</td><td>Honesty, learning, whether you take responsibility</td><td>A real failure with real consequences, owned cleanly, with a concrete systemic fix. <strong>This is the highest-signal question in the loop.</strong></td></tr>
<tr><td>A time you disagreed with your manager or a senior engineer</td><td>Can you push back without being difficult?</td><td>A technical disagreement where you made the case with evidence, and — ideally — a case where you were overruled and committed anyway</td></tr>
<tr><td>A time you had to work with incomplete requirements</td><td>Comfort with ambiguity — a core senior signal</td><td>How you narrowed scope, made assumptions explicit, shipped something small to learn</td></tr>
<tr><td>A time you had to say no</td><td>Prioritization and spine</td><td>Declining a feature or a "just use an agent" request, with the reasoning and the alternative you offered</td></tr>
<tr><td>A time you mentored or unblocked someone</td><td>Multiplier effect — required for senior</td><td>Specific: what they couldn't do before, what you did, what they can do now</td></tr>
<tr><td>A time you influenced without authority</td><td>Senior scope</td><td>Getting another team to adopt something, or changing a decision you didn't own</td></tr>
<tr><td>Tell me about a tight deadline</td><td>Prioritization under pressure</td><td>What you <em>cut</em> and why — not "I worked weekends," which signals poor scoping</td></tr>
<tr><td>A time you pushed for technical debt work</td><td>Long-term thinking, business framing</td><td>How you made the cost legible to non-engineers</td></tr>
<tr><td>A time you were wrong</td><td>Ego, calibration</td><td>Changed your mind on a technical position when the evidence moved</td></tr>
<tr><td>How do you handle conflicting stakeholder priorities?</td><td>Judgment and communication</td><td>Making the tradeoff explicit and pushing the decision to the person who owns it, with a recommendation</td></tr>
<tr><td>What's the most difficult technical decision you've made?</td><td>Depth of reasoning</td><td>A close call where you can articulate both options fairly</td></tr>
</tbody></table>
<div class="say"><b>Worked example — the failure story, which is worth rehearsing verbatim:</b><br>
"<b>Situation:</b> We shipped a prompt and retrieval change to the assistant on a Thursday. By Friday, users reported the answers had gotten noticeably worse — more confident, less grounded.<br>
<b>Task:</b> I owned retrieval, and the change was mine.<br>
<b>Action:</b> I rolled back first rather than debugging live, which restored quality within the hour. Then I bisected the change: I'd reduced the reranked context from 10 chunks to 5 for latency, and separately tightened the system prompt. The prompt edit had removed the clause that explicitly permitted the model to say it didn't know — so instead of abstaining on thin context, it was filling gaps. Neither change was wrong on its own; together the model had less context and no licence to refuse.<br>
<b>Result:</b> Restored in about an hour. But the real fix was structural: there was no eval gate, so a prompt change could reach production without any regression check. I built a golden set of about 200 human-reviewed pairs and wired a faithfulness and context-recall run into CI as a merge gate. Two later changes were caught by that gate before shipping.<br>
<b>Reflection:</b> The mistake wasn't the prompt edit — it was that prompts were being treated as copy rather than as production logic. I now treat a prompt as code: reviewed, versioned, and gated by evals."</div>`}
]},

{
title:"Closing the interview",
items:[
{q:"What questions should you ask them?",
roles:["aie","agentic","ds"],lvl:"core",tags:["behavioral","high-freq"],
a:`<p>Ask 2–3, chosen for the round you're in. Good questions make you read as a peer evaluating a mutual fit — which is exactly the senior posture.</p>
<p><strong>To an engineer / tech lead:</strong></p>
<ul>
<li>What's the hardest technical problem the team is working on right now?</li>
<li>How mature is the evaluation and deployment infrastructure — is there an eval gate before a prompt or model change ships?</li>
<li>How do you currently balance traditional ML against GenAI work?</li>
<li>What does the observability story look like for the AI systems in production?</li>
<li>What's the biggest source of production incidents for this team?</li>
</ul>
<p><strong>To a hiring manager:</strong></p>
<ul>
<li>What would success look like in the first six months for this role?</li>
<li>What's the gap on the team that made you open this position?</li>
<li>How are priorities set between platform work and product feature work?</li>
<li>How do decisions get made when engineering and the business disagree on a tradeoff?</li>
<li>What separates someone doing well in this role from someone doing exceptionally?</li>
</ul>
<p><strong>For a senior role specifically — ask about scope, because it's the thing that's usually vague:</strong></p>
<ul>
<li>How much of this role is hands-on building versus technical direction?</li>
<li>What does the path from senior to staff look like here, and what's the differentiator?</li>
<li>Where does this role have decision authority, and where does it need to influence?</li>
</ul>
<p><strong>Always worth asking:</strong></p>
<ul>
<li>What are the next steps and the timeline?</li>
<li>Is there anything about my background you'd like me to expand on? <em>(This is a genuinely useful question — it surfaces a doubt while you can still address it.)</em></li>
</ul>
<div class="trap"><b>Don't ask</b> what the company does (do the homework) · compensation and leave policy in a technical round (that's recruiting) · anything answered on the careers page · or "do you have any concerns about me?" phrased defensively. The version above — "anything you'd like me to expand on" — gets the same information without the flinch.</div>`},

{q:"Compensation and level conversations",
roles:["aie","agentic","ds"],lvl:"senior",tags:["behavioral"],
a:`<p><strong>Not legal or financial advice</strong> — just the conversational patterns that tend to work. Do your own research on market rates for your role, location and level.</p>
<p><strong>Early, when asked for a number first:</strong></p>
<div class="say">"I'd rather understand the scope and level first, since that drives the range quite a lot. If it helps, could you share the band you've budgeted for this role? I'm confident we can make it work if the role is right."</div>
<p><strong>If pressed for a current salary</strong> (illegal to require in some jurisdictions, always awkward): redirect to expectations rather than history. "I'd prefer to anchor on the market rate for the scope of this role rather than my current number, since I'm moving partly for the step up in scope."</p>
<p><strong>When giving a range:</strong> give a range whose <em>bottom</em> you'd genuinely accept, state it as based on market research for the level, and tie it to scope.</p>
<p><strong>On level:</strong> ask directly and early which level the role is mapped to and what distinguishes it from the one above. If you're being considered a level below where you think you fit, the argument is evidence-based, not assertive — scope owned, decisions made independently, people you've unblocked, systems you've been accountable for in production. "Here's what I've been responsible for; help me understand how that maps to your levels" is a much better opening than "I should be senior."</p>
<p><strong>General principles:</strong> negotiate after an offer, not during evaluation · negotiate the whole package (base, equity, bonus, sign-on, level, start date, remote flexibility, learning budget) rather than only base · be genuinely willing to hear no on any single item · stay warm throughout, because these are your future colleagues · and get the final terms in writing before resigning anywhere.</p>`}
]}
]});
