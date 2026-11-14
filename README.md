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

**Worthiness gate.** Not every chat deserves an article. A chat where you only drafted a LinkedIn reply is marked not worthy, with a reason, instead of being padded into something weak.

## Install

**claude.ai:** zip the `skills/chat-to-article` folder and upload it under Settings → Capabilities → Skills.

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
