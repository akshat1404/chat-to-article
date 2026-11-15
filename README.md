# chat-to-article

A Claude skill that turns a chat session into article material.

Most useful chats with an AI hold more than answers. They hold the moment a concept finally clicked, a belief that got overturned, or a decision with real reasoning behind it. Those moments are what make an article worth reading, and they get lost when the chat ends. This skill reads the chat, maps what was discussed and how you related to it, and proposes articles only you could write.

It works for any domain: system design, diet, finance, or anything else you learned through a conversation.

## How it works

The skill builds two layers from the chat.

**1. The content forest.** A forest is a set of separate topic trees. Each unrelated theme in the chat becomes its own tree (system design and bodybuilding never mix), with subtopics nested under it (system design > caching > Redis). Every node stores the final, corrected understanding of that topic, not the dead ends, and points to the messages where it was discussed.

**2. Relationship signals.** A signal is any moment where your state changed: what you know, what you did, or what you believe. Signals are attached to topic nodes and always cite the exact user messages as evidence.

| Group | Signal | What it means | Article it produces |
|---|---|---|---|
| Understanding | breakthrough | Repeated confusion, then something clicked | "The one thing that made X clear" |
| Understanding | misconception | A belief you stated got overturned | "I used to think X" |
| Understanding | surprise | A counterintuitive fact caught you off guard | "Things I didn't know about X" |
| Understanding | synthesis | You connected two topics on your own | Original-thinking pieces |
| Understanding | own-analogy | You explained a concept in your own metaphor | Explainers in your voice |
| Action | decision | You chose one option over another | "Why I chose X over Y" |
| Action | application | You applied a concept to your own work or life | "How I used X in Y" |
| Action | mistake | Something you tried failed, and you learned why | "What X taught me the hard way" |
| Stance | pushback | You disagreed with the AI | Opinion pieces |
| Stance | open-question | Something stayed unresolved | "The question I still can't answer" |
| Stance | emotion | You said you were frustrated, anxious, or excited | Sets the tone for journey pieces |
| Engagement | tangent | You steered into a new topic yourself | Signals real curiosity |
| Engagement | depth | A large share of the chat went into one topic | Shows where your effort went |

The list is open: new signal kinds can be added without changing the schema.

**Angles** come from combining the two layers. A topic alone gives an explainer ("How Rate Limiting Works"). A topic plus a signal gives a personal story ("The Analogy That Made Load Balancers Click"). Personal angles are ranked first because nobody else can write them.

**Worthiness gate.** Not every chat deserves an article. A chat where you only drafted a LinkedIn reply is marked not worthy, with a reason and the messages that back it up, instead of being padded into something weak.

**Personal details.** Chats often reveal things like salary, age, health or where you bank. The skill lists each one in `sensitive` with its category and source messages. Angles may still use them, but every angle names the details it depends on in `usesSensitive`, so Stage 2 can ask you whether to keep, generalise or drop each one. ID and account numbers are never written to any field.

## Install

**claude.ai:** zip the `skills/chat-to-article` folder and upload it under Settings → Capabilities → Skills.

> The claude.ai copy does not sync from GitHub. Re-upload the skill after every change to `SKILL.md` or `schema.ts`, or claude.ai keeps running the old version. claude.ai only keeps `SKILL.md`, which is why the full schema is embedded in it.

**Claude Code:** copy the folder into your skills directory:

```bash
cp -r skills/chat-to-article ~/.claude/skills/
```

## Usage

At the end of any chat, ask:

```
Turn this chat into an article.
```

The skill writes `analysis.json` (shape defined in [`schema.ts`](skills/chat-to-article/schema.ts)) and replies with a short summary: the topic trees, the 3 strongest signals, and the top 5 angles.

## Output

`analysis.json` holds:

| Field | What it holds |
|---|---|
| `worthy`, `worthinessReason` | Whether the chat is article material, and why |
| `worthinessEvidence` | Message ids that back up the reason |
| `messageIndex` | One-line summary per message (`"m5": "user: ..."`), so later stages can look up messages without re-reading the chat |
| `sensitive` | Every personal detail you revealed: `detail`, `category` (income, age, health, location, employer, financial-account, relationship, other) and `messages` |
| `forest` | Topic trees. Each node has `id`, `title`, `summary`, `messages`, `ledBy`, `depth`, `links`, `children` |
| `signals` | State changes. Each has an `id` (`"s1"`, `"s2"`, ...), `kind`, `group`, `nodeIds`, `trigger`, optional `cause`/`before`/`after`, and `confidence` |
| `angles` | Article ideas. Each has `title`, `type`, `nodeIds`, `signalIds` (signal ids, not array positions), `hook`, `researchNeed` and `usesSensitive` |

Every field is required. Empty lists are written as `[]`, never left out.

## Development

`schema.ts` is the source of truth. `SKILL.md` embeds a copy of it under "Output schema".

```bash
npm install
npm run check-schema           # fails if the types block in SKILL.md differs from schema.ts
npm run check-schema -- --fix  # copies schema.ts into SKILL.md
npm run validate               # validates every examples/*.analysis.json
npm run validate -- path/to/analysis.json
```

`validate` type-checks the project first: the zod schema in [`scripts/validate.ts`](scripts/validate.ts) is compared against the types in `schema.ts` at compile time, so the build fails if the two drift apart. It then checks each file for unknown or missing fields, broken node, signal, message and sensitive-detail references, triggers that are not user messages, and digit runs that look like ID or account numbers.

After changing the schema, run both scripts, update the examples, then re-upload the skill to claude.ai.

## Examples

The `examples/` folder holds sample chats with their expected output. They also serve as test fixtures, meaning fixed inputs you re-run after changing the skill to check its output still matches.

| Chat | Expected result |
|---|---|
| [`system-design.md`](examples/system-design.md) | Worthy. One tree, a breakthrough on load balancers, a misconception about frontend system design |
| [`not-worthy-linkedin.md`](examples/not-worthy-linkedin.md) | Not worthy. A one-off drafting task |

## Roadmap

- [x] **Stage 1: Data.** Topic forest, signals, angles, worthiness gate
- [ ] **Stage 2: HITL.** HITL (human-in-the-loop) means pausing for your input: pick an angle, audience and length, then approve an outline
- [ ] **Stage 3: Research.** Verify claims from the chat and fill gaps, scoped to the chosen angle
- [ ] **Stage 4: Drafting.** Write the article in your voice, learned from your past writing
- [ ] **Stage 5: Images.** Diagrams rendered from code for technical pieces, a generated cover image

## Privacy

Chats often contain personal details. Never commit real chats to this repo as examples. Write them yourself or scrub them fully.

## License

[MIT](LICENSE)
