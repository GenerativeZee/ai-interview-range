/* ─────────────────────────────────────────────────────────────────────────────
   YOUR OWN PROJECT SCRIPT — private, never committed.

   1. Copy this file to  data/local-my-project.js
   2. Fill in your real numbers and your real story
   3. Reload the page — it appears as section 14, "My Projects"

   data/local-my-project.js is listed in .gitignore, so it stays on your
   machine. Keep your real figures out of any public repo: a corpus size or a
   latency number you can't defend is worse than no number at all, and an
   interviewer who finds your repo will read it.

   If this file doesn't exist the app simply skips it. Nothing breaks.
   ───────────────────────────────────────────────────────────────────────────── */

PREP.push({
id:"my-projects", n:"14", title:"My Projects", icon:"★",
blurb:"My own project scripts, with my real numbers. Rehearse these out loud until the opener is automatic and every figure is available without thinking.",
topics:[
{
title:"Project 1 — <your project name>",
items:[

{q:"90-second opener: <your project name>",
roles:["aie","agentic","ds"], lvl:"senior", tags:["my-project","high-freq"],
a:`<div class="say"><b>Say this:</b> "<em>Who</em> needed <em>what</em>, and it was costing them <em>X</em>.
I built <em>system, in one clause</em>.
<br><br>
The pipeline: <em>source</em> → <em>processing</em> → <em>storage</em> → <em>retrieval or inference</em> → <em>output</em>.
<br><br>
I owned <em>your exact scope</em>. The hardest problem wasn't <em>the obvious one</em> — it was <em>the real one</em>, because <em>why it was hard</em>."</div>
<p><strong>Then stop.</strong> Let them pick what to drill into. If you keep going you'll answer the question they weren't going to ask and lose the room.</p>`},

{q:"My numbers for <your project name>",
roles:["aie","agentic","ds"], lvl:"senior", tags:["my-project","numbers"],
a:`<p>Memorise these. Not to recite — so that when a follow-up demands one, it's there.</p>
<table><thead><tr><th>Figure</th><th>Mine</th><th>Why I chose it / how I measured</th></tr></thead><tbody>
<tr><td>Scale of the data</td><td>…</td><td>…</td></tr>
<tr><td>Key design parameter</td><td>…</td><td>…</td></tr>
<tr><td>Model(s) used</td><td>…</td><td>…</td></tr>
<tr><td>Eval set size &amp; construction</td><td>…</td><td>…</td></tr>
<tr><td>Headline metric: baseline → final</td><td>… → …</td><td>…</td></tr>
<tr><td>p95 latency &amp; dominant stage</td><td>…</td><td>…</td></tr>
<tr><td>Cost per request/run</td><td>…</td><td>…</td></tr>
<tr><td>Team size &amp; my scope</td><td>…</td><td>…</td></tr>
</tbody></table>
<div class="trap"><b>Any row you leave as "…" is a question you cannot answer.</b> If you genuinely don't have the figure, write "not instrumented" and prepare the honest version — see "Quantifying impact when you don't have clean numbers" in section 11. That answer scores well. Bluffing does not.</div>`},

{q:"The three decisions I'll be challenged on",
roles:["aie","agentic","ds"], lvl:"senior", tags:["my-project","senior-signal"],
a:`<p>For each: what you chose, what you rejected, and what you gave up. The tradeoff is the part that scores.</p>
<h4>Decision 1 — …</h4>
<ul><li><strong>Chose:</strong> …</li><li><strong>Considered instead:</strong> …</li>
<li><strong>Why:</strong> …</li><li><strong>Gave up:</strong> …</li>
<li><strong>How I'd know if I was wrong:</strong> …</li></ul>
<h4>Decision 2 — …</h4>
<ul><li><strong>Chose:</strong> …</li><li><strong>Considered instead:</strong> …</li>
<li><strong>Why:</strong> …</li><li><strong>Gave up:</strong> …</li>
<li><strong>How I'd know if I was wrong:</strong> …</li></ul>
<h4>Decision 3 — …</h4>
<ul><li><strong>Chose:</strong> …</li><li><strong>Considered instead:</strong> …</li>
<li><strong>Why:</strong> …</li><li><strong>Gave up:</strong> …</li>
<li><strong>How I'd know if I was wrong:</strong> …</li></ul>`},

{q:"What broke in production, and what I changed afterwards",
roles:["aie","agentic","ds"], lvl:"senior", tags:["my-project","high-freq"],
a:`<p>No war story reads as no production experience. Use STAR, and make the fix <em>systemic</em> rather than a one-off patch — that's what turns an incident into a signal of judgement.</p>
<ul>
<li><strong>Situation:</strong> …</li>
<li><strong>What I did first:</strong> … <em>(restore service before root-causing — say this explicitly)</em></li>
<li><strong>Root cause:</strong> …</li>
<li><strong>The systemic fix:</strong> … <em>(the gate, alert or test that stops it recurring)</em></li>
<li><strong>What I'd have done differently:</strong> …</li>
</ul>`},

{q:"What I'd do differently on <your project name>",
roles:["aie","agentic","ds"], lvl:"senior", tags:["my-project","senior-signal"],
a:`<p>Volunteer one of these unprompted. It signals reflection, and it lets you choose which weakness gets discussed instead of having one chosen for you.</p>
<ol>
<li><strong>Own it:</strong> "That was the wrong call."</li>
<li><strong>The reasoning at the time:</strong> …</li>
<li><strong>What I'd do now:</strong> …</li>
</ol>`}

]}
/* Duplicate the topic block above for Project 2 and Project 3.
   Aim for three: one AI/LLM system, one with a classical ML or analytics
   component, and one where something went wrong and you fixed it. The third
   is the one most candidates skip and the one senior interviewers weight
   most heavily. */
]});
