import React, { useState, useEffect } from 'react';
import { InspectorEvent, SelectorType, PageObjectElement } from '../types';
import { Copy, Check, Wand2, MousePointer2, Layers, Code2, Lock, FileCode2 } from 'lucide-react';

interface Props {
  data: InspectorEvent | null;
  scannedElements?: PageObjectElement[];
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isLocked: boolean;
}

const InspectorPanel: React.FC<Props> = ({ data, scannedElements = [], onAnalyze, isAnalyzing, isLocked }) => {
  const [selectorType, setSelectorType] = useState<SelectorType>('CSS');
  const [viewMode, setViewMode] = useState<'SINGLE' | 'FULL_PAGE'>('SINGLE');
  const [copiedSelector, setCopiedSelector] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFullPage, setCopiedFullPage] = useState(false);

  // Automatically switch to Full Page view if scan results arrive and no single element is locked
  useEffect(() => {
    if (scannedElements.length > 0 && !isLocked) {
      setViewMode('FULL_PAGE');
    } else if (data) {
      setViewMode('SINGLE');
    }
  }, [scannedElements, data, isLocked]);

  // Helper to generate variable names (reused for both single and bulk)
  const generateVariableName = (metadata: any, tag?: string): string => {
      const { id, name, role, text_content } = metadata;
      const tagName = tag || metadata.tag;
      let base = '';
      
      if (id) base = id;
      else if (name) base = name;
      else if (text_content && text_content.length < 20) base = text_content;
      else if (role) base = role;
      else base = tagName;

      // Clean and camelCase
      base = base.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
      const parts = base.split(/\s+/);
      let camel = parts[0].toLowerCase();
      for(let i = 1; i < parts.length; i++) {
          camel += parts[i].charAt(0).toUpperCase() + parts[i].slice(1).toLowerCase();
      }
      
      // Append tag type if generic and not already included
      if (!camel.toLowerCase().includes(tagName) && !['input', 'button'].includes(tagName)) {
           if (tagName === 'button') camel += 'Button';
           else if (tagName === 'input') camel += 'Input';
           else if (tagName === 'a') camel += 'Link';
           else if (tagName === 'select') camel += 'Dropdown';
           else if (tagName === 'textarea') camel += 'Field';
      }
      
      return camel || `element${Math.floor(Math.random() * 1000)}`;
  };

  // --- View 1: Single Element (Existing Logic) ---
  const renderSingleElementView = () => {
    if (!data) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 shadow-sm transform rotate-3">
                    <MousePointer2 className="w-10 h-10 text-brand-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">Select an Element</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[240px]">
                    Hover over any element in the browser view.
                    <br/><br/>
                    <span className="font-semibold text-brand-400">Double-click</span> to lock selection.
                </p>
            </div>
        );
    }

    const selectorValue = selectorType === 'CSS' ? data.generatedCss : data.generatedXpath;
    const javaSnippet = `@FindBy(${selectorType.toLowerCase()} = "${selectorValue}")
private WebElement ${generateVariableName(data.metadata)};`;

    const handleCopySelector = () => {
        navigator.clipboard.writeText(selectorValue);
        setCopiedSelector(true);
        setTimeout(() => setCopiedSelector(false), 2000);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(javaSnippet);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    return (
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
             {/* Instant Java Code Snippet */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-purple-400" />
                    Java Page Object Snippet
                </label>
                <div className="relative group">
                    <div className="bg-slate-950 text-purple-200 p-3 pr-10 rounded-lg font-mono text-xs leading-relaxed shadow-sm border border-slate-800 whitespace-pre overflow-x-auto">
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
            </div>
        </div>
    );
  };

  // --- View 2: Full Page Object ---
  const renderFullPageView = () => {
      if (scannedElements.length === 0) {
          return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                    <FileCode2 className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">No elements scanned yet.</p>
                <p className="text-xs text-slate-600 mt-2">Click "Scan Page" in the browser toolbar.</p>
            </div>
          );
      }

      const generateFullPageCode = () => {
          const usedNames = new Set<string>();
          const lines: string[] = [];

          lines.push(`public class GeneratedPage {`);
          lines.push(``);
          lines.push(`    private WebDriver driver;`);
          lines.push(``);

          scannedElements.forEach(el => {
              let varName = generateVariableName(el.metadata);
              
              // Handle duplicates
              if (usedNames.has(varName)) {
                  let counter = 1;
                  while (usedNames.has(`${varName}${counter}`)) {
                      counter++;
                  }
                  varName = `${varName}${counter}`;
              }
              usedNames.add(varName);

              // Priority: ID > XPath (usually cleaner for text) > CSS
              let locatorStrategy = '';
              let locatorValue = '';

              if (el.metadata.id) {
                  locatorStrategy = 'id';
                  locatorValue = el.metadata.id;
              } else if (el.metadata.name) {
                  locatorStrategy = 'name';
                  locatorValue = el.metadata.name;
              } else {
                  // Fallback
                  locatorStrategy = 'css';
                  locatorValue = el.generatedCss;
              }

              lines.push(`    @FindBy(${locatorStrategy} = "${locatorValue}")`);
              lines.push(`    private WebElement ${varName};`);
              lines.push(``);
          });

          lines.push(`    public GeneratedPage(WebDriver driver) {`);
          lines.push(`        this.driver = driver;`);
          lines.push(`        PageFactory.initElements(driver, this);`);
          lines.push(`    }`);
          lines.push(`}`);

          return lines.join('\n');
      };

      const fullCode = generateFullPageCode();

      const handleCopyFull = () => {
        navigator.clipboard.writeText(fullCode);
        setCopiedFullPage(true);
        setTimeout(() => setCopiedFullPage(false), 2000);
      };

      return (
        <div className="flex-1 flex flex-col overflow-hidden p-0">
            <div className="flex justify-between items-center px-4 py-2 bg-slate-800/30 border-b border-slate-800">
                <span className="text-xs font-medium text-slate-400">
                    Found {scannedElements.length} interactive elements
                </span>
                <button 
                    onClick={handleCopyFull}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors"
                >
                    {copiedFullPage ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy Class
                </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-950">
                <pre className="text-[10px] font-mono text-slate-300 whitespace-pre font-medium">
                    {fullCode}
                </pre>
            </div>
        </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Panel Header */}
      <div className={`px-5 py-4 border-b border-slate-800 ${isLocked ? 'bg-red-900/20' : 'bg-slate-900'}`}>
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inspector</span>
                 {isLocked && (
                     <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded-full border border-red-900/50">
                        <Lock className="w-2.5 h-2.5" /> Locked
                     </span>
                 )}
            </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800 mb-2">
            <button
                onClick={() => setViewMode('SINGLE')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded transition-all ${viewMode === 'SINGLE' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <MousePointer2 className="w-3 h-3" />
                Single Element
            </button>
            <button
                onClick={() => setViewMode('FULL_PAGE')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded transition-all ${viewMode === 'FULL_PAGE' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <FileCode2 className="w-3 h-3" />
                Page Object
            </button>
        </div>

        {/* Sub-controls for Single View */}
        {viewMode === 'SINGLE' && data && (
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                     <div className="bg-brand-900/40 text-brand-300 px-2 py-0.5 rounded font-mono text-xs font-bold border border-brand-800 shadow-sm">
                        &lt;{data.metadata.tag}&gt;
                    </div>
                    {data.metadata.id && (
                        <div className="text-slate-400 font-mono text-xs">#{data.metadata.id}</div>
                    )}
                </div>
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                    <button 
                        onClick={() => setSelectorType('CSS')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${selectorType === 'CSS' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        CSS
                    </button>
                    <button 
                        onClick={() => setSelectorType('XPath')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${selectorType === 'XPath' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        XPath
                    </button>
                </div>
            </div>
        )}
      </div>
      
      {viewMode === 'SINGLE' ? renderSingleElementView() : renderFullPageView()}

      {viewMode === 'SINGLE' && data && (
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
      )}
    </div>
  );
};

export default InspectorPanel;