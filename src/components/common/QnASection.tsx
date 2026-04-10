import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { QnAItem } from '../../services/firebase/settings';

interface QnASectionProps {
  qnaList: QnAItem[];
}

export function QnASection({ qnaList }: QnASectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!qnaList || qnaList.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <HelpCircle className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Tanya Jawab (FAQ)</h2>
      </div>
      <div className="space-y-3">
        {qnaList.map((item, index) => (
          <div 
            key={index} 
            className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-200"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
            >
              <span className="font-medium text-gray-900 pr-4">{item.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-indigo-600 shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
              )}
            </button>
            
            {openIndex === index && (
              <div className="p-4 pt-0 text-gray-600 leading-relaxed border-t border-gray-100 mt-2">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
