import React, { useState } from 'react';
import { X, CheckCircle, Send } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';

interface SurveyQuestion {
  id: string;
  type: 'single' | 'multiple' | 'essay';
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyForm {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

interface Props {
  survey: SurveyForm;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SurveyModal({ survey, userId, onClose, onSuccess }: Props) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required questions
    for (const q of survey.questions) {
      if (q.required && !answers[q.id]) {
        toast.error(`Pertanyaan "${q.question}" harus diisi`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. Save survey response
      await addDoc(collection(db, 'survey_responses'), {
        surveyId: survey.id,
        userId,
        answers,
        createdAt: Date.now()
      });

      // 2. Sync phone number to user profile if found in answers
      const phoneQuestion = survey.questions.find(q => 
        q.question.toLowerCase().includes('nomor telepon') || 
        q.question.toLowerCase().includes('no telp') ||
        q.question.toLowerCase().includes('phone number')
      );

      if (phoneQuestion && answers[phoneQuestion.id]) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          phoneNumber: answers[phoneQuestion.id],
          updatedAt: Date.now()
        });
      }

      toast.success('Terima kasih! Jawaban Anda telah disimpan.');
      onSuccess();
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Gagal mengirim jawaban');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b flex justify-between items-center bg-indigo-600 text-white">
          <div>
            <h2 className="text-xl font-bold">{survey.title}</h2>
            <p className="text-indigo-100 text-sm">{survey.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {survey.questions.map((q, index) => (
            <div key={q.id} className="space-y-4">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </span>
                <label className="text-lg font-bold text-gray-900">
                  {q.question}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>

              <div className="ml-11">
                {q.type === 'essay' ? (
                  <textarea
                    required={q.required}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                    placeholder="Tulis jawaban Anda di sini..."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  />
                ) : q.type === 'single' ? (
                  <div className="space-y-3">
                    {q.options?.map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={q.id}
                          required={q.required}
                          checked={answers[q.id] === opt}
                          onChange={() => handleAnswerChange(q.id, opt)}
                          className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {q.options?.map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={(answers[q.id] || []).includes(opt)}
                          onChange={(e) => {
                            const current = answers[q.id] || [];
                            if (e.target.checked) {
                              handleAnswerChange(q.id, [...current, opt]);
                            } else {
                              handleAnswerChange(q.id, current.filter((item: string) => item !== opt));
                            }
                          }}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-gray-700 font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </form>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-70 transition-all"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
            Kirim Jawaban
          </button>
        </div>
      </div>
    </div>
  );
}
