import React, { useState } from 'react';
import { InspectorEvent, SelectorType } from '../types';
import { Copy, Check, Wand2, MousePointer2, Layers, Code2, Lock } from 'lucide-react';

interface Props {
  data: InspectorEvent | null;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isLocked: boolean;
}

const InspectorPanel: React.FC<Props> = ({ data, onAnalyze, isAnalyzing, isLocked }) => {
  const [selectorType, setSelectorType] = useState<SelectorType>('CSS');
  const [copiedSelector, setCopiedSelector] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900">
        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 shadow-sm transform rotate-3">
          <MousePointer2 className="w-10 h-10 text-brand-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-2">Select an Element</h3>
        <p className="text-sm text-slate-500 leading-relaxed max-w-[240px]">
            Hover over any element in the browser view on the left to inspect its properties.
            <br/><br/>
            <span className="font-semibold text-brand-400">Double-click</span> to lock selection.
        </p>
      </div>
    );
  }

  const selectorValue = selectorType === 'CSS' ? data.generatedCss : data.generatedXpath;

  const handleCopySelector = () => {
    navigator.clipboard.writeText(selectorValue);
    setCopiedSelector(true);
    setTimeout(() => setCopiedSelector(false), 2000);
  };

  // Smart Variable Naming Logic
  const generateVariableName = (): string => {
      const { id, name, role, text_content, tag } = data.metadata;
      let base = '';
      
      if (id) base = id;
      else if (name) base = name;
      else if (text_content && text_content.length < 20) base = text_content;
      else if (role) base = role;
      else base = tag;

      // Clean and camelCase
      base = base.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
      const parts = base.split(/\s+/);
      let camel = parts[0].toLowerCase();
      for(let i = 1; i < parts.length; i++) {
          camel += parts[i].charAt(0).toUpperCase() + parts[i].slice(1).toLowerCase();
      }
      
      // Append tag type if generic
      if (!camel.toLowerCase().includes(tag) && !['input', 'button'].includes(tag)) {
           // If it's just "login", make it "loginButton" or "loginInput"
           if (tag === 'button') camel += 'Button';
           else if (tag === 'input') camel += 'Input';
           else if (tag === 'a') camel += 'Link';
      }
      
      return camel;
  };

  const javaSnippet = `@FindBy(${selectorType.toLowerCase()} = "${selectorValue}")
private WebElement ${generateVariableName()};`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(javaSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Panel Header */}
      <div className={`px-5 py-4 border-b border-slate-800 ${isLocked ? 'bg-red-900/20' : 'bg-slate-900'}`}>
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selected Element</span>
                 {isLocked && (
                     <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded-full border border-red-900/50">
                        <Lock className="w-2.5 h-2.5" /> Locked
                     </span>
                 )}
            </div>
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button 
                    onClick={() => setSelectorType('CSS')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${selectorType === 'CSS' ? 'bg-slate-700 text-white shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    CSS
                </button>
                <button 
                    onClick={() => setSelectorType('XPath')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${selectorType === 'XPath' ? 'bg-slate-700 text-white shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    XPath
                </button>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="bg-brand-900/40 text-brand-300 px-2.5 py-1 rounded font-mono text-sm font-bold border border-brand-800 shadow-sm">
                &lt;{data.metadata.tag}&gt;
            </div>
            {data.metadata.id && (
                <div className="text-slate-400 font-mono text-sm">#{data.metadata.id}</div>
            )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        
        {/* Instant Java Code Snippet */}
        <div className="space-y-2">
             <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                Java Page Object Snippet
            </label>
            <div className="relative group">
                <div className="bg-slate-950 text-purple-200 p-3 pr-10 rounded-lg font-mono text-xs leading-relaxed shadow-sm border border-slate-800 whitespace-pre">
                    {javaSnippet}
                </div>
                 <button 
                    onClick={handleCopyCode}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-400 rounded-md hover:bg-slate-700 hover:text-white transition-colors shadow-sm border border-slate-700"
                    title="Copy Java Code"
                >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>

        {/* Raw Locator String */}
        <div className="space-y-2">
             <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-500" />
                Raw Selector
            </label>
            
            <div className="relative group">
                <div className="bg-slate-800 text-slate-200 p-3 pr-10 rounded-lg font-mono text-xs break-all leading-relaxed border border-slate-700">
                    {selectorValue}
                </div>
                <button 
                    onClick={handleCopySelector}
                    className="absolute top-2 right-2 p-1.5 bg-slate-700 text-slate-400 border border-slate-600 rounded-md hover:bg-slate-600 hover:text-brand-400 transition-colors shadow-sm"
                    title="Copy Selector"
                >
                    {copiedSelector ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>

        <div className="border-t border-slate-800 my-4"></div>

        {/* Metadata Grid */}
        <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3">Attributes</h4>
            
            <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start justify-between p-2 bg-slate-800/50 rounded border border-slate-800">
                    <span className="text-xs font-medium text-slate-500">ID</span>
                    <span className="text-xs font-mono text-slate-300 max-w-[180px] truncate bg-slate-900 px-1 rounded border border-slate-700">
                        {data.metadata.id || '—'}
                    </span>
                </div>
                <div className="flex items-start justify-between p-2 bg-slate-800/50 rounded border border-slate-800">
                    <span className="text-xs font-medium text-slate-500">Role</span>
                    <span className="text-xs font-mono text-slate-300 bg-slate-900 px-1 rounded border border-slate-700">
                        {data.metadata.role || '—'}
                    </span>
                </div>
                <div className="flex flex-col gap-1 p-2 bg-slate-800/50 rounded border border-slate-800">
                    <span className="text-xs font-medium text-slate-500">Classes</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {data.metadata.classes && data.metadata.classes.length > 0 ? (
                            data.metadata.classes.map((cls, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded text-[10px] font-mono border border-slate-700">.{cls}</span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-600 italic">No classes</span>
                        )}
                    </div>
                </div>
            </div>

            {data.metadata.text_content && (
                <div className="space-y-1 mt-2">
                    <span className="text-xs font-medium text-slate-500 pl-1">Inner Text</span>
                    <div className="p-3 bg-slate-800/50 border border-slate-800 rounded text-xs text-slate-400 italic leading-relaxed">
                        "{data.metadata.text_content}"
                    </div>
                </div>
            )}

            {Object.keys(data.metadata.data_attributes || {}).length > 0 && (
                <div className="space-y-2 mt-2">
                     <span className="text-xs font-medium text-slate-500 pl-1">Data Attributes</span>
                     <div className="bg-slate-800/50 rounded border border-slate-800 divide-y divide-slate-800">
                        {Object.entries(data.metadata.data_attributes || {}).map(([key, val]) => (
                             <div key={key} className="flex justify-between p-2 text-xs">
                                <span className="font-mono text-purple-400 font-medium">{key}</span>
                                <span className="font-mono text-slate-400 truncate max-w-[120px]">{val}</span>
                             </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="group w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-brand-600 text-white rounded-lg shadow-md hover:shadow-lg text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed border border-slate-700 hover:border-brand-500"
        >
            {isAnalyzing ? (
                <Wand2 className="w-4 h-4 animate-spin" />
            ) : (
                <Wand2 className="w-4 h-4 text-brand-400 group-hover:text-white transition-colors" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Deep Analysis with Gemini'}
        </button>
      </div>
    </div>
  );
};

export default InspectorPanel;