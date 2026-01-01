"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CodePreviewProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodePreview({
  code,
  language = "typescript",
  filename,
  className,
}: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border bg-zinc-950 dark:bg-zinc-900/50 text-zinc-50 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      {filename && (
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400">{filename}</span>
        </div>
      )}
      <div className="relative group">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="ghost"
          className={cn(
            "absolute top-3 right-3 h-7 px-2.5 text-xs font-medium bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all opacity-0 group-hover:opacity-100",
            copied && "text-green-400 opacity-100"
          )}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed font-mono">
          <code className={cn(`language-${language}`)}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
