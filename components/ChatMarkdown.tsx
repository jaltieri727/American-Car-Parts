import React from 'react';
import Markdown from 'react-markdown';

export function ChatMarkdown({ text, onSearch }: { text: string; onSearch: (term: string) => void }) {
  // Convert the assistant's search shorthand before parsing, preserving surrounding Markdown.
  const content = text.replace(/\[Search:\s*([^\]\n]+)\]/g, (_, term: string) =>
    `[Search: ${term.replace(/[\\[\]]/g, '')}](https://crankover.com/shop?copilotSearch=${encodeURIComponent(term.trim())})`);
  return <div className="break-words space-y-2">
    <Markdown skipHtml components={{
      p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
      ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
      h1: ({ children }) => <h3 className="font-bold text-base">{children}</h3>,
      h2: ({ children }) => <h3 className="font-bold text-base">{children}</h3>,
      h3: ({ children }) => <h3 className="font-bold">{children}</h3>,
      code: ({ children }) => <code className="bg-gray-100 rounded px-1 text-xs">{children}</code>,
      pre: ({ children }) => <pre className="overflow-x-auto rounded bg-gray-100 p-2 text-xs">{children}</pre>,
      blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-3">{children}</blockquote>,
      img: () => null,
      a: ({ href, children }) => {
        if (href?.startsWith('https://crankover.com/shop?copilotSearch=')) {
          const term = new URL(href).searchParams.get('copilotSearch') || '';
          return <button type="button" onClick={() => onSearch(term)} className="inline-flex bg-brand-dark text-white px-2 py-1 rounded text-xs font-bold mt-2 mb-1 hover:bg-brand-red">{children}</button>;
        }
        return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-brand-red">{children}</a> : <span>{children}</span>;
      },
    }}>{content}</Markdown>
  </div>;
}
