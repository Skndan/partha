import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "../content/docs");

function yamlQuote(s) {
  const cleaned = s.replace(/"/g, '\\"').replace(/\s+/g, " ").trim();
  return `"${cleaned}"`;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (name.endsWith(".mdx")) files.push(full);
  }
  return files;
}

for (const file of walk(root)) {
  const raw = readFileSync(file, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
  if (!match) continue;
  const body = match[2];
  const fm = match[1];
  const titleM = fm.match(/^title:\s*(.+)$/m);
  const descM = fm.match(/^description:\s*(.+)$/m);
  if (!titleM || !descM) continue;
  const title = titleM[1].replace(/^["']|["']$/g, "");
  const description = descM[1].replace(/^["']|["']$/g, "");
  const fixed = `---\ntitle: ${yamlQuote(title)}\ndescription: ${yamlQuote(description)}\n---\n\n${body}`;
  if (fixed !== raw) {
    writeFileSync(file, fixed);
    console.log("fixed fm", file);
  }
}
