import React, { useState, useEffect } from 'react';
import { Target, LayoutTemplate, Search, Globe, ChevronRight } from 'lucide-react';
import ElementAnalysisForm from './components/ElementAnalysisForm';
import PageRefactorForm from './components/PageRefactorForm';
import ResultDisplay from './components/ResultDisplay';
import LiveBrowser from './components/LiveBrowser';
import InspectorPanel from './components/InspectorPanel';
import { AdvisorPayload, AnalysisMode, InspectorEvent, ElementAnalysisPayload, PageObjectElement } from './types';
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
  const [scannedElements, setScannedElements] = useState<PageObjectElement[]>([]);

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
    <div className="h-screen flex flex-col font-sans bg-slate-950 overflow-hidden text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 flex-shrink-0 z-30 shadow-sm relative">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-brand-600 rounded-md shadow-sm">
              <Search className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-sm font-bold text-slate-100 leading-none">Selenium Locator Advisor</h1>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">AI Locator Stabilizer</span>
            </div>
            <div className="hidden sm:flex items-center text-slate-600 mx-2">
                <ChevronRight className="w-4 h-4" />
            </div>
             <div className="hidden sm:block text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
               {mode === AnalysisMode.LIVE_INSPECTOR ? 'Live Inspector' : mode === AnalysisMode.ELEMENT_ANALYSIS ? 'Manual Analysis' : 'Page Refactor'}
            </div>
          </div>
            
          {/* Mode Tabs */}
          <div className="flex items-center justify-center">
              <div className="bg-slate-800 p-1 rounded-md flex space-x-1 border border-slate-700">
                  <button
                      onClick={() => setMode(AnalysisMode.LIVE_INSPECTOR)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
                      mode === AnalysisMode.LIVE_INSPECTOR
                          ? 'bg-slate-700 text-white shadow-sm ring-1 ring-black/5'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                      }`}
                  >
                      <Globe className="w-3.5 h-3.5" />
                      Live Inspector
                  </button>
                  <button
                      onClick={() => setMode(AnalysisMode.ELEMENT_ANALYSIS)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
                      mode === AnalysisMode.ELEMENT_ANALYSIS
                          ? 'bg-slate-700 text-white shadow-sm ring-1 ring-black/5'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                      }`}
                  >
                      <Target className="w-3.5 h-3.5" />
                      Manual Input
                  </button>
                  <button
                      onClick={() => setMode(AnalysisMode.PAGE_REFACTOR)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all ${
                      mode === AnalysisMode.PAGE_REFACTOR
                          ? 'bg-slate-700 text-white shadow-sm ring-1 ring-black/5'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                      }`}
                  >
                      <LayoutTemplate className="w-3.5 h-3.5" />
                      Refactor
                  </button>
              </div>
          </div>

          {/* Footer / Info */}
          <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 text-[10px] font-medium text-brand-400 bg-brand-900/30 px-2 py-1 rounded-full border border-brand-900/50">
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
                <div className="flex-1 bg-slate-950 relative flex flex-col overflow-hidden">
                    <LiveBrowser 
                        onHover={setInspectorData} 
                        onUrlChange={setCurrentInspectorUrl}
                        onLockChange={setIsInspectorLocked}
                        onScanComplete={setScannedElements}
                    />
                </div>
                
                {/* Right: Inspector Panel OR AI Result */}
                <div className="w-[400px] flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col z-20 shadow-xl">
                    {result ? (
                         <div className="flex flex-col h-full">
                            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
                                <span className="text-xs font-bold text-brand-400 uppercase tracking-wide flex items-center gap-2">
                                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                                  AI Recommendation
                                </span>
                                <button 
                                  onClick={() => setResult('')} 
                                  className="text-xs font-medium text-slate-400 hover:text-slate-200 px-2 py-1 hover:bg-slate-800 rounded transition-colors"
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
                            scannedElements={scannedElements}
                            onAnalyze={handleLiveAnalysisRequest}
                            isAnalyzing={isLoading}
                            isLocked={isInspectorLocked}
                        />
                    )}
                    {error && (
                        <div className="m-4 bg-red-900/20 border border-red-900/50 text-red-300 px-4 py-3 rounded-md text-xs">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* MANUAL / REFACTOR LAYOUT (Centered Container) */}
        {mode !== AnalysisMode.LIVE_INSPECTOR && (
             <div className="w-full h-full overflow-auto bg-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
                  <div className="w-full lg:w-5/12 flex flex-col gap-6">
                      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6">
                      {mode === AnalysisMode.ELEMENT_ANALYSIS ? (
                          <ElementAnalysisForm onAnalyze={handleAnalyze} isLoading={isLoading} />
                      ) : (
                          <PageRefactorForm onAnalyze={handleAnalyze} isLoading={isLoading} />
                      )}
                      </div>
                      {error && (
                          <div className="bg-red-900/20 border border-red-900/50 text-red-300 px-4 py-3 rounded-md text-sm">
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

      {/* Global Footer Credit */}
      <footer className="bg-slate-900 border-t border-slate-800 py-1.5 flex items-center justify-center flex-shrink-0 z-30">
          <p className="text-[10px] font-semibold text-slate-500 tracking-wide">
            by Dr. Cağrı Ataseven
          </p>
      </footer>
    </div>
  );
}

export default App;