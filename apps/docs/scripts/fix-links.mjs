import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "../content/docs");

const replacements = [
  [/\]\(\.\/scopes\.md\)/g, "](/docs/mcp/scopes)"],
  [/\]\(\.\/dev-tokens\.md\)/g, "](/docs/mcp/dev-tokens)"],
  [/\]\(\.\/oauth\.md\)/g, "](/docs/mcp/oauth)"],
  [/\]\(\.\/tools-reference\.md\)/g, "](/docs/mcp/tools-reference)"],
  [/\]\(\.\/pagination\.md\)/g, "](/docs/mcp/pagination)"],
  [/\]\(\.\/clients\/cursor\.md\)/g, "](/docs/mcp/clients/cursor)"],
  [/\]\(\.\/clients\/claude\.md\)/g, "](/docs/mcp/clients/claude)"],
  [/\]\(\.\/clients\/openclaw\.md\)/g, "](/docs/mcp/clients/openclaw)"],
  [/\]\(\.\/clients\/stdio\.md\)/g, "](/docs/mcp/clients/stdio)"],
  [/\]\(\.\.\/oauth\.md\)/g, "](/docs/mcp/oauth)"],
  [/\]\(\.\.\/dev-tokens\.md\)/g, "](/docs/mcp/dev-tokens)"],
  [/\]\(\.\.\/scopes\.md\)/g, "](/docs/mcp/scopes)"],
  [/\]\(\.\.\/mcp\/scopes\.md\)/g, "](/docs/mcp/scopes)"],
  [/\]\(\.\/workspaces\.md\)/g, "](/docs/concepts/workspaces)"],
  [/\]\(\.\/teams\.md\)/g, "](/docs/concepts/teams)"],
  [/\]\(\.\/projects\.md\)/g, "](/docs/concepts/projects)"],
  [/\]\(\.\/milestones\.md\)/g, "](/docs/concepts/milestones)"],
  [/\]\(\.\/sprints\.md\)/g, "](/docs/concepts/sprints)"],
  [/\]\(\.\/issues\.md\)/g, "](/docs/concepts/issues)"],
  [/\]\(\.\.\/automations\/auto-changelog\.md\)/g, "](/docs/automations/auto-changelog)"],
  [/\]\(\.\.\/integrations\/github\.md\)/g, "](/docs/integrations/github)"],
  [/\]\(\.\/deploy\.md\)/g, "](https://github.com/Skndan/partha/blob/main/docs/deploy.md)"],
  [/\]\(\.\.\/security\.md\)/g, "](https://github.com/Skndan/partha/blob/main/docs/security.md)"],
  [/\]\(\.\.\/mcp\/clients\/cursor\.md\)/g, "](/docs/mcp/clients/cursor)"],
  [/\[`[^`]*\.md`\]\([^)]+\)/g, (m) => m], // skip
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (name.endsWith(".mdx")) files.push(full);
  }
  return files;
}

for (const file of walk(root)) {
  let content = readFileSync(file, "utf8");
  const before = content;
  for (const [re, rep] of replacements) {
    content = content.replace(re, rep);
  }
  if (content !== before) {
    writeFileSync(file, content);
    console.log("fixed", file);
  }
}
