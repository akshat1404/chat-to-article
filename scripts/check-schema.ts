// Fails if the TypeScript block under "## Output schema" in SKILL.md differs from schema.ts.
// schema.ts is the source of truth; SKILL.md embeds a copy because claude.ai only keeps SKILL.md.
// Usage: npm run check-schema            (check)
//        npm run check-schema -- --fix   (copy schema.ts into SKILL.md)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillPath = join(root, "skills/chat-to-article/SKILL.md");
const schemaPath = join(root, "skills/chat-to-article/schema.ts");
const fix = process.argv.includes("--fix");

const skill = readFileSync(skillPath, "utf8").replace(/\r\n/g, "\n");
const schema = readFileSync(schemaPath, "utf8").replace(/\r\n/g, "\n").trim();

const heading = skill.match(/^## Output schema[ \t]*$/m);
if (!heading || heading.index === undefined) {
  console.error('check-schema: SKILL.md has no "## Output schema" section.');
  process.exit(1);
}

const sectionStart = heading.index + heading[0].length;
const block = /^```ts\n([\s\S]*?)\n```/m.exec(skill.slice(sectionStart));
if (!block) {
  console.error('check-schema: no ```ts block found under "## Output schema" in SKILL.md.');
  process.exit(1);
}

const embedded = block[1].trim();
if (embedded === schema) {
  console.log("check-schema: SKILL.md types block matches schema.ts.");
  process.exit(0);
}

if (fix) {
  const start = sectionStart + block.index;
  const updated = skill.slice(0, start) + "```ts\n" + schema + "\n```" + skill.slice(start + block[0].length);
  writeFileSync(skillPath, updated);
  console.log("check-schema: copied schema.ts into SKILL.md.");
  process.exit(0);
}

const a = embedded.split("\n");
const b = schema.split("\n");
const line = a.findIndex((l, i) => l !== b[i]);
const n = line === -1 ? Math.min(a.length, b.length) : line;
console.error("check-schema: SKILL.md types block differs from schema.ts.");
console.error(`  first difference at line ${n + 1} of the block:`);
console.error(`  SKILL.md : ${a[n] ?? "<end of block>"}`);
console.error(`  schema.ts: ${b[n] ?? "<end of file>"}`);
console.error("Run `npm run check-schema -- --fix` to copy schema.ts into SKILL.md.");
process.exit(1);
