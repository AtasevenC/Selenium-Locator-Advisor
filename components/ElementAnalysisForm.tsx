import React, { useState, useEffect } from 'react';
import { AnalysisMode, ElementAnalysisPayload, ElementMetadata } from '../types';
import { Code, MousePointer2, Plus, Trash2 } from 'lucide-react';

interface Props {
  onAnalyze: (payload: ElementAnalysisPayload) => void;
  isLoading: boolean;
}

const ElementAnalysisForm: React.FC<Props> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('https://example.com/login');
  const [intent, setIntent] = useState('Login Button');
  const [html, setHtml] = useState('<button class="btn btn-primary" id="submit-login">Log In</button>');
  const [currentXpath, setCurrentXpath] = useState('//div[3]/button');
  const [currentCss, setCurrentCss] = useState('button.btn.btn-primary');
  
  // Metadata state
  const [tagName, setTagName] = useState('button');
  const [elemId, setElemId] = useState('submit-login');
  const [classes, setClasses] = useState('btn btn-primary');
  const [textContent, setTextContent] = useState('Log In');
  const [role, setRole] = useState('button');
  const [dataAttrs, setDataAttrs] = useState<{key: string, value: string}[]>([]);

  // Auto-extract metadata from HTML when it changes (simple regex based extraction for UX convenience)
  useEffect(() => {
    // Very basic parsing just to help the user fill the form
    const tagMatch = html.match(/^<([a-z0-9-]+)/i);
    if (tagMatch) setTagName(tagMatch[1]);

    const idMatch = html.match(/id="([^"]+)"/);
    if (idMatch) setElemId(idMatch[1]);

    const classMatch = html.match(/class="([^"]+)"/);
    if (classMatch) setClasses(classMatch[1]);
    
    const textMatch = html.match(/>([^<]+)</);
    if (textMatch) setTextContent(textMatch[1].trim());

  }, [html]);

  const handleAddDataAttr = () => {
    setDataAttrs([...dataAttrs, { key: 'data-testid', value: '' }]);
  };

  const handleRemoveDataAttr = (index: number) => {
    const newAttrs = [...dataAttrs];
    newAttrs.splice(index, 1);
    setDataAttrs(newAttrs);
  };

  const handleDataAttrChange = (index: number, field: 'key' | 'value', val: string) => {
    const newAttrs = [...dataAttrs];
    newAttrs[index][field] = val;
    setDataAttrs(newAttrs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataAttributesRecord: Record<string, string> = {};
    dataAttrs.forEach(attr => {
      if (attr.key && attr.value) dataAttributesRecord[attr.key] = attr.value;
    });

    const metadata: ElementMetadata = {
      tag: tagName,
      id: elemId,
      classes: classes.split(' ').filter(c => c.trim().length > 0),
      text_content: textContent,
      role: role,
      data_attributes: dataAttributesRecord,
      dom_path: currentCss
    };

    const payload: ElementAnalysisPayload = {
      MODE: AnalysisMode.ELEMENT_ANALYSIS,
      PAGE_URL: url,
      ELEMENT_HTML: html,
      ELEMENT_METADATA: metadata,
      CURRENT_LOCATORS: {
        xpath: currentXpath,
        css: currentCss
      },
      INTENT: intent
    };

    onAnalyze(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Page URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-md border-slate-700 bg-slate-800 text-slate-200 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Element Intent (Description)</label>
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="e.g. Primary Login Button"
            className="w-full rounded-md border-slate-700 bg-slate-800 text-slate-200 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm p-2 border"
          />
        </div>
      </div>

      {/* HTML Input */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            <span>Element Outer HTML</span>
          </div>
        </label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={3}
          className="w-full font-mono text-xs rounded-md border-slate-700 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none p-2 border bg-slate-950 text-slate-300"
        />
      </div>

      {/* Metadata Section */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <MousePointer2 className="w-4 h-4" />
          Element Metadata
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500">Tag</label>
            <input type="text" value={tagName} onChange={e => setTagName(e.target.value)} className="w-full text-sm bg-transparent border-b border-slate-700 text-slate-300 focus:border-brand-500 outline-none py-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">ID</label>
            <input type="text" value={elemId} onChange={e => setElemId(e.target.value)} className="w-full text-sm bg-transparent border-b border-slate-700 text-slate-300 focus:border-brand-500 outline-none py-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Role</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full text-sm bg-transparent border-b border-slate-700 text-slate-300 focus:border-brand-500 outline-none py-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Text Content</label>
            <input type="text" value={textContent} onChange={e => setTextContent(e.target.value)} className="w-full text-sm bg-transparent border-b border-slate-700 text-slate-300 focus:border-brand-500 outline-none py-1" />
          </div>
        </div>

        <div className="mb-4">
            <label className="block text-xs text-slate-500">Classes</label>
            <input type="text" value={classes} onChange={e => setClasses(e.target.value)} className="w-full text-sm bg-transparent border-b border-slate-700 text-slate-300 focus:border-brand-500 outline-none py-1" />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-400">Data Attributes</label>
          {dataAttrs.map((attr, idx) => (
            <div key={idx} className="flex gap-2">
              <input 
                placeholder="Attribute (e.g. data-testid)" 
                value={attr.key} 
                onChange={e => handleDataAttrChange(idx, 'key', e.target.value)} 
                className="flex-1 text-xs border border-slate-700 bg-slate-800 text-slate-300 rounded p-1" 
              />
              <input 
                placeholder="Value" 
                value={attr.value} 
                onChange={e => handleDataAttrChange(idx, 'value', e.target.value)} 
                className="flex-1 text-xs border border-slate-700 bg-slate-800 text-slate-300 rounded p-1" 
              />
              <button type="button" onClick={() => handleRemoveDataAttr(idx)} className="text-red-500 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddDataAttr} className="text-xs flex items-center text-brand-400 hover:text-brand-300 font-medium">
            <Plus className="w-3 h-3 mr-1" /> Add Attribute
          </button>
        </div>
      </div>

      {/* Current Locators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Current CSS (Optional)</label>
          <input
            type="text"
            value={currentCss}
            onChange={(e) => setCurrentCss(e.target.value)}
            className="w-full rounded-md border-slate-700 bg-slate-800 text-slate-200 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Current XPath (Optional)</label>
          <input
            type="text"
            value={currentXpath}
            onChange={(e) => setCurrentXpath(e.target.value)}
            className="w-full rounded-md border-slate-700 bg-slate-800 text-slate-200 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm p-2 border"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Element'}
      </button>
    </form>
  );
};

export default ElementAnalysisForm;