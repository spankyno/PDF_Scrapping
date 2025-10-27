
import React from 'react';
import TrashIcon from './icons/TrashIcon';
import type { Question } from '../types';

interface QuestionRowProps {
  item: Question;
  onQuestionChange: (id: string, newText: string) => void;
  onRemove: (id: string) => void;
  isLoading: boolean;
}

const QuestionRow: React.FC<QuestionRowProps> = ({ item, onQuestionChange, onRemove, isLoading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start bg-gray-800/50 p-4 rounded-lg">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={item.question}
          onChange={(e) => onQuestionChange(item.id, e.target.value)}
          placeholder="Escriba su pregunta aquí..."
          disabled={isLoading}
          className="w-full bg-gray-900/50 border border-gray-700 rounded-md px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-60"
        />
        <button
          onClick={() => onRemove(item.id)}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
          aria-label="Remove question"
        >
          <TrashIcon />
        </button>
      </div>
      <div className="min-h-[42px] bg-gray-900/70 border border-gray-700/50 rounded-md px-3 py-2 text-gray-300 relative">
        {isLoading && !item.answer && (
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse mx-1"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse mx-1" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse mx-1" style={{animationDelay: '0.4s'}}></div>
           </div>
        )}
        {!isLoading && !item.answer && <span className="text-gray-500 italic">La respuesta aparecerá aquí...</span>}
        {item.answer && <p className="whitespace-pre-wrap">{item.answer}</p>}
      </div>
    </div>
  );
};

export default QuestionRow;
