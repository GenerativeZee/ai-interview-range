# Contributing

Thanks for wanting to help. This project gets better mainly through two things: **questions people were actually asked**, and **corrections when something here is wrong**.

You do not need to know git to contribute.

---

## The easy way — suggest a question from the app

1. Open the site and click **＋ Suggest** (bottom left) or **Suggest a question**.
2. Fill in the question and your answer.
3. It opens a pre-filled GitHub issue. Review it and press submit.

That's it. You'll need a free GitHub account. Nothing is sent from the page itself — it just opens GitHub with the form already filled in, and you stay in control of what gets submitted.

## Found an error?

**Please open an issue.** This is the single most valuable contribution. Technical content drifts out of date, and no single author catches everything — several errors have already been fixed this way.

Use the **Correction** issue template and include what's wrong, what it should say, and a source if you have one.

---

## What makes a good question submission

The bar is "would this genuinely help someone in an interview", not "is this technically correct".

**Good:**

- The question phrased the way an interviewer actually asks it, not as a topic heading. *"How would you know if your reranker is hurting recall?"* beats *"Rerankers"*.
- An answer that includes the **reasoning**, not just the conclusion. Why is this the right approach, and what are you trading away?
- The **follow-up** an interviewer would ask next.
- The **trap** — the plausible-sounding wrong answer, or the detail that catches people out.
- Where it came from, if you're comfortable sharing. Real interview provenance helps prioritise review.

**Less useful:**

- Definitions with no context. The glossary handles those — suggest a glossary term instead.
- Questions copied from another site verbatim (a licence problem as well as a quality one).
- Anything confidential, under NDA, or from a take-home you agreed not to share.
- Extremely niche trivia that would not decide an interview.

Rough notes are completely fine. Clarity matters more than polish, and the answer will be edited before merging.

## What happens to your submission

1. **Triage** — is it in scope, is it a duplicate?
2. **Research** — every claim gets verified independently. This is the slow part, and it is the point: an interview-prep resource that is confidently wrong is worse than no resource.
3. **Editing** — reworked into the house style: the spoken answer in a `say` block, the trap in a `trap` block, jargon added to the glossary.
4. **Merge and credit** — you're credited in the commit and in the issue thread.

Please be patient. Verification takes real time, and questions get merged when they've been checked rather than when they arrive.

---

## Contributing by pull request

If you're comfortable with git, a PR is very welcome.

```bash
git clone https://github.com/GenerativeZee/ai-interview-range.git
cd ai-interview-range
python3 -m http.server 8000   # then open http://localhost:8000
```

There is no build step for development — edit the files and refresh the browser.

### Keep your own project notes out of the repo

Section 11 is deliberately a *framework* rather than anyone's personal script.
If you want to keep your own filled-in answers alongside it, copy
`data/local-my-project.example.js` to `data/local-my-project.js` — that path is
git-ignored, so your real figures never get committed. Please don't add personal
project details to section 11 itself.

### Adding a question

Find the right section file in `data/` and add an item to the appropriate topic:

```js
{
  q:"How would you know if your reranker is hurting recall?",
  roles:["aie"],                    // ds | aie | agentic — one or more
  lvl:"senior",                     // core | senior
  tags:["rag","retrieval","high-freq"],
  a:`<p>Your answer as HTML.</p>
     <div class="say"><b>Say this:</b> "The spoken version, in first person."</div>
     <div class="trap"><b>Trap:</b> The plausible wrong answer and why it's wrong.</div>`
}
```

Conventions:

- `a` is an HTML string in a template literal. **No backticks inside it** — use `<code>` tags.
- Use `<div class="say">` for the answer as you'd say it aloud, and `<div class="trap">` for traps and caveats.
- Tag `high-freq` only if it genuinely comes up often. Tag `senior-signal` for things that specifically distinguish a senior candidate.
- Tables go in plain `<table>` — the app wraps them for horizontal scrolling automatically.

### Adding a glossary term

One entry in `data/00-glossary-a.js` (ML, statistics, deep learning) or `00-glossary-b.js` (LLMs, RAG, agents, MLOps, systems):

```js
"beam search":{
  d:"Exploring several candidate continuations at once and keeping the best overall.",
  w:"Good for translation; produces bland text for open-ended writing.",   // optional
  also:["beam decoding"]                                                    // optional
}
```

It links itself automatically the first time the term appears in any answer. Write for someone who has never heard the term — assume no background.

### Adding a What / Why / How summary

In `data/00-enrich.js`, keyed by a distinctive substring of the question:

```js
"How would you know if your reranker":{
  what:"One sentence: what the thing is.",
  why:"Why it exists and what problem it solves. This is the part people skip and it's the most useful part.",
  how:"How it actually works, mechanically, in plain language."
}
```

### Adding a visual

Visuals live in `data/00-visuals-a.js` and `00-visuals-b.js`:

```js
VISUALS["my-concept"] = {
  title:"A short imperative title",
  caption:"One sentence on what the picture shows.",
  build:function(){ return '<div class="vz">…controls and an <svg>…</div>'; },
  init:function(root){ /* wire up the controls */ }
};
```

Then map it to a question in `ENRICH.viz`. Rules:

- Hand-authored inline SVG only. **No libraries, no external images.**
- Size with `viewBox` and let CSS scale it. Keep all text inside the viewBox bounds.
- Colour with `currentColor` and the `--vz-*` CSS variables so it works in both light and dark themes.
- No `<script>` or `<style>` inside the SVG — controls are HTML outside it.
- Must be legible at 360px wide.
- If the visual animates on a timer, stop it on the `vz:hide` event (see existing examples).

### Before you open a PR

- Open the page and check your change renders in **both** light and dark themes.
- Check it at phone width (~390px) with the card expanded.
- Confirm no horizontal scrolling appears on the page body.
- Check the browser console for errors.

---

## Licensing your contribution

By contributing you agree that:

- **Content** (questions, answers, glossary) is licensed under **CC BY-SA 4.0**
- **Code** (visuals, app changes) is licensed under **MIT**
- You have the right to submit it, and it contains nothing confidential or under NDA

---

## Code of conduct

Be decent. This is a resource for people who are job hunting, which is stressful enough already. Assume good faith, critique content rather than people, and don't gatekeep — "everyone knows this" is never a useful comment.

Anything harassing, discriminatory or abusive gets removed and the account blocked.
