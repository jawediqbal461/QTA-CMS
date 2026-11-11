import React from "react";

// Small, dependency-free renderer for the subset of Markdown the blog editor produces.
// It builds React elements (never raw HTML), so article content cannot inject markup.

function safeUrl(url: string) {
  return /^(https?:\/\/|\/|mailto:)/i.test(url) ? url : "#";
}

function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${index++}`;
    if (match[1]) nodes.push(<img key={key} src={safeUrl(match[3])} alt={match[2]} className="my-3 max-w-full rounded-xl" />);
    else if (match[4]) nodes.push(<a key={key} href={safeUrl(match[6])} className="text-emerald-400 underline" target="_blank" rel="noopener noreferrer">{match[5]}</a>);
    else if (match[7]) nodes.push(<strong key={key} className="font-bold text-white">{match[8]}</strong>);
    else nodes.push(<em key={key}>{match[10]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className={`space-y-4 leading-relaxed ${className}`}>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        if (block.startsWith("### ")) return <h3 key={key} className="pt-2 text-base font-bold text-neutral-100">{inline(block.slice(4), key)}</h3>;
        if (block.startsWith("## ")) return <h2 key={key} className="border-b border-neutral-800 pb-1 pt-3 text-lg font-bold text-white">{inline(block.slice(3), key)}</h2>;
        if (block.startsWith("> ")) return <blockquote key={key} className="border-l-4 border-emerald-500 pl-4 italic text-neutral-400">{inline(block.replace(/^>\s?/gm, ""), key)}</blockquote>;
        if (block.startsWith("```")) {
          const code = block.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "");
          return <pre key={key} className="overflow-x-auto rounded-lg bg-neutral-950 p-3 font-mono text-xs text-emerald-400"><code>{code}</code></pre>;
        }
        const lines = block.split("\n");
        if (lines.every((line) => /^[-*]\s+/.test(line))) {
          return <ul key={key} className="list-disc space-y-1 pl-5">{lines.map((line, j) => <li key={j}>{inline(line.replace(/^[-*]\s+/, ""), `${key}-${j}`)}</li>)}</ul>;
        }
        if (lines.every((line) => /^\d+\.\s+/.test(line))) {
          return <ol key={key} className="list-decimal space-y-1 pl-5">{lines.map((line, j) => <li key={j}>{inline(line.replace(/^\d+\.\s+/, ""), `${key}-${j}`)}</li>)}</ol>;
        }
        return <p key={key}>{lines.map((line, j) => <React.Fragment key={j}>{j > 0 && <br />}{inline(line, `${key}-${j}`)}</React.Fragment>)}</p>;
      })}
    </div>
  );
}
