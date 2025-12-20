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
        "relative rounded-lg overflow-hidden border bg-card text-card-foreground",
        className
      )}
    >
      {filename && (
        <div className="px-4 py-2 border-b bg-muted">
          <span className="text-sm text-muted-foreground">{filename}</span>
        </div>
      )}
      <div className="relative">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2 h-8 px-3"
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
        <pre className="p-4 overflow-x-auto bg-background/50">
          <code className={cn(`language-${language}`, "text-sm font-mono")}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
