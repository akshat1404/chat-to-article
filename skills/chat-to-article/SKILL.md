---
name: chat-to-article
description: Turns the current chat into article material. Use when the user asks to turn this chat or conversation into an article, blog post, or write-up.
---

# Chat to Article

Stage 1 only: analyse the data. Do not draft an article, ask questions, or research yet.

## Step 1: Number the chat

Read the whole conversation from the first message. Number every message in order as m1, m2, ... counting both user and assistant turns. Every claim you make later must point to these ids.

## Step 2: Worthiness gate

Decide whether the chat holds article material. It is worthy if it has at least one of: real explanations, a learning arc, a decision with reasoning, or the user's own original thinking. It is not worthy if it is a one-off task (drafting a reply, fixing a typo, a single fact lookup).

If not worthy, set `worthy: false`, give the reason in one sentence, and stop. Never pad a weak chat into an article.

## Step 3: Build the content forest

- Make one tree per unrelated theme. System design and bodybuilding in the same chat are two separate roots.
- Nest subtopics under the theme they belong to (system design > caching > Redis).
- For each node, write the **final, corrected** understanding. If Claude said something wrong and was corrected later, keep only the corrected version.
- Record `ledBy`: "user" if the user raised the topic, "assistant" if it came from Claude's roadmap.
- Add `links` when one topic reuses another (Uber's design uses caching).

## Step 4: Detect signals

A signal is any moment where the user's state changes. Rules:

- **Evidence comes from user messages.** `trigger` must be user turns. The assistant turn that caused the change goes in `cause`.
- **Use the user's own words** for `before` and `after` where possible.
- **Don't invent feelings.** Only tag `emotion` when the user says it ("I'm frustrated", "finally!").
- **Score confidence honestly.** Normal follow-up questions are not a struggle. Tag a `breakthrough` only when there is repeated confusion followed by a clear "now I get it" moment.

| Group | Kind | What to look for |
|---|---|---|
| understanding | breakthrough | Same thing asked repeatedly, then a clear click |
| understanding | misconception | User states a belief that gets overturned |
| understanding | surprise | "Wait, really?" reaction to a counterintuitive fact |
| understanding | synthesis | User connects two topics on their own |
| understanding | own-analogy | User restates a concept in their own metaphor |
| action | decision | User picks one option over another, with reasons |
| action | application | User applies a concept to their own project or life |
| action | mistake | Something the user tried failed, and they learned why |
| stance | pushback | User disagrees with Claude |
| stance | open-question | Something left unresolved at the end |
| stance | emotion | User expresses frustration, anxiety, or excitement |
| engagement | tangent | User steers into a new topic unprompted |
| engagement | depth | A large share of the chat spent on one node |

New kinds are allowed if a moment fits none of these.

## Step 5: Derive angles

- A node alone gives an explainer (overview, deep-dive, case-study, listicle, comparison).
- A node plus a signal gives a personal angle (personal-story, journey, opinion). Rank these first, because nobody else can write them.
- Set `researchNeed`: low for journeys (the chat is the source), high for health, finance, or legal claims.

## Step 6: Output

Write `analysis.json` matching the output schema below, then reply with a short summary: the trees, the strongest 3 signals, and the top 5 angles.

## Output schema

`analysis.json` must match these types exactly.

```ts
// Output of Stage 1 (data). Everything downstream (angles, research, drafting) reads this.

export type MessageId = string; // "m1", "m2", ... in chat order, user and assistant both numbered

export type Analysis = {
  worthy: boolean;
  worthinessReason: string; // why it is or isn't article material
  forest: TopicNode[]; // one root per unrelated theme (system design, bodybuilding)
  signals: Signal[];
  angles: Angle[];
};

export type TopicNode = {
  id: string; // "sd", "sd.caching", "sd.caching.redis"
  title: string;
  summary: string; // the final, corrected understanding, not dead ends
  messages: MessageId[]; // where this topic was discussed
  ledBy: "user" | "assistant"; // who brought the topic up
  depth: number; // share of the chat spent here, 0..1
  links: string[]; // ids of related nodes in any tree (Uber -> caching)
  children: TopicNode[];
};

export type SignalGroup = "understanding" | "action" | "stance" | "engagement";

export type SignalKind =
  // understanding: what the user knows changed
  | "breakthrough" | "misconception" | "surprise" | "synthesis" | "own-analogy"
  // action: what the user did changed
  | "decision" | "application" | "mistake"
  // stance: what the user believes changed
  | "pushback" | "open-question" | "emotion"
  // engagement: where attention went
  | "tangent" | "depth"
  | (string & {}); // open taxonomy: new kinds allowed without schema changes

export type Signal = {
  kind: SignalKind;
  group: SignalGroup;
  nodeIds: string[]; // usually one; synthesis links two or more
  trigger: MessageId[]; // user messages that show the state change
  cause?: MessageId[]; // assistant message that caused it (the explanation that clicked)
  before?: string; // user's state before, in their words where possible
  after?: string; // user's state after
  confidence: number; // 0..1, how sure the detection is
};

export type AngleType = "overview" | "deep-dive" | "case-study" | "listicle" | "journey" | "personal-story" | "opinion" | "comparison";

export type Angle = {
  title: string;
  type: AngleType;
  nodeIds: string[];
  signalIndexes: number[]; // indexes into Analysis.signals; empty for plain explainers
  hook: string; // one line on why a reader would click
  researchNeed: "low" | "medium" | "high"; // journey = low, health/finance claims = high
};
```
