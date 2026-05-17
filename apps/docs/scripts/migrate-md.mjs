import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, basename } from "node:path";

const repoRoot = join(import.meta.dirname, "../../..");
const srcRoot = join(repoRoot, "docs");
const destRoot = join(repoRoot, "apps/docs/content/docs");

const skipFiles = new Set([
  "README.md",
  "contributing.md",
  "security.md",
  "deploy.md",
]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (name.endsWith(".md")) files.push(full);
  }
  return files;
}

function linkMap() {
  const map = new Map();
  for (const file of walk(srcRoot)) {
    const rel = relative(srcRoot, file).replace(/\\/g, "/");
    if (skipFiles.has(rel)) continue;
    const slug = rel.replace(/\.md$/, "").replace(/\/index$/, "");
    const route = slug === "index" ? "/docs" : `/docs/${slug}`;
    map.set(rel, route);
    map.set(`docs/${rel}`, route);
    if (rel.endsWith("/index.md")) {
      const dir = rel.replace(/\/index\.md$/, "");
      map.set(`docs/${dir}`, route);
      map.set(`./${dir}`, route);
    }
  }
  return map;
}

const routes = linkMap();

function fixLinks(body, fileRel) {
  let out = body;
  const sorted = [...routes.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    const patterns = [
      new RegExp(`\\]\\(${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "g"),
      new RegExp(`\\]\\(\\./${from.replace(/^docs\//, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "g"),
    ];
    for (const re of patterns) out = out.replace(re, `](${to})`);
  }
  out = out.replace(/\]\(\.\.\/README\.md\)/g, "](https://github.com/Skndan/partha)");
  out = out.replace(/\]\(\.\.\/\.\.\/README\.md\)/g, "](https://github.com/Skndan/partha)");
  out = out.replace(/\]\(\.\/README\.md\)/g, "](/docs)");
  out = out.replace(/`docs\/([^`]+)`/g, (_, p) => {
    const key = p.endsWith(".md") ? p : `${p}.md`;
    const route = routes.get(key) ?? routes.get(`docs/${key}`);
    return route ? `\`${route}\`` : `\`docs/${p}\``;
  });
  return out;
}

function toFrontmatter(title, description) {
  const esc = (s) => s.replace(/"/g, '\\"');
  return `---\ntitle: ${esc(title)}\ndescription: ${esc(description)}\n---\n\n`;
}

for (const file of walk(srcRoot)) {
  const rel = relative(srcRoot, file).replace(/\\/g, "/");
  if (skipFiles.has(rel)) continue;

  const raw = readFileSync(file, "utf8");
  const lines = raw.split("\n");
  let title = basename(rel, ".md");
  let bodyStart = 0;
  if (lines[0]?.startsWith("# ")) {
    title = lines[0].slice(2).trim();
    bodyStart = 1;
    if (lines[1] === "") bodyStart = 2;
  }
  const body = fixLinks(lines.slice(bodyStart).join("\n").trimStart(), rel);
  const description =
    body
      .split("\n")
      .find((l) => l.trim() && !l.startsWith("#") && !l.startsWith("|"))
      ?.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`]/g, "")
      .slice(0, 120)
      .trim() || title;

  const destRel = rel.replace(/\.md$/, ".mdx");
  const dest = join(destRoot, destRel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, toFrontmatter(title, description) + body + "\n");
  console.log("wrote", destRel);
}
