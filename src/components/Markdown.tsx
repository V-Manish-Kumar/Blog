"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  // Split content by code blocks to avoid parsing inside pre/code
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-zinc-200 leading-relaxed text-[15px] space-y-4 font-sans">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "text";
          const code = match ? match[2] : part.slice(3, -3);
          return <CodeBlock key={index} code={code.trim()} language={lang} />;
        } else {
          return <RichText key={index} text={part} />;
        }
      })}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-900 text-zinc-100 font-mono text-xs shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 text-[10px] text-slate-400 font-semibold select-none">
        <span>{language.toUpperCase() || "CODE"}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-450" />
              <span className="text-emerald-450">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto leading-relaxed scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  const parsedBlocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const pushList = () => {
    if (listItems.length > 0) {
      if (listType === "ul") {
        parsedBlocks.push(
          <ul key={`ul-${parsedBlocks.length}`} className="list-disc pl-6 my-3 space-y-1">
            {listItems.map((li, idx) => (
              <li key={idx}>{parseInline(li)}</li>
            ))}
          </ul>
        );
      } else if (listType === "ol") {
        parsedBlocks.push(
          <ol key={`ol-${parsedBlocks.length}`} className="list-decimal pl-6 my-3 space-y-1">
            {listItems.map((li, idx) => (
              <li key={idx}>{parseInline(li)}</li>
            ))}
          </ol>
        );
      }
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      pushList();
      const textVal = line.slice(4).replace(/\*\*|\*|`/g, "").trim();
      const id = textVal.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
      parsedBlocks.push(
        <h3 key={i} id={id} className="text-base font-bold text-slate-800 dark:text-zinc-100 mt-6 mb-2 scroll-mt-20">
          {parseInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      pushList();
      const textVal = line.slice(3).replace(/\*\*|\*|`/g, "").trim();
      const id = textVal.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
      parsedBlocks.push(
        <h2 key={i} id={id} className="text-lg font-bold text-slate-900 dark:text-zinc-50 mt-8 mb-3 border-b pb-1 dark:border-zinc-800 scroll-mt-20">
          {parseInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      pushList();
      const textVal = line.slice(2).replace(/\*\*|\*|`/g, "").trim();
      const id = textVal.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
      parsedBlocks.push(
        <h1 key={i} id={id} className="text-xl font-extrabold text-slate-900 dark:text-zinc-50 mt-8 mb-4 scroll-mt-20">
          {parseInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (listType !== "ul") {
        pushList();
        listType = "ul";
      }
      listItems.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      if (listType !== "ol") {
        pushList();
        listType = "ol";
      }
      const itemText = line.replace(/^\d+\.\s/, "");
      listItems.push(itemText);
    } else if (line.startsWith("> ")) {
      pushList();
      parsedBlocks.push(
        <blockquote key={i} className="border-l-4 border-indigo-500 pl-4 py-1 my-4 bg-slate-50 dark:bg-zinc-900/50 text-slate-600 dark:text-zinc-405 italic rounded-r-md">
          {parseInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.trim() === "") {
      pushList();
    } else {
      pushList();
      parsedBlocks.push(
        <p key={i} className="my-2.5">
          {parseInline(line)}
        </p>
      );
    }
  }
  pushList();

  return <>{parsedBlocks}</>;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let keyIdx = 0;

  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  const matches = text.split(regex);

  matches.forEach((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      parts.push(<strong key={keyIdx++} className="font-bold">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("*") && part.endsWith("*")) {
      parts.push(<em key={keyIdx++} className="italic">{part.slice(1, -1)}</em>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      parts.push(
        <code key={keyIdx++} className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border dark:border-zinc-700/60">
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith("[") && part.includes("](")) {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        parts.push(
          <a
            key={keyIdx++}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            {linkText}
          </a>
        );
      } else {
        parts.push(part);
      }
    } else {
      parts.push(part);
    }
  });

  return parts;
}
