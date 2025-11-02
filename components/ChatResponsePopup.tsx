import React from 'react';
import { CrossIcon, LoadingSpinner } from './icons';
import { marked } from 'marked';

interface ChatResponsePopupProps {
  isLoading: boolean;
  response: string;
  onClose: () => void;
}

const ChatResponsePopup: React.FC<ChatResponsePopupProps> = ({ isLoading, response, onClose }) => {
  const parsedResponse = isLoading ? '' : marked.parse(response) as string;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-11/12 max-w-4xl bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-4 text-sm z-50 animate-fade-in-up">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-zinc-100">AI Assistant</h4>
        <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors" aria-label="Close response">
          <CrossIcon />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto pr-2 text-zinc-300 prose prose-sm prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <LoadingSpinner />
            <span>AI is thinking...</span>
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: parsedResponse }} />
        )}
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ChatResponsePopup;