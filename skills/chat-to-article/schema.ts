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
