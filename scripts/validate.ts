// Validates analysis.json files against the Stage 1 output schema.
// Usage: npm run validate -- <file.json> [more.json ...]   (defaults to examples/*.analysis.json)
//
// The zod schema below mirrors skills/chat-to-article/schema.ts. The type-level check
// `SchemaMatchesTypes` fails `tsc` (run by `npm run validate`) if the two ever drift apart,
// so a field added, renamed or retyped in schema.ts must be mirrored here.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { Analysis, Angle, Signal, SignalKind, TopicNode } from "../skills/chat-to-article/schema.ts";

// ---------- shape ----------

const MessageIdSchema = z.string().regex(/^m[1-9]\d*$/, 'message ids look like "m1", "m2", ...');
const Unit = z.number().min(0).max(1);

const TopicNodeSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  messages: z.array(MessageIdSchema),
  ledBy: z.enum(["user", "assistant"]),
  depth: Unit,
  links: z.array(z.string()),
  get children(): z.ZodArray<typeof TopicNodeSchema> {
    return z.array(TopicNodeSchema);
  },
});

const SignalGroupSchema = z.enum(["understanding", "action", "stance", "engagement"]);
// Open taxonomy: any non-empty string is allowed, so zod can't express the literal hints.
const SignalKindSchema = z.custom<SignalKind>((v) => typeof v === "string" && v.length > 0, "kind must be a non-empty string");

const SignalSchema = z.strictObject({
  kind: SignalKindSchema,
  group: SignalGroupSchema,
  nodeIds: z.array(z.string()).min(1),
  trigger: z.array(MessageIdSchema).min(1),
  cause: z.array(MessageIdSchema).optional(),
  before: z.string().optional(),
  after: z.string().optional(),
  confidence: Unit,
});

const AngleSchema = z.strictObject({
  title: z.string().min(1),
  type: z.enum(["overview", "deep-dive", "case-study", "listicle", "journey", "personal-story", "opinion", "comparison"]),
  nodeIds: z.array(z.string()).min(1),
  signalIndexes: z.array(z.number().int().min(0)),
  hook: z.string().min(1),
  researchNeed: z.enum(["low", "medium", "high"]),
});

export const AnalysisSchema = z.strictObject({
  worthy: z.boolean(),
  worthinessReason: z.string().min(1),
  forest: z.array(TopicNodeSchema),
  signals: z.array(SignalSchema),
  angles: z.array(AngleSchema),
});

// ---------- drift guard: zod output type must equal the TS types exactly ----------

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
export type SchemaMatchesTypes = [
  Expect<Equal<z.infer<typeof TopicNodeSchema>, TopicNode>>,
  Expect<Equal<z.infer<typeof SignalSchema>, Signal>>,
  Expect<Equal<z.infer<typeof AngleSchema>, Angle>>,
  Expect<Equal<z.infer<typeof AnalysisSchema>, Analysis>>,
];

// ---------- cross-references the types can't express ----------

function crossCheck(a: Analysis): string[] {
  const errors: string[] = [];
  const nodes = new Map<string, TopicNode>();
  const walk = (n: TopicNode) => {
    if (nodes.has(n.id)) errors.push(`forest: duplicate node id "${n.id}"`);
    nodes.set(n.id, n);
    n.children.forEach(walk);
  };
  a.forest.forEach(walk);

  for (const n of nodes.values())
    for (const l of n.links) if (!nodes.has(l)) errors.push(`node "${n.id}": links to unknown node "${l}"`);

  a.signals.forEach((s, i) => {
    for (const id of s.nodeIds) if (!nodes.has(id)) errors.push(`signals[${i}]: unknown node "${id}"`);
  });

  a.angles.forEach((ang, i) => {
    for (const id of ang.nodeIds) if (!nodes.has(id)) errors.push(`angles[${i}]: unknown node "${id}"`);
    for (const idx of ang.signalIndexes)
      if (idx >= a.signals.length) errors.push(`angles[${i}]: signal index ${idx} out of range`);
  });

  if (!a.worthy && (a.forest.length || a.signals.length || a.angles.length))
    errors.push("worthy is false, so forest, signals and angles must be empty arrays");

  return errors;
}

// ---------- CLI ----------

function validateFile(path: string): string[] {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    return [`not valid JSON: ${(e as Error).message}`];
  }
  const parsed = AnalysisSchema.safeParse(data);
  if (!parsed.success)
    return parsed.error.issues.map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`);
  return crossCheck(parsed.data);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let files = process.argv.slice(2);
if (files.length === 0) {
  const dir = join(root, "examples");
  files = readdirSync(dir).filter((f) => f.endsWith(".analysis.json")).map((f) => join(dir, f));
}

let failed = 0;
for (const f of files) {
  const errors = validateFile(f);
  const name = relative(process.cwd(), f) || f;
  if (errors.length === 0) {
    console.log(`PASS ${name}`);
  } else {
    failed++;
    console.log(`FAIL ${name}`);
    for (const e of errors) console.log(`  - ${e}`);
  }
}
process.exit(failed ? 1 : 0);
