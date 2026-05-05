import { cn } from "@/lib/utils";

/** Prose/read typography applied to the TipTap root (matches issue description editor). */
export function markdownDescriptionMirrorTypographyClassNames() {
  return cn(
    "[&_.ProseMirror]:max-w-none",
    "[&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_strong]:text-foreground",
    "[&_.ProseMirror_b]:font-semibold",
    "[&_.ProseMirror_em]:italic [&_.ProseMirror_i]:italic",
    "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-2",
    "[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:tracking-tight [&_.ProseMirror_h1]:mt-4 [&_.ProseMirror_h1]:mb-2 [&_.ProseMirror_h1]:first:mt-0",
    "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:tracking-tight [&_.ProseMirror_h2]:mt-3 [&_.ProseMirror_h2]:mb-2",
    "[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1.5",
    "[&_.ProseMirror_h4]:text-base [&_.ProseMirror_h4]:font-semibold [&_.ProseMirror_h4]:mt-2 [&_.ProseMirror_h4]:mb-1",
    "[&_.ProseMirror_blockquote]:text-muted-foreground",
    "[&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:border [&_.ProseMirror_pre]:border-border [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3",
    "[&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0 [&_.ProseMirror_pre_code]:text-sm",
    "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1",
    "[&_.ProseMirror_li]:my-0.5 [&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_ul[data-type='taskList']]:pl-1 [&_.ProseMirror_li[data-checked]]:flex [&_.ProseMirror_li[data-checked]]:gap-2",
  );
}

/** Inner ProseMirror surface for editable fields (placeholder + min height). */
export function markdownDescriptionEditableProseClassNames() {
  return cn(
    "min-h-[96px] max-w-none outline-none",
    "[&_p.is-empty:first-child]:before:pointer-events-none [&_p.is-empty:first-child]:before:float-left [&_p.is-empty:first-child]:before:h-0 [&_p.is-empty:first-child]:before:text-muted-foreground [&_p.is-empty:first-child]:before:content-[attr(data-placeholder)]",
  );
}
