import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface Props {
  markdown: string;
}

const ResultDisplay: React.FC<Props> = ({ markdown }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!markdown) {
    return (
      <div className="h-full flex items-center justify-center text-slate-600 flex-col p-8 text-center">
        <div className="w-16 h-16 border-2 border-slate-800 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-slate-800 rounded-full"></div>
        </div>
        <p className="text-lg font-medium text-slate-400">Ready to analyze</p>
        <p className="text-sm mt-2 text-slate-600">Enter element details or page HTML on the left to generate locators.</p>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-900 rounded-lg shadow-sm border border-slate-800 overflow-hidden">
       <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors border border-slate-700"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-8 overflow-auto max-h-[calc(100vh-8rem)] prose prose-invert prose-sm max-w-none">
        <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
                table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-4 border border-slate-700 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-700" {...props} />
                    </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-slate-800" {...props} />,
                th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider" {...props} />,
                td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 border-t border-slate-800" {...props} />,
                code: ({node, className, children, ...props}) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return !className ? (
                        <code className="bg-slate-800 text-brand-400 px-1 py-0.5 rounded font-mono text-xs border border-slate-700" {...props}>
                            {children}
                        </code>
                    ) : (
                        <code className={`${className} block bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-slate-800 shadow-inner`} {...props}>
                            {children}
                        </code>
                    )
                },
                pre: ({node, ...props}) => <pre className="not-prose my-4" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-100 border-b border-slate-800 pb-2 mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-slate-200 mt-6 mb-3" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 text-slate-400 my-2" {...props} />,
            }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ResultDisplay;