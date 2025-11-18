import React, { useState, useEffect, useRef } from 'react';
import { InspectorEvent } from '../types';
import { Loader2, Globe, AlertTriangle, Code, ShieldAlert, FileText, Play, Lock, Unlock, Link } from 'lucide-react';

interface Props {
  onHover: (data: InspectorEvent) => void;
  onUrlChange: (url: string) => void;
  onLockChange: (locked: boolean) => void;
}

type LoadMode = 'PROXY' | 'DIRECT' | 'HTML_PASTE';

const LiveBrowser: React.FC<Props> = ({ onHover, onUrlChange, onLockChange }) => {
  const [inputUrl, setInputUrl] = useState('https://example.com');
  const [baseUrl, setBaseUrl] = useState('');
  const [loadMode, setLoadMode] = useState<LoadMode>('HTML_PASTE');
  const [rawHtml, setRawHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [iframeContent, setIframeContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Injected script to handle hover, highlight, and selector generation inside the iframe
  const injectedScript = `
    <style>
      .__inspector_highlight {
        outline: 2px solid #0ea5e9 !important;
        background-color: rgba(14, 165, 233, 0.1) !important;
        cursor: crosshair !important;
        position: relative;
        z-index: 2147483647;
      }
      .__inspector_locked {
        outline: 3px solid #ef4444 !important;
        background-color: rgba(239, 68, 68, 0.1) !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2) !important;
        z-index: 2147483647;
      }
      body { cursor: default; }
    </style>
    <script>
      (function() {
        let isLocked = false;
        let lockedElement = null;
        let lastHighlighted = null;

        function getCssPath(el) {
            if (!(el instanceof Element)) return;
            var path = [];
            while (el.nodeType === Node.ELEMENT_NODE) {
                var selector = el.nodeName.toLowerCase();
                if (el.id) {
                    selector += '#' + el.id;
                    path.unshift(selector);
                    break;
                } else {
                    var sib = el, nth = 1;
                    while (sib = sib.previousElementSibling) {
                        if (sib.nodeName.toLowerCase() == selector)
                           nth++;
                    }
                    if (nth != 1)
                        selector += ":nth-of-type("+nth+")";
                }
                path.unshift(selector);
                el = el.parentNode;
            }
            return path.join(" > ");
        }

        function getXPath(element) {
            if (element.id !== '') return '//*[@id="' + element.id + '"]';
            if (element === document.body) return '/html/body';
            var ix = 0;
            var siblings = element.parentNode.childNodes;
            for (var i = 0; i < siblings.length; i++) {
                var sibling = siblings[i];
                if (sibling === element) return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
                if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
            }
        }

        function sendInspectorData(target) {
          const metadata = {
            tag: target.tagName.toLowerCase(),
            id: target.id || '',
            classes: Array.from(target.classList).filter(c => c !== '__inspector_highlight' && c !== '__inspector_locked'),
            text_content: (target.innerText || '').substring(0, 100),
            type: target.getAttribute('type') || '',
            role: target.getAttribute('role') || '',
            name: target.getAttribute('name') || '',
            data_attributes: {},
            aria_label: target.getAttribute('aria-label') || ''
          };

          for (let i = 0; i < target.attributes.length; i++) {
            const attr = target.attributes[i];
            if (attr.name.startsWith('data-')) {
                metadata.data_attributes[attr.name] = attr.value;
            }
          }

          const payload = {
            type: 'INSPECTOR_HOVER',
            elementHtml: target.outerHTML,
            metadata: metadata,
            generatedCss: getCssPath(target),
            generatedXpath: getXPath(target)
          };

          window.parent.postMessage(payload, '*');
        }

        document.body.addEventListener('mouseover', function(e) {
          if (isLocked) return;
          e.stopPropagation();
          const target = e.target;
          
          if (lastHighlighted && lastHighlighted !== target) {
            lastHighlighted.classList.remove('__inspector_highlight');
          }
          
          target.classList.add('__inspector_highlight');
          lastHighlighted = target;

          sendInspectorData(target);
        }, true);

        document.body.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
        }, true);

        document.body.addEventListener('dblclick', function(e) {
           e.preventDefault();
           e.stopPropagation();
           
           isLocked = true;
           lockedElement = e.target;
           
           if (lastHighlighted) lastHighlighted.classList.remove('__inspector_highlight');
           lockedElement.classList.add('__inspector_locked');

           window.parent.postMessage({ type: 'INSPECTOR_LOCKED', isLocked: true }, '*');
           // Resend data for the locked element to ensure UI is synced
           sendInspectorData(lockedElement);
        }, true);

        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'UNLOCK_INSPECTOR') {
                isLocked = false;
                if (lockedElement) {
                    lockedElement.classList.remove('__inspector_locked');
                    lockedElement = null;
                }
                window.parent.postMessage({ type: 'INSPECTOR_LOCKED', isLocked: false }, '*');
            }
        });

      })();
    </script>
  `;

  const handleLoad = async () => {
    setError(null);
    setIsLoading(true);
    onUrlChange(inputUrl);
    setIsLocked(false);
    onLockChange(false);

    try {
      if (loadMode === 'HTML_PASTE') {
        if (!rawHtml.trim()) {
            setError("Please paste some HTML code first.");
            setIsLoading(false);
            return;
        }
        
        let processedHtml = rawHtml;
        
        // Inject Base URL if provided
        if (baseUrl.trim()) {
             // Check if head exists
             if (processedHtml.includes('<head>')) {
                 processedHtml = processedHtml.replace('<head>', `<head><base href="${baseUrl}">`);
             } else if (processedHtml.includes('<html>')) {
                 processedHtml = processedHtml.replace('<html>', `<html><head><base href="${baseUrl}"></head>`);
             } else {
                 processedHtml = `<head><base href="${baseUrl}"></head>${processedHtml}`;
             }
        }

        const fullHtml = processedHtml.includes('</body>') 
            ? processedHtml.replace('</body>', `${injectedScript}</body>`)
            : `${processedHtml}${injectedScript}`;
        
        setIframeContent(fullHtml);
        setIsLoading(false);

      } else if (loadMode === 'PROXY') {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(inputUrl)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if (data.contents) {
            const modifiedHtml = data.contents.replace('</body>', `${injectedScript}</body>`);
            const parser = new DOMParser();
            const doc = parser.parseFromString(modifiedHtml, 'text/html');
            const base = doc.createElement('base');
            base.href = inputUrl;
            if (doc.head) {
                doc.head.appendChild(base);
            } else {
                const head = doc.createElement('head');
                head.appendChild(base);
                doc.documentElement.insertBefore(head, doc.body);
            }
            setIframeContent(doc.documentElement.outerHTML);
        } else {
            throw new Error("Empty response from proxy.");
        }
        setIsLoading(false);

      } else {
        setIframeContent(''); 
        setIsLoading(false);
      }

    } catch (err) {
      setError("Failed to load. Try 'Paste HTML' mode.");
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === 'INSPECTOR_HOVER') {
             onHover(event.data);
        } else if (event.data.type === 'INSPECTOR_LOCKED') {
             setIsLocked(event.data.isLocked);
             onLockChange(event.data.isLocked);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHover, onLockChange]);

  const handleUnlock = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'UNLOCK_INSPECTOR' }, '*');
          setIsLocked(false);
          onLockChange(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      
      {/* Browser Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 flex-shrink-0 shadow-sm z-10">
        
        {/* Mode Selector */}
        <div className="flex bg-slate-100 rounded-lg p-0.5">
             <button
                title="Paste HTML Source"
                onClick={() => setLoadMode('HTML_PASTE')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-colors ${loadMode === 'HTML_PASTE' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Paste HTML</span>
            </button>
            <button
                title="Public Proxy"
                onClick={() => setLoadMode('PROXY')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-colors ${loadMode === 'PROXY' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Globe className="w-3.5 h-3.5" />
                 <span className="hidden md:inline">Proxy</span>
            </button>
            <button
                title="Direct Embed (No Inspector)"
                onClick={() => setLoadMode('DIRECT')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-colors ${loadMode === 'DIRECT' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <ShieldAlert className="w-3.5 h-3.5" />
                 <span className="hidden md:inline">Direct</span>
            </button>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-1"></div>

        {/* URL Input */}
        <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
            <div className="text-slate-400 mr-2">
               {loadMode === 'HTML_PASTE' ? <FileText className="w-4 h-4"/> : <Globe className="w-4 h-4" />}
            </div>
            <input 
                type="text" 
                value={loadMode === 'HTML_PASTE' ? 'Raw HTML Input' : inputUrl}
                onChange={(e) => loadMode !== 'HTML_PASTE' && setInputUrl(e.target.value)}
                readOnly={loadMode === 'HTML_PASTE'}
                placeholder={loadMode === 'HTML_PASTE' ? "Paste your code below..." : "Enter URL"}
                className={`bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 ${loadMode === 'HTML_PASTE' ? 'cursor-default opacity-70' : ''}`}
            />
        </div>

        {/* Lock/Unlock Controls */}
        {isLocked ? (
            <button 
                onClick={handleUnlock}
                className="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium animate-pulse"
            >
                <Unlock className="w-3.5 h-3.5" />
                Unlock Selection
            </button>
        ) : (
             <button 
                onClick={handleLoad}
                disabled={isLoading}
                className="bg-brand-600 text-white px-4 py-1.5 rounded-md hover:bg-brand-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm active:scale-95 transform"
            >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                Load
            </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 px-4 py-2 border-b border-red-200 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div className="text-xs font-medium text-red-800">{error}</div>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Browser Viewport */}
      <div className="flex-1 relative bg-white overflow-hidden flex flex-col">
        
        {/* Paste Input Area */}
        {loadMode === 'HTML_PASTE' && (!iframeContent || iframeContent.length === 0) ? (
            <div className="h-full flex flex-col p-6 bg-slate-50">
                 <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                     <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
                        <Code className="w-4 h-4 text-brand-500" />
                        <h3 className="text-sm font-medium text-slate-700">Source Code Input</h3>
                     </div>
                     
                     <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            Base URL (Optional)
                        </label>
                        <input 
                            type="text" 
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="e.g. http://localhost:3000 (Fixes broken images/styles)"
                            className="w-full text-xs p-2 border border-slate-300 rounded shadow-sm focus:border-brand-500 focus:ring-brand-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            Entering your app's URL allows relative links (CSS, Images) to load correctly.
                        </p>
                     </div>

                     <textarea
                        className="flex-1 w-full p-4 font-mono text-xs text-slate-700 resize-none outline-none leading-relaxed selection:bg-brand-100"
                        placeholder={`<html>
  <head>
    <link rel="stylesheet" href="/styles.css"> 
  </head>
  <body>
    <button id="login-btn" class="btn primary">Login</button>
  </body>
</html>`}
                        value={rawHtml}
                        onChange={(e) => setRawHtml(e.target.value)}
                        spellCheck={false}
                    />
                 </div>
            </div>
        ) : (
            /* Iframe Container */
            <div className={`w-full h-full relative bg-white transition-all duration-200 ${isLocked ? 'ring-4 ring-red-500/20' : ''}`}>
                {iframeContent || (loadMode === 'DIRECT' && inputUrl) ? (
                    <iframe 
                        ref={iframeRef}
                        src={loadMode === 'DIRECT' ? inputUrl : undefined}
                        srcDoc={loadMode !== 'DIRECT' ? iframeContent : undefined}
                        title="Inspector View"
                        className="w-full h-full border-none block"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                ) : (
                     <div className="absolute inset-0 flex items-center justify-center text-slate-300 flex-col">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                             <Globe className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No content loaded</p>
                    </div>
                )}
                
                {/* Overlay for Locked State */}
                {isLocked && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-2 pointer-events-none animate-bounce z-50">
                        <Lock className="w-3 h-3" />
                        SELECTION LOCKED
                    </div>
                )}

                {/* Reset Button Overlay */}
                {loadMode === 'HTML_PASTE' && iframeContent && (
                    <div className="absolute bottom-4 right-4 flex gap-2">
                         <button 
                            onClick={() => { setIframeContent(''); setIsLocked(false); onLockChange(false); }}
                            className="bg-slate-900/90 backdrop-blur text-white text-xs font-medium px-3 py-2 rounded-md shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                            <Code className="w-3 h-3" /> Edit HTML
                        </button>
                    </div>
                )}
                
                {/* Direct Mode Warning */}
                {loadMode === 'DIRECT' && (
                     <div className="absolute top-0 left-0 right-0 bg-amber-100/90 backdrop-blur border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 z-20">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-[10px] font-medium text-amber-800">
                            Direct Mode: Inspector features disabled due to security. Use "Paste HTML" for element analysis.
                        </span>
                     </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default LiveBrowser;