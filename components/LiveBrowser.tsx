import React, { useState, useEffect, useRef } from 'react';
import { InspectorEvent } from '../types';
import { Loader2, Globe, AlertTriangle, Code, ShieldAlert, FileText, Play, Lock, Unlock, Link, ScanSearch, Presentation } from 'lucide-react';

interface Props {
  onHover: (data: InspectorEvent) => void;
  onUrlChange: (url: string) => void;
  onLockChange: (locked: boolean) => void;
  onScanComplete: (elements: any[]) => void;
}

type LoadMode = 'PROXY' | 'DIRECT' | 'HTML_PASTE';

const DEMO_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; color: #334155; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); margin-bottom: 24px; }
        h1 { color: #0f172a; font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 18px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; }
        input, select, textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
        button { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        button:hover { background: #1d4ed8; }
        button.secondary { background: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
        th { font-weight: 600; color: #64748b; font-size: 13px; }
        .status-badge { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .nav-link { color: #2563eb; text-decoration: none; margin-right: 15px; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>CRM Dashboard</h1>
            <nav>
                <a href="#" class="nav-link" id="nav-home">Home</a>
                <a href="#" class="nav-link" id="nav-customers">Customers</a>
                <a href="#" class="nav-link" id="nav-settings">Settings</a>
            </nav>
        </div>

        <div class="card">
            <h2>Login to Account</h2>
            <form id="login-form">
                <div class="form-group">
                    <label for="username">Email Address</label>
                    <input type="email" id="username" name="email" placeholder="user@example.com" data-testid="login-email">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="••••••••">
                </div>
                <div class="form-group">
                     <label style="display:flex; align-items:center; gap:8px; font-weight:400;">
                        <input type="checkbox" id="remember-me" style="width:auto;"> Remember me
                     </label>
                </div>
                <button type="submit" id="btn-login" data-action="login-submit">Sign In</button>
                <a href="#" style="font-size:13px; margin-left:15px; color:#64748b;">Forgot password?</a>
            </form>
        </div>

        <div class="card">
            <h2>Recent Customers</h2>
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                <input type="text" placeholder="Search customers..." id="search-input" style="max-width: 250px;">
                <button class="secondary" id="btn-export">Export CSV</button>
            </div>
            <table id="customer-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>#C001</td>
                        <td>Acme Corp</td>
                        <td><span class="status-badge">Active</span></td>
                        <td><a href="#" id="edit-c001">Edit</a></td>
                    </tr>
                    <tr>
                        <td>#C002</td>
                        <td>Global Tech</td>
                        <td><span class="status-badge">Active</span></td>
                        <td><a href="#" id="edit-c002">Edit</a></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
`;

const LiveBrowser: React.FC<Props> = ({ onHover, onUrlChange, onLockChange, onScanComplete }) => {
  const [inputUrl, setInputUrl] = useState('https://example.com');
  const [baseUrl, setBaseUrl] = useState('');
  const [loadMode, setLoadMode] = useState<LoadMode>('HTML_PASTE');
  const [rawHtml, setRawHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
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

        function extractMetadata(target) {
          const metadata = {
            tag: target.tagName.toLowerCase(),
            id: target.id || '',
            classes: Array.from(target.classList).filter(c => c !== '__inspector_highlight' && c !== '__inspector_locked'),
            text_content: (target.innerText || '').substring(0, 50).replace(/[\\n\\r]+/g, ' ').trim(),
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
          return metadata;
        }

        function sendInspectorData(target) {
          const metadata = extractMetadata(target);
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
            
            if (event.data && event.data.type === 'SCAN_PAGE') {
                // Find all interactive elements
                const selectors = [
                    'button', 
                    'input:not([type="hidden"])', 
                    'select', 
                    'textarea', 
                    'a[href]', 
                    '[role="button"]',
                    '[role="link"]',
                    '[role="checkbox"]',
                    '[role="radio"]'
                ];
                const elements = document.querySelectorAll(selectors.join(','));
                const scanResults = [];
                
                elements.forEach(el => {
                    // Check visibility
                    if (el.offsetParent === null) return;
                    
                    scanResults.push({
                        metadata: extractMetadata(el),
                        generatedCss: getCssPath(el),
                        generatedXpath: getXPath(el)
                    });
                });
                
                window.parent.postMessage({ type: 'PAGE_SCAN_RESULT', elements: scanResults }, '*');
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

  const handleLoadDemo = () => {
      setLoadMode('HTML_PASTE');
      setRawHtml(DEMO_HTML);
      setBaseUrl('');
      // We need to wait for state update before loading, or just call load with the content directly.
      // For simplicity, we'll set the state and manually trigger the "render" logic in a timeout or just use a direct effect
      // But cleaner is:
      setTimeout(() => {
          const fullHtml = DEMO_HTML + injectedScript;
          setIframeContent(fullHtml);
          setIsLoading(false);
          setError(null);
          setIsLocked(false);
          onLockChange(false);
      }, 100);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === 'INSPECTOR_HOVER') {
             onHover(event.data);
        } else if (event.data.type === 'INSPECTOR_LOCKED') {
             setIsLocked(event.data.isLocked);
             onLockChange(event.data.isLocked);
        } else if (event.data.type === 'PAGE_SCAN_RESULT') {
            onScanComplete(event.data.elements);
            setIsScanning(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHover, onLockChange, onScanComplete]);

  const handleUnlock = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'UNLOCK_INSPECTOR' }, '*');
          setIsLocked(false);
          onLockChange(false);
      }
  };
  
  const handleScanPage = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
          setIsScanning(true);
          iframeRef.current.contentWindow.postMessage({ type: 'SCAN_PAGE' }, '*');
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      
      {/* Browser Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-3 flex-shrink-0 shadow-sm z-10">
        
        {/* Mode Selector */}
        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
             <button
                title="Paste HTML Source"
                onClick={() => setLoadMode('HTML_PASTE')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-colors ${loadMode === 'HTML_PASTE' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Paste HTML</span>
            </button>
            <button
                title="Public Proxy"
                onClick={() => setLoadMode('PROXY')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-colors ${loadMode === 'PROXY' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <Globe className="w-3.5 h-3.5" />
                 <span className="hidden md:inline">Proxy</span>
            </button>
            <button
                title="Direct Embed (No Inspector)"
                onClick={() => setLoadMode('DIRECT')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-colors ${loadMode === 'DIRECT' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <ShieldAlert className="w-3.5 h-3.5" />
                 <span className="hidden md:inline">Direct</span>
            </button>
        </div>

        <div className="h-4 w-px bg-slate-700 mx-1"></div>

        {/* URL Input */}
        <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
            <div className="text-slate-500 mr-2">
               {loadMode === 'HTML_PASTE' ? <FileText className="w-4 h-4"/> : <Globe className="w-4 h-4" />}
            </div>
            <input 
                type="text" 
                value={loadMode === 'HTML_PASTE' ? 'Raw HTML Input' : inputUrl}
                onChange={(e) => loadMode !== 'HTML_PASTE' && setInputUrl(e.target.value)}
                readOnly={loadMode === 'HTML_PASTE'}
                placeholder={loadMode === 'HTML_PASTE' ? "Paste your code below..." : "Enter URL"}
                className={`bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder:text-slate-500 ${loadMode === 'HTML_PASTE' ? 'cursor-default opacity-70' : ''}`}
            />
        </div>
        
        <div className="h-4 w-px bg-slate-700 mx-1"></div>

        {/* Demo Button */}
        <button
            onClick={handleLoadDemo}
            className="bg-slate-800 text-brand-400 border border-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-medium"
            title="Load Offline Demo Page (Safety Mode)"
        >
             <Presentation className="w-3.5 h-3.5" />
             <span className="hidden sm:inline">Load Demo</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1"></div>

        {/* Action Buttons */}
        {iframeContent && loadMode !== 'DIRECT' && (
             <button
                onClick={handleScanPage}
                disabled={isScanning}
                className="bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-medium"
                title="Scan all elements on page"
             >
                 {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanSearch className="w-3.5 h-3.5 text-brand-400" />}
                 <span className="hidden sm:inline">Scan Page</span>
             </button>
        )}

        {/* Lock/Unlock Controls */}
        {isLocked ? (
            <button 
                onClick={handleUnlock}
                className="bg-red-900/30 text-red-400 border border-red-900/50 px-4 py-1.5 rounded-md hover:bg-red-900/50 transition-colors flex items-center gap-2 text-sm font-medium animate-pulse"
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
        <div className="bg-red-900/20 px-4 py-2 border-b border-red-900/50 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <div className="text-xs font-medium text-red-300">{error}</div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Browser Viewport */}
      <div className="flex-1 relative bg-slate-900 overflow-hidden flex flex-col">
        
        {/* Paste Input Area */}
        {loadMode === 'HTML_PASTE' && (!iframeContent || iframeContent.length === 0) ? (
            <div className="h-full flex flex-col p-6 bg-slate-950">
                 <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                     <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
                        <Code className="w-4 h-4 text-brand-500" />
                        <h3 className="text-sm font-medium text-slate-300">Source Code Input</h3>
                     </div>
                     
                     <div className="p-4 border-b border-slate-800 bg-slate-900/30">
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            Base URL (Optional)
                        </label>
                        <input 
                            type="text" 
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="e.g. http://localhost:3000 (Fixes broken images/styles)"
                            className="w-full text-xs p-2 border border-slate-700 bg-slate-950 text-slate-200 rounded shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                            Entering your app's URL allows relative links (CSS, Images) to load correctly.
                        </p>
                     </div>

                     <textarea
                        className="flex-1 w-full p-4 font-mono text-xs text-slate-300 bg-slate-950 resize-none outline-none leading-relaxed selection:bg-brand-900 selection:text-white"
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
                     <div className="absolute inset-0 flex items-center justify-center text-slate-600 flex-col bg-slate-900">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                             <Globe className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No content loaded</p>
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
                            className="bg-slate-900/90 backdrop-blur text-white text-xs font-medium px-3 py-2 rounded-md shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 border border-slate-700"
                        >
                            <Code className="w-3 h-3" /> Edit HTML
                        </button>
                    </div>
                )}
                
                {/* Direct Mode Warning */}
                {loadMode === 'DIRECT' && (
                     <div className="absolute top-0 left-0 right-0 bg-amber-900/90 backdrop-blur border-b border-amber-800 px-4 py-2 flex items-center justify-center gap-2 z-20">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-medium text-amber-200">
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