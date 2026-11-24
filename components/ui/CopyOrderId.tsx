"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyOrderIdProps {
  id: string;
  maxWidth?: string;
  className?: string;
}

export function CopyOrderId({
  id,
  maxWidth = "max-w-[120px] sm:max-w-[200px]",
  className = "",
}: CopyOrderIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 min-w-0 max-w-full ${className}`}>
      <span
        className={`font-mono text-xs text-zinc-500 truncate inline-block ${maxWidth}`}
        title={`#${id}`}
      >
        #{id}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 cursor-pointer"
        title={copied ? "Copied!" : "Copy order ID"}
        aria-label="Copy order ID"
      >
        {copied ? (
          <Check size={12} className="text-green-600 animate-in zoom-in-50 duration-200" />
        ) : (
          <Copy size={12} />
        )}
      </button>
    </div>
  );
}
