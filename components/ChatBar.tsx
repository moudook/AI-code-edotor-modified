import React, { useState, useEffect } from 'react';
import { LoadingSpinner, SendIcon } from './icons';

interface ChatBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const ChatBar: React.FC<ChatBarProps> = ({ query, onQueryChange, onSubmit, isLoading }) => {
  const [glowVars, setGlowVars] = useState({
    '--glow-spread': '2px',
    '--glow-blur': '8px',
  });

  useEffect(() => {
    const wordCount = query.trim().split(/\s+/).filter(Boolean).length;

    // Start with a base glow and increase it with word count
    const baseSpread = 2;
    const baseBlur = 8;

    // Increase spread and blur, but cap the values to prevent excessive glow
    const spread = Math.min(baseSpread + wordCount * 1.5, 15);
    const blur = Math.min(baseBlur + wordCount * 2, 30);

    setGlowVars({
      '--glow-spread': `${spread}px`,
      '--glow-blur': `${blur}px`,
    });
  }, [query]);

  return (
    <form onSubmit={onSubmit} className="w-full max-w-4xl mx-auto">
      <div className="relative" style={glowVars as React.CSSProperties}>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Ask AI a question about your code..."
          disabled={isLoading}
          className="w-full bg-zinc-700 border border-zinc-600 rounded-full py-3 pl-6 pr-20 text-zinc-100 placeholder-zinc-400 focus:outline-none transition-all duration-300 ease-out disabled:opacity-50 hover:border-lime-500 focus:border-lime-500 hover:shadow-[0_0_var(--glow-blur)_var(--glow-spread)_theme(colors.lime.500/0.4)] focus:shadow-[0_0_var(--glow-blur)_var(--glow-spread)_theme(colors.lime.500/0.4)]"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-lime-600 hover:bg-lime-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-full p-2.5 text-white transition-colors"
          aria-label="Send chat message"
        >
          {isLoading ? <LoadingSpinner /> : <SendIcon />}
        </button>
      </div>
    </form>
  );
};

export default ChatBar;