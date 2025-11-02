import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Correction } from './types';
import { correctCode } from './services/geminiService';
import CodeView from './components/CodeView';
import LivePreview from './components/LivePreview';
import { LoadingSpinner, CorrectIcon } from './components/icons';

const initialHtml = `<h1>Welcome to the Live Editor!</h1>
<p>Change the HTML or CSS to see updates.</p>
<button class="btn">Click Me</button>`;
const initialCss = `body {
  font-family: sans-serif;
  padding: 2em;
  color: #333;
}

.btn {
  background-color: #4f46e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.btn:hover {
  background-color: #4338ca;
}`;

function App() {
  const [htmlCode, setHtmlCode] = useState<string>(initialHtml);
  const [cssCode, setCssCode] = useState<string>(initialCss);
  const [htmlDiff, setHtmlDiff] = useState<Correction[] | null>(null);
  const [cssDiff, setCssDiff] = useState<Correction[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLogPanelExpanded, setIsLogPanelExpanded] = useState(false);
  const [isPreviewPanelExpanded, setIsPreviewPanelExpanded] = useState(false);

  const [dividerPosition, setDividerPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  }, []);

  const handleCorrectCode = useCallback(async () => {
    if (!htmlCode.trim() && !cssCode.trim()) {
      const msg = "Please enter some HTML or CSS code to correct.";
      setError(msg);
      addLog(`Validation Error: ${msg}`);
      return;
    }
    addLog("Correction process started...");
    setIsLoading(true);
    setError(null);
    setHtmlDiff(null);
    setCssDiff(null);

    try {
      const result = await correctCode(htmlCode, cssCode);
      if (result.htmlCorrections && result.cssCorrections) {
        setHtmlDiff(result.htmlCorrections);
        setCssDiff(result.cssCorrections);
        addLog("Correction successful. Diff generated.");
      } else {
         const msg = "No corrections found or unexpected API response.";
         setError(msg);
         addLog(`API Warning: ${msg}`);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        addLog(`API Error: ${err.message}`);
      } else {
        const msg = "An unknown error occurred.";
        setError(msg);
        addLog(`Error: ${msg}`);
      }
    } finally {
      setIsLoading(false);
      addLog("Correction process finished.");
    }
  }, [htmlCode, cssCode, addLog]);

  const handleAcceptCorrection = useCallback(() => {
    if (htmlDiff) {
      const correctedCode = htmlDiff.map(line => line.corrected).join('\n');
      setHtmlCode(correctedCode);
    }
    if (cssDiff) {
      const correctedCode = cssDiff.map(line => line.corrected).join('\n');
      setCssCode(correctedCode);
    }
    setHtmlDiff(null);
    setCssDiff(null);
    addLog("Corrections accepted by user.");
  }, [htmlDiff, cssDiff, addLog]);

  const handleEditAgain = useCallback(() => {
    setHtmlDiff(null);
    setCssDiff(null);
    addLog("User returned to edit mode.");
  }, [addLog]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !editorContainerRef.current) return;
    
    const rect = editorContainerRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    let newPosition = (newX / rect.width) * 100;
    
    newPosition = Math.max(15, Math.min(85, newPosition));
    setDividerPosition(newPosition);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'col-resize';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <nav className="w-full flex justify-between items-center px-6 sm:px-8 py-4 border-b border-gray-800 flex-shrink-0">
        <span className="text-xl font-semibold tracking-wider">AI CORRECTION</span>
        <div className="flex items-center">
            <button onClick={handleCorrectCode} disabled={isLoading || (htmlDiff && cssDiff)} className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors p-2 rounded-full hover:bg-gray-800">
                {isLoading ? <LoadingSpinner /> : <CorrectIcon />}
            </button>
        </div>
      </nav>

      <main className="w-full flex-grow flex overflow-hidden">
        {/* Live Preview Panel (Left) */}
        <div
            className={`relative flex-shrink-0 bg-zinc-800 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${isPreviewPanelExpanded ? 'w-96' : 'w-10'}`}
            onMouseEnter={() => setIsPreviewPanelExpanded(true)}
            onMouseLeave={() => setIsPreviewPanelExpanded(false)}
        >
            <div className={`absolute top-0 right-0 w-10 h-full flex items-center justify-center bg-gray-900/50 cursor-pointer transition-opacity duration-300 ${isPreviewPanelExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <span className="transform rotate-90 whitespace-nowrap text-xs font-bold tracking-widest uppercase text-gray-400">Preview</span>
            </div>
            <div className={`h-full flex flex-col transition-opacity duration-300 ${isPreviewPanelExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <h3 className="text-sm font-bold p-3 pb-2 flex-shrink-0 text-gray-200 border-b border-gray-700">Live Preview</h3>
                <div className="flex-grow bg-white">
                    <LivePreview htmlCode={htmlCode} cssCode={cssCode} />
                </div>
            </div>
        </div>

        {/* Center Content (Editors) */}
        <div className="flex-grow flex flex-col p-4 sm:p-6 md:p-8 overflow-hidden min-w-0">
            {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 p-3 rounded-md mb-4 text-sm w-full flex-shrink-0">
                <strong>Error:</strong> {error}
            </div>
            )}

            <div className="flex-grow flex w-full flex-col md:flex-row items-stretch min-h-0 gap-4">
                <div ref={editorContainerRef} className="flex-grow flex w-full flex-col md:flex-row items-stretch min-h-0 md:gap-0 rounded-md overflow-hidden">
                <div 
                    className="bg-zinc-900 shadow-lg flex flex-col min-h-0 min-w-0 flex-1 md:flex-none"
                    style={{ width: `${dividerPosition}%` }}
                >
                    <CodeView
                        code={htmlCode}
                        onCodeChange={setHtmlCode}
                        diff={htmlDiff}
                        isLoading={isLoading}
                        placeholder="HTML CODE"
                    />
                </div>
                <div 
                    className="w-full md:w-1.5 h-1.5 md:h-auto flex-shrink-0 bg-gray-800 hover:bg-indigo-600 transition-colors duration-200 cursor-row-resize md:cursor-col-resize hidden md:block"
                    onMouseDown={handleMouseDown}
                    title="Drag to resize"
                />
                <div 
                    className="bg-zinc-900 shadow-lg flex flex-col min-h-0 min-w-0 flex-1"
                >
                    <CodeView
                        code={cssCode}
                        onCodeChange={setCssCode}
                        diff={cssDiff}
                        isLoading={isLoading}
                        placeholder="CSS CODE"
                    />
                </div>
                </div>
            </div>
            
            {htmlDiff && cssDiff && !isLoading && (
                <div className="flex-shrink-0 flex justify-center items-center mt-6 space-x-4">
                <button
                    onClick={handleEditAgain}
                    className="px-6 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                >
                    Edit Again
                </button>
                <button
                    onClick={handleAcceptCorrection}
                    className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
                >
                    Accept All Corrections
                </button>
                </div>
            )}
        </div>

        {/* Log Panel (Right) */}
        <div
            className={`relative flex-shrink-0 bg-zinc-800 rounded-md shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${isLogPanelExpanded ? 'w-64' : 'w-10'}`}
            onMouseEnter={() => setIsLogPanelExpanded(true)}
            onMouseLeave={() => setIsLogPanelExpanded(false)}
        >
            <div className={`absolute top-0 left-0 w-10 h-full flex items-center justify-center bg-gray-900/50 cursor-pointer transition-opacity duration-300 ${isLogPanelExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <span className="transform -rotate-90 whitespace-nowrap text-xs font-bold tracking-widest uppercase text-gray-400">Logs</span>
            </div>
            <div className={`h-full flex flex-col transition-opacity duration-300 ${isLogPanelExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <h3 className="text-sm font-bold p-3 pb-2 flex-shrink-0 text-gray-200 border-b border-gray-700">Activity Log</h3>
            <div className="flex-grow overflow-y-auto p-3 pt-2">
                {logs.length > 0 ? logs.map((log, index) => (
                <p key={index} className="text-xs text-gray-400 mb-1 font-mono break-words">{log}</p>
                )) : (
                <p className="text-xs text-gray-500 italic">No activity yet.</p>
                )}
            </div>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
