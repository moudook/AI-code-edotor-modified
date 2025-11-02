import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Correction } from './types';
import { correctCode, getChatResponse } from './services/geminiService';
import CodeView from './components/CodeView';
import LivePreview from './components/LivePreview';
import ChatBar from './components/ChatBar';
import ChatResponsePopup from './components/ChatResponsePopup';
import { LoadingSpinner, CorrectIcon, FullScreenIcon, ExitFullScreenIcon, PinIcon, PinFilledIcon } from './components/icons';

const initialHtml = `<h1>Welcome to the Live Editor!</h1>
<p>Change the HTML or CSS to see updates.</p>
<button class="btn">Click Me</button>`;
const initialCss = `body {
  font-family: sans-serif;
  padding: 2em;
  color: #333;
}

.btn {
  background-color: #0284c7; /* A sky blue color */
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.btn:hover {
  background-color: #0369a1; /* A slightly darker sky blue */
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
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);
  const [isPreviewPinned, setIsPreviewPinned] = useState(false);

  const [chatQuery, setChatQuery] = useState<string>('');
  const [chatResponse, setChatResponse] = useState<string>('');
  const [isChatResponseVisible, setIsChatResponseVisible] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const [dividerPosition, setDividerPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  const [isHtmlFocused, setIsHtmlFocused] = useState(false);
  const [isCssFocused, setIsCssFocused] = useState(false);

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

    const handleChatSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || isChatLoading) return;
    
    addLog(`Chat query submitted: "${chatQuery}"`);
    setIsChatLoading(true);
    setChatResponse('');
    setIsChatResponseVisible(true);
    setError(null);

    try {
      const response = await getChatResponse(htmlCode, cssCode, chatQuery);
      setChatResponse(response);
      addLog("Chat response received.");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown chat error occurred.";
      setChatResponse(`**Error:** ${errorMessage}`);
      addLog(`Chat Error: ${errorMessage}`);
    } finally {
      setIsChatLoading(false);
      setChatQuery('');
    }
  }, [chatQuery, htmlCode, cssCode, addLog, isChatLoading]);

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
  
  const handleTogglePreviewFullScreen = useCallback(() => {
    setIsPreviewFullScreen(prev => {
        if (prev) { // When exiting full screen
            setIsPreviewPanelExpanded(false);
        }
        return !prev;
    });
  }, []);
  
  const handleTogglePinPreview = useCallback(() => {
    if (isPreviewPinned) {
      setIsPreviewPanelExpanded(false);
    }
    setIsPreviewPinned(prev => !prev);
  }, [isPreviewPinned]);


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

  const isPreviewEffectivelyExpanded = isPreviewPanelExpanded || isPreviewPinned;
  
  return (
    <div className="h-screen bg-zinc-900 text-zinc-200 flex flex-col font-sans overflow-hidden">
      <nav className="w-full grid grid-cols-3 items-center px-6 sm:px-8 py-4 border-b border-zinc-700 flex-shrink-0">
        <div />
        <span className="text-xl font-semibold tracking-wider text-zinc-300 justify-self-center">FITRO</span>
        <div className="flex items-center justify-self-end">
            {/* FIX: Explicitly cast the result of `htmlDiff && cssDiff` to a boolean for the disabled prop. */}
            <button onClick={handleCorrectCode} disabled={isLoading || !!(htmlDiff && cssDiff)} className="text-zinc-400 hover:text-lime-500 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors p-2 rounded-full hover:bg-zinc-800">
                {isLoading ? <LoadingSpinner /> : <CorrectIcon />}
            </button>
        </div>
      </nav>

      <main className="w-full flex-grow flex overflow-hidden">
        {/* Live Preview Panel (Left) */}
        <div
            className={`shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${
                isPreviewFullScreen
                ? 'fixed inset-0 z-50 bg-zinc-800'
                : `relative flex-shrink-0 bg-zinc-800 ${isPreviewEffectivelyExpanded ? 'w-96' : 'w-10'}`
            }`}
            onMouseEnter={!isPreviewPinned && !isPreviewFullScreen ? () => setIsPreviewPanelExpanded(true) : undefined}
            onMouseLeave={!isPreviewPinned && !isPreviewFullScreen ? () => setIsPreviewPanelExpanded(false) : undefined}
        >
            <div className={`absolute top-0 right-0 w-10 h-full flex items-center justify-center bg-zinc-700/80 cursor-pointer transition-opacity duration-300 ${isPreviewEffectivelyExpanded || isPreviewFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <span className="transform rotate-90 whitespace-nowrap text-xs font-bold tracking-widest uppercase text-zinc-400">Preview</span>
            </div>
            <div className={`h-full flex flex-col transition-opacity duration-300 ${isPreviewEffectivelyExpanded || isPreviewFullScreen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex justify-between items-center p-3 pb-2 flex-shrink-0 text-zinc-200 border-b border-zinc-700">
                    <h3 className="text-sm font-bold">Live Preview</h3>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={handleTogglePinPreview}
                            className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                            title={isPreviewPinned ? "Unpin Preview" : "Pin Preview"}
                            aria-label={isPreviewPinned ? "Unpin Preview" : "Pin Preview"}
                        >
                            {isPreviewPinned ? <PinFilledIcon /> : <PinIcon />}
                        </button>
                        <button
                            onClick={handleTogglePreviewFullScreen}
                            className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                            title={isPreviewFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                            aria-label={isPreviewFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                        >
                            {isPreviewFullScreen ? <ExitFullScreenIcon /> : <FullScreenIcon />}
                        </button>
                    </div>
                </div>
                <div className="flex-grow bg-white">
                    <LivePreview htmlCode={htmlCode} cssCode={cssCode} />
                </div>
            </div>
        </div>

        {/* Center Content (Editors) */}
        <div className="flex-grow flex flex-col p-4 sm:p-6 md:p-8 overflow-hidden min-w-0">
            {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4 text-sm w-full flex-shrink-0">
                <strong>Error:</strong> {error}
            </div>
            )}

            <div className="flex-grow flex w-full flex-col md:flex-row items-stretch min-h-0 gap-4">
                <div ref={editorContainerRef} className="flex-grow flex w-full flex-col md:flex-row items-stretch min-h-0 md:gap-0 rounded-md overflow-hidden">
                <div 
                    className={`bg-zinc-800 border shadow-sm flex flex-col min-h-0 min-w-0 flex-1 md:flex-none transition-all duration-200 ${isHtmlFocused ? 'border-lime-500 shadow-[0_0_8px_0px_theme(colors.lime.500/0.4)]' : 'border-zinc-700'}`}
                    style={{ width: `${dividerPosition}%` }}
                >
                    <CodeView
                        code={htmlCode}
                        onCodeChange={setHtmlCode}
                        diff={htmlDiff}
                        isLoading={isLoading}
                        placeholder="HTML CODE"
                        onFocus={() => setIsHtmlFocused(true)}
                        onBlur={() => setIsHtmlFocused(false)}
                    />
                </div>
                <div 
                    className="w-full md:w-1.5 h-1.5 md:h-auto flex-shrink-0 bg-zinc-700 hover:bg-lime-500 transition-colors duration-200 cursor-row-resize md:cursor-col-resize hidden md:block"
                    onMouseDown={handleMouseDown}
                    title="Drag to resize"
                />
                <div 
                    className={`bg-zinc-800 border shadow-sm flex flex-col min-h-0 min-w-0 flex-1 transition-all duration-200 ${isCssFocused ? 'border-white/80 shadow-[0_0_8px_0px_rgba(255,255,255,0.2)]' : 'border-zinc-700'}`}
                >
                    <CodeView
                        code={cssCode}
                        onCodeChange={setCssCode}
                        diff={cssDiff}
                        isLoading={isLoading}
                        placeholder="CSS CODE"
                        onFocus={() => setIsCssFocused(true)}
                        onBlur={() => setIsCssFocused(false)}
                    />
                </div>
                </div>
            </div>
            
            {htmlDiff && cssDiff && !isLoading && (
                <div className="flex-shrink-0 flex justify-center items-center mt-6 space-x-4">
                <button
                    onClick={handleEditAgain}
                    className="px-6 py-2 text-sm font-semibold text-zinc-200 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-colors"
                >
                    Edit Again
                </button>
                <button
                    onClick={handleAcceptCorrection}
                    className="px-6 py-2 text-sm font-semibold text-white bg-lime-600 rounded-md hover:bg-lime-500 transition-colors"
                >
                    Accept All Corrections
                </button>
                </div>
            )}
        </div>

        {/* Log Panel (Right) */}
        <div
            className={`relative flex-shrink-0 bg-zinc-800 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${isLogPanelExpanded ? 'w-64' : 'w-10'}`}
            onMouseEnter={() => setIsLogPanelExpanded(true)}
            onMouseLeave={() => setIsLogPanelExpanded(false)}
        >
            <div className={`absolute top-0 left-0 w-10 h-full flex items-center justify-center bg-zinc-700/80 cursor-pointer transition-opacity duration-300 ${isLogPanelExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <span className="transform -rotate-90 whitespace-nowrap text-xs font-bold tracking-widest uppercase text-zinc-400">Logs</span>
            </div>
            <div className={`h-full flex flex-col transition-opacity duration-300 ${isLogPanelExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <h3 className="text-sm font-bold p-3 pb-2 flex-shrink-0 text-zinc-200 border-b border-zinc-700">Activity Log</h3>
            <div className="flex-grow overflow-y-auto p-3 pt-2">
                {logs.length > 0 ? logs.map((log, index) => (
                <p key={index} className="text-xs text-zinc-400 mb-1 font-mono break-words">{log}</p>
                )) : (
                <p className="text-xs text-zinc-500 italic">No activity yet.</p>
                )}
            </div>
            </div>
        </div>
      </main>
      
      <div className="relative w-full flex-shrink-0">
        {isChatResponseVisible && (
            <ChatResponsePopup
                isLoading={isChatLoading}
                response={chatResponse}
                onClose={() => setIsChatResponseVisible(false)}
            />
        )}
        <footer className="p-4 bg-zinc-900">
            <ChatBar
                query={chatQuery}
                onQueryChange={setChatQuery}
                onSubmit={handleChatSubmit}
                isLoading={isChatLoading}
            />
        </footer>
      </div>
    </div>
  );
}

export default App;