import React, { useState, useEffect } from 'react';
import { Target, LayoutTemplate, Search, Globe, ChevronRight } from 'lucide-react';
import ElementAnalysisForm from './components/ElementAnalysisForm';
import PageRefactorForm from './components/PageRefactorForm';
import ResultDisplay from './components/ResultDisplay';
import LiveBrowser from './components/LiveBrowser';
import InspectorPanel from './components/InspectorPanel';
import { AdvisorPayload, AnalysisMode, InspectorEvent, ElementAnalysisPayload } from './types';
import { generateAnalysis } from './services/geminiService';

function App() {
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.LIVE_INSPECTOR);
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Live Inspector State
  const [inspectorData, setInspectorData] = useState<InspectorEvent | null>(null);
  const [currentInspectorUrl, setCurrentInspectorUrl] = useState('https://example.com');
  const [isInspectorLocked, setIsInspectorLocked] = useState(false);

  const handleAnalyze = async (payload: AdvisorPayload) => {
    setIsLoading(true);
    setError(null);
    setResult('');
    
    try {
      const markdown = await generateAnalysis(payload);
      setResult(markdown);
    } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiveAnalysisRequest = () => {
    if (!inspectorData) return;

    const payload: ElementAnalysisPayload = {
      MODE: AnalysisMode.ELEMENT_ANALYSIS,
      PAGE_URL: currentInspectorUrl,
      ELEMENT_HTML: inspectorData.elementHtml,
      ELEMENT_METADATA: inspectorData.metadata,
      CURRENT_LOCATORS: {
        css: inspectorData.generatedCss,
        xpath: inspectorData.generatedXpath
      },
      INTENT: `Element ${inspectorData.metadata.tag} ${inspectorData.metadata.id ? '#' + inspectorData.metadata.id : ''}`
    };

    handleAnalyze(payload);
  };

  // Clear AI result when selecting a new element (if not locked)
  useEffect(() => {
    if (inspectorData && !isInspectorLocked && !isLoading) {
       setResult('');
    }
  }, [inspectorData, isInspectorLocked, isLoading]);

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 flex-shrink-0 z-30 shadow-sm relative">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-brand-600 rounded-md shadow-sm">
              <Search className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-sm font-bold text-slate-900 leading-none">Selenium Locator Advisor</h1>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">AI Locator Stabilizer</span>
            </div>
            <div className="hidden sm:flex items-center text-slate-300 mx-2">
                <ChevronRight className="w-4 h-4" />
            </div>
             <div className="hidden sm:block text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
               {mode === AnalysisMode.LIVE_INSPECTOR ? 'Live Inspector' : mode === AnalysisMode.ELEMENT_ANALYSIS ? 'Manual Analysis' : 'Page Refactor'}
            </div>
          </div>
            
          {/* Mode Tabs */}
          <div className="flex items-center justify-center">
              <div className="bg-slate-100 p-1 rounded-md flex space-x-1">
                  <button
                      onClick={() => setMode(AnalysisMode.LIVE_INSPECTOR)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
                      mode === AnalysisMode.LIVE_INSPECTOR
                          ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                  >
                      <Globe className="w-3.5 h-3.5" />
                      Live Inspector
                  </button>
                  <button
                      onClick={() => setMode(AnalysisMode.ELEMENT_ANALYSIS)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
                      mode === AnalysisMode.ELEMENT_ANALYSIS
                          ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                  >
                      <Target className="w-3.5 h-3.5" />
                      Manual Input
                  </button>
                  <button
                      onClick={() => setMode(AnalysisMode.PAGE_REFACTOR)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
                      mode === AnalysisMode.PAGE_REFACTOR
                          ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                  >
                      <LayoutTemplate className="w-3.5 h-3.5" />
                      Refactor
                  </button>
              </div>
          </div>

          {/* Footer / Info */}
          <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 text-[10px] font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full border border-brand-100">
                 Gemini 2.5 Flash Active
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex relative overflow-hidden">
        
        {/* LIVE INSPECTOR LAYOUT (Edge-to-Edge) */}
        {mode === AnalysisMode.LIVE_INSPECTOR && (
            <div className="flex w-full h-full">
                {/* Left: Browser */}
                <div className="flex-1 bg-slate-100 relative flex flex-col overflow-hidden">
                    <LiveBrowser 
                        onHover={setInspectorData} 
                        onUrlChange={setCurrentInspectorUrl}
                        onLockChange={setIsInspectorLocked}
                    />
                </div>
                
                {/* Right: Inspector Panel OR AI Result */}
                <div className="w-[400px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col z-20 shadow-xl">
                    {result ? (
                         <div className="flex flex-col h-full">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                                <span className="text-xs font-bold text-brand-700 uppercase tracking-wide flex items-center gap-2">
                                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                                  AI Recommendation
                                </span>
                                <button 
                                  onClick={() => setResult('')} 
                                  className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 hover:bg-slate-200 rounded transition-colors"
                                >
                                  Close
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <ResultDisplay markdown={result} />
                            </div>
                         </div>
                    ) : (
                        <InspectorPanel 
                            data={inspectorData} 
                            onAnalyze={handleLiveAnalysisRequest}
                            isAnalyzing={isLoading}
                            isLocked={isInspectorLocked}
                        />
                    )}
                    {error && (
                        <div className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-xs">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* MANUAL / REFACTOR LAYOUT (Centered Container) */}
        {mode !== AnalysisMode.LIVE_INSPECTOR && (
             <div className="w-full h-full overflow-auto bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
                  <div className="w-full lg:w-5/12 flex flex-col gap-6">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      {mode === AnalysisMode.ELEMENT_ANALYSIS ? (
                          <ElementAnalysisForm onAnalyze={handleAnalyze} isLoading={isLoading} />
                      ) : (
                          <PageRefactorForm onAnalyze={handleAnalyze} isLoading={isLoading} />
                      )}
                      </div>
                      {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                              {error}
                          </div>
                      )}
                  </div>
                  <div className="w-full lg:w-7/12 min-h-[500px]">
                      <ResultDisplay markdown={result} />
                  </div>
                </div>
             </div>
        )}
      </main>
    </div>
  );
}

export default App;