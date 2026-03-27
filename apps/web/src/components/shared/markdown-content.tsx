import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  children: string;
  className?: string;
};

const markdownComponents: Components = {
  table: ({ className, ...props }) => (
    <div className="my-6 overflow-x-auto">
      <table
        className={cn("w-full min-w-max border-collapse text-sm", className)}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border border-border bg-background px-3 py-2 text-left font-semibold text-text",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn("border border-border px-3 py-2 align-top", className)}
      {...props}
    />
  ),
};

export function MarkdownContent({ children, className }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      className={className}
      components={markdownComponents}
      remarkPlugins={[remarkGfm]}
    >
      {children}
    </ReactMarkdown>
  );
}
