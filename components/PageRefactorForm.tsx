import React, { useState } from 'react';
import { AnalysisMode, PageRefactorPayload } from '../types';
import { FileCode } from 'lucide-react';

interface Props {
  onAnalyze: (payload: PageRefactorPayload) => void;
  isLoading: boolean;
}

const PageRefactorForm: React.FC<Props> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('https://example.com/dashboard');
  const [html, setHtml] = useState(`
<div id="app">
  <header>
    <nav>
       <a href="/home">Home</a>
       <a href="/settings">Settings</a>
    </nav>
  </header>
  <main>
    <form id="user-form">
      <input type="text" name="username" />
      <input type="password" name="password" />
      <button type="submit" class="btn-primary">Login</button>
    </form>
  </main>
</div>
  `.trim());
  const [framework, setFramework] = useState('selenium-java');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PageRefactorPayload = {
      MODE: AnalysisMode.PAGE_REFACTOR,
      PAGE_URL: url,
      PAGE_HTML: html,
      FRAMEWORK: framework
    };
    onAnalyze(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <label className="block text-sm font-medium text-slate-400 mb-1">Framework</label>
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
          className="w-full rounded-md border-slate-700 bg-slate-800 text-slate-200 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none sm:text-sm p-2 border"
        >
          <option value="selenium-java">Selenium Java</option>
          <option value="playwright-java">Playwright Java</option>
          <option value="playwright-ts">Playwright TypeScript</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            <span>Full Page / Component HTML</span>
          </div>
        </label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={12}
          className="w-full font-mono text-xs rounded-md border-slate-700 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none p-2 border bg-slate-950 text-slate-300"
          placeholder="Paste the full HTML structure of the component or page here..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Refactor Page' : 'Analyze & Refactor'}
      </button>
    </form>
  );
};

export default PageRefactorForm;