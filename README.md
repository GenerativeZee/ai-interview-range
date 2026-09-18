# Interview Range

**Open-source interview preparation for AI Engineer, Agentic AI Engineer and Data Scientist roles — including senior and lead levels.**

170 questions with answers written the way you would actually say them out loud, not the way a textbook writes them. Every piece of jargon is explained in plain English wherever it appears. Fifteen interactive visuals for the concepts that are genuinely hard to picture.

No dependencies, no tracking, no analytics. It is one HTML file and a folder of JavaScript data files, hostable anywhere static.

---

## Why this exists

Most interview prep is either a list of questions with no answers, or answers that read like lecture notes — correct, but not something you could say to another engineer under mild stress. This tries to be the second thing: what a strong answer actually sounds like, what the follow-up question will be, and what the trap is.

It also assumes you might not already know the vocabulary. Hover any underlined term for a plain-English definition.

## What's inside

| # | Section | Cards |
|---|---------|-------|
| 01 | Core ML & Statistics | 40 |
| 02 | Deep Learning | 11 |
| 03 | Transformers & LLM Internals | 16 |
| 04 | Fine-tuning & Alignment | 8 |
| 05 | RAG Systems | 15 |
| 06 | Agentic AI Engineering | 14 |
| 07 | MLOps & LLMOps | 12 |
| 08 | Production Systems & Security | 17 |
| 09 | System Design Cases | 9 |
| 10 | Coding & SQL | 7 |
| 11 | Project Deep Dives | 5 |
| 12 | Behavioral & Senior Signals | 7 |
| 13 | Study Plan & Mock Rounds | 9 |

Plus **340 glossary terms** (859 including acronyms and alternative spellings, all auto-linked), **26 What / Why / How summaries**, **15 interactive visuals** and **5 guided paths**.

### Features

- **Instant search** across every question *and* the full text of every answer
- **5 guided paths** — Complete beginner · AI Engineer · Agentic AI · Data Scientist · Interview this week
- **Plain-English glossary** — 340 terms, auto-linked; hover or tap any underlined word, anywhere on the site
- **What / Why / How** summaries on the conceptually hardest cards, above the detailed answer
- **Interactive visuals** — drag a threshold and watch an ROC curve move, step through backpropagation, see why a KV cache matters
- **Drill mode** with spaced repetition — shaky cards return every round, solid ones occasionally
- **Progress tracking** per section, saved in your browser
- **Filters** by role, confidence, difficulty and question frequency
- Light and dark themes, works on a phone

### The interactive visuals

| Visual | What you can do with it |
|---|---|
| ROC curve | Drag the threshold, watch the curve point and confusion counts move together |
| Precision vs recall | See the two pull against each other, with the business framing for each end |
| Bias–variance | Slide model complexity from underfit to memorised, with live train/test error |
| Gradient descent | Set a learning rate and watch it converge, crawl, or bounce and diverge |
| Backpropagation | Step a real forward pass then a backward pass, with actual numbers |
| Bagging vs boosting | Watch four trees build in parallel, then in sequence |
| Drift | Slide time forward and watch PSI climb through its threshold bands |
| Self-attention | Click a word and see what it attends to — and why "sat" looks at "cat", not "dog" |
| KV cache | Toggle the cache on and off and compare the compute cost per token |
| LoRA | Slide the rank and watch trainable parameters collapse |
| Chunking | The same document cut three ways, with what breaks in each |
| RRF | Three ranked lists fusing, with a K slider showing consensus vs confidence |
| HNSW | Follow a search hopping down through the graph layers |
| RAG pipeline | Walk a question through every stage, with each stage's characteristic failure |
| Agent loop | Compare a healthy run against a stuck loop and a runaway cost |

---

## Running it

It's a static site. Any of these work:

**Just open it**
```bash
git clone https://github.com/GenerativeZee/ai-interview-range.git
cd ai-interview-range
open index.html          # macOS — or xdg-open / start on Linux / Windows
```

**Serve it locally** (recommended — some browsers restrict `file://`)
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

**Host it free** — it works as-is on GitHub Pages, Netlify, Vercel or Cloudflare Pages with no configuration. For GitHub Pages: Settings → Pages → deploy from `main` / root.

Your progress is stored in your own browser's local storage. Nothing is sent anywhere, and there is no analytics or tracking of any kind.

---

## Contributing

**Suggesting a question takes two minutes and needs no git knowledge.** Click **Suggest a question** in the app and it opens a pre-filled GitHub issue — review, press submit, done.

Every suggestion is researched and verified before it's merged, and contributors are credited. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for what makes a good submission, how to fix an error, and how to add a question by pull request.

Particularly wanted:

- **Questions from real interviews** (nothing confidential, and no company name unless you're comfortable naming it)
- **Corrections.** If something here is wrong, please say so — open an issue and it gets fixed
- Sections that are thin: Coding & SQL, and more system design cases
- Non-English translations of the glossary

### Project structure

```
index.html                 the entire app — markup, styles, logic
data/
  00-glossary-a.js         glossary: ML, statistics, deep learning
  00-glossary-b.js         glossary: LLMs, RAG, agents, MLOps, systems
  00-visuals-a.js          interactive visuals: ML and statistics
  00-visuals-b.js          interactive visuals: transformers, RAG, agents
  00-enrich.js             What/Why/How text, visual assignments, paths, difficulty
  01-core-ml.js … 13-plan.js   one file per section
  local-my-project.example.js  template for your OWN project scripts
```

### Your own project notes stay private

Section 11 gives you the framework for narrating a project in an interview. Your
actual answers — real corpus sizes, latencies, metrics, team scope — belong on
your machine, not in a public repo:

```bash
cp data/local-my-project.example.js data/local-my-project.js
# fill it in, reload the page — it appears as section 14, "My Projects"
```

`data/local-my-project.js` is in `.gitignore` and never gets committed. If the
file doesn't exist the app just skips it.

Each section file pushes one object onto a global `PREP` array:

```js
PREP.push({
  id:"core-ml", n:"01", title:"Core ML & Statistics", icon:"Σ",
  blurb:"One or two sentences describing the section.",
  topics:[{
    title:"Evaluation metrics",
    items:[{
      q:"The question, as an interviewer would ask it",
      roles:["ds","aie"],          // ds | aie | agentic
      lvl:"core",                  // core | senior
      tags:["metrics","high-freq"],
      a:`<p>The answer as HTML. Use <code>&lt;div class="say"&gt;</code> for the
           spoken version and <code>&lt;div class="trap"&gt;</code> for the trap.</p>`
    }]
  }]
});
```

To add a glossary term, add one entry to either glossary file — it links itself automatically the first time it appears in any answer:

```js
"your term":{ d:"Plain-English definition, one or two sentences.",
              w:"Why it matters in practice. Optional.",
              also:["acronym","alternative spelling"] }
```

---

## Licence

- **Code** (`index.html`, the visuals, the app logic) — [MIT](LICENSE)
- **Content** (questions, answers, glossary) — [CC BY-SA 4.0](LICENSE-CONTENT)

In short: do what you like with the code. Reuse the question bank freely too, but credit this project and keep your version open under the same terms. Contributions are accepted under these licences.

## Acknowledgements

Built by [MD Zaid](https://github.com/GenerativeZee), starting from notes made while preparing for AI/ML engineering interviews, then expanded considerably. If it helps you land something, a ⭐ is appreciated — and please contribute the questions you got asked.

**Corrections are the most valuable contribution.** Technical content drifts out of date and no single author catches everything. If a claim here is wrong, please open an issue.
