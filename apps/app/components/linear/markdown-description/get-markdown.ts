import type { Editor } from "@tiptap/core";

export function getMarkdown(editor: Editor | null): string {
  if (!editor) return "";
  const storage = editor.storage as unknown as {
    markdown?: { getMarkdown?: () => string };
  };
  return storage.markdown?.getMarkdown?.() ?? "";
}
