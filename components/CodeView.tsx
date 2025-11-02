import React from 'react';
import { Correction } from '../types';

interface CodeViewProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  diff: Correction[] | null;
  isLoading: boolean;
  placeholder: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const DiffLine: React.FC<{ line: Correction }> = ({ line }) => {
  if (line.isError) {
    return (
      <>
        <div className="flex text-sm font-mono">
          <div className="flex-shrink-0 w-12 text-right pr-4 text-red-400 opacity-50">{line.lineNumber}</div>
          <div className="flex-grow pl-2 pr-4 bg-red-900/20 border-l-2 border-red-500">
            <span className="text-red-400 mr-2">-</span>
            <span className="text-zinc-400 whitespace-pre-wrap">{line.original}</span>
          </div>
        </div>
        <div className="flex text-sm font-mono mt-1">
          <div className="flex-shrink-0 w-12 text-right pr-4 text-green-400 opacity-50"></div>
          <div className="flex-grow pl-2 pr-4 bg-green-900/20 border-l-2 border-green-500">
            <span className="text-green-400 mr-2">+</span>
            <span className="text-zinc-200 whitespace-pre-wrap">{line.corrected}</span>
          </div>
        </div>
        <div className="flex text-xs font-sans text-zinc-400 my-2">
            <div className="flex-shrink-0 w-12"></div>
            <div className="flex-grow pl-3 pr-4">
                <span className="font-bold">Explanation:</span> {line.explanation}
            </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex text-sm font-mono">
      <div className="flex-shrink-0 w-12 text-right pr-4 text-zinc-500">{line.lineNumber}</div>
      <div className="flex-grow pl-3 pr-4">
        <span className="text-zinc-200 whitespace-pre-wrap">{line.original}</span>
      </div>
    </div>
  );
};

const CodeView: React.FC<CodeViewProps> = ({ code, onCodeChange, diff, isLoading, placeholder, onFocus, onBlur }) => {
  if (diff) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-grow p-4 overflow-auto">
          <div className="space-y-1">
            {diff.map((line) => (
              <DiffLine key={`${line.lineNumber}-${line.original}`} line={line} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <textarea
      value={code}
      onChange={(e) => onCodeChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      className="w-full h-full p-4 font-mono text-sm text-zinc-100 bg-transparent resize-none outline-none placeholder:text-zinc-500"
      disabled={isLoading}
    />
  );
};

export default CodeView;