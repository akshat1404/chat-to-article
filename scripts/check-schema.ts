// Fails if the TypeScript block under "## Output schema" in SKILL.md differs from schema.ts.
// schema.ts is the source of truth; SKILL.md embeds a copy because claude.ai only keeps SKILL.md.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillPath = join(root, "skills/chat-to-article/SKILL.md");
const schemaPath = join(root, "skills/chat-to-article/schema.ts");

const normalize = (s: string) => s.replace(/\r\n/g, "\n").trim();

const skill = normalize(readFileSync(skillPath, "utf8"));
const schema = normalize(readFileSync(schemaPath, "utf8"));

const section = skill.split(/^## Output schema\s*$/m)[1];
if (section === undefined) {
  console.error('check-schema: SKILL.md has no "## Output schema" section.');
  process.exit(1);
}

const block = section.match(/^```ts\n([\s\S]*?)\n```/m);
if (!block) {
  console.error('check-schema: no ```ts block found under "## Output schema" in SKILL.md.');
  process.exit(1);
}

const embedded = normalize(block[1]);
if (embedded !== schema) {
  const a = embedded.split("\n");
  const b = schema.split("\n");
  const line = a.findIndex((l, i) => l !== b[i]);
  const n = line === -1 ? Math.min(a.length, b.length) : line;
  console.error("check-schema: SKILL.md types block differs from schema.ts.");
  console.error(`  first difference at line ${n + 1} of the block:`);
  console.error(`  SKILL.md : ${a[n] ?? "<end of block>"}`);
  console.error(`  schema.ts: ${b[n] ?? "<end of file>"}`);
  console.error("Copy schema.ts into the ```ts block under \"## Output schema\" in SKILL.md.");
  process.exit(1);
}

console.log("check-schema: SKILL.md types block matches schema.ts.");
