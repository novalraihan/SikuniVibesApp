import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/firebase/users';
import { User } from '../../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ClipboardList, Users, Plus, Trash2, Save, X, CheckSquare, List, Type, BarChart2, Settings, ArrowLeft } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
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
  isActive: boolean;
  createdAt: number;
}

export function SurveyDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manage' | 'results'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [surveys, setSurveys] = useState<SurveyForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSurveyResults, setSelectedSurveyResults] = useState<SurveyForm | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  
  // Form State
  const [newSurvey, setNewSurvey] = useState<Partial<SurveyForm>>({
    title: '',
    description: '',
    questions: [],
    isActive: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, surveysSnapshot, responsesSnapshot] = await Promise.all([
          getAllUsers(),
          getDocs(query(collection(db, 'surveys'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'survey_responses'))
        ]);
        
        setUsers(usersData);
        setSurveys(surveysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SurveyForm)));
        setSurveyResponses(responsesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewResults = (survey: SurveyForm) => {
    setSelectedSurveyResults(survey);
    setActiveTab('results');
  };

  const getResultsForSurvey = (surveyId: string) => {
    return surveyResponses.filter(r => r.surveyId === surveyId);
  };

  const processSurveyResults = (survey: SurveyForm) => {
    const responses = getResultsForSurvey(survey.id);
    
    return survey.questions.map(q => {
      const answers = responses.map(r => r.answers?.[q.id]).filter(Boolean);
      
      if (q.type === 'essay') {
        return { ...q, results: answers };
      }
      
      const counts: Record<string, number> = {};
      answers.forEach(ans => {
        if (Array.isArray(ans)) {
          ans.forEach(a => {
            counts[a] = (counts[a] || 0) + 1;
          });
        } else {
          counts[ans] = (counts[ans] || 0) + 1;
        }
      });
      
      const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));
      return { ...q, results: chartData };
    });
  };

  const handleAddQuestion = (type: 'single' | 'multiple' | 'essay') => {
    const question: SurveyQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      question: '',
      options: type !== 'essay' ? [''] : undefined,
      required: true
    };
    setNewSurvey(prev => ({
      ...prev,
      questions: [...(prev.questions || []), question]
    }));
  };

  const handleUpdateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions?.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
  };

  const handleRemoveQuestion = (id: string) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions?.filter(q => q.id !== id)
    }));
  };

  const handleAddOption = (questionId: string) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions?.map(q => {
        if (q.id === questionId) {
          return { ...q, options: [...(q.options || []), ''] };
        }
        return q;
      })
    }));
  };

  const handleUpdateOption = (questionId: string, optionIndex: number, value: string) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions?.map(q => {
        if (q.id === questionId) {
          const newOptions = [...(q.options || [])];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    }));
  };

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions?.map(q => {
        if (q.id === questionId) {
          const newOptions = [...(q.options || [])];
          newOptions.splice(optionIndex, 1);
          return { ...q, options: newOptions };
        }
        return q;
      })
    }));
  };

  const handleSaveSurvey = async () => {
    if (!newSurvey.title) {
      toast.error('Judul survei harus diisi');
      return;
    }
    if (!newSurvey.questions || newSurvey.questions.length === 0) {
      toast.error('Tambahkan minimal satu pertanyaan');
      return;
    }

    try {
      if (editingId) {
        const docData = {
          ...newSurvey,
          updatedAt: Date.now()
        };
        await updateDoc(doc(db, 'surveys', editingId), docData);
        setSurveys(prev => prev.map(s => s.id === editingId ? { ...s, ...docData } as SurveyForm : s));
        toast.success('Survei berhasil diperbarui');
      } else {
        const docData = {
          ...newSurvey,
          createdAt: Date.now()
        };
        const docRef = await addDoc(collection(db, 'surveys'), docData);
        setSurveys(prev => [{ id: docRef.id, ...docData } as SurveyForm, ...prev]);
        toast.success('Survei berhasil disimpan');
      }
      setIsAdding(false);
      setEditingId(null);
      setNewSurvey({ title: '', description: '', questions: [], isActive: true });
    } catch (error) {
      toast.error('Gagal menyimpan survei');
    }
  };

  const handleEditSurvey = (survey: SurveyForm) => {
    setNewSurvey({
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      isActive: survey.isActive
    });
    setEditingId(survey.id);
    setIsAdding(true);
  };

  const handleDeleteSurvey = async (id: string) => {
    if (!confirm('Hapus survei ini?')) return;
    try {
      await deleteDoc(doc(db, 'surveys', id));
      setSurveys(prev => prev.filter(s => s.id !== id));
      toast.success('Survei berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus survei');
    }
  };

  const toggleSurveyStatus = async (survey: SurveyForm) => {
    try {
      await updateDoc(doc(db, 'surveys', survey.id), { isActive: !survey.isActive });
      setSurveys(prev => prev.map(s => s.id === survey.id ? { ...s, isActive: !s.isActive } : s));
      toast.success(`Survei ${!survey.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error) {
      toast.error('Gagal memperbarui status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const usersWithSurvey = users.filter(u => u.onboardingCompleted && u.onboardingData && Object.keys(u.onboardingData).length > 0);

  // Process data for charts
  const sourceData = usersWithSurvey.reduce((acc, user) => {
    const source = user.onboardingData?.source || 'Tidak diketahui';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceChartData = Object.entries(sourceData).map(([name, value]) => ({ name, value }));

  const visitCountData = usersWithSurvey.reduce((acc, user) => {
    const count = user.onboardingData?.visitCount || 'Tidak diketahui';
    acc[count] = (acc[count] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const visitChartData = Object.entries(visitCountData).map(([name, value]) => ({ name, value }));

  const attractionsData = usersWithSurvey.reduce((acc, user) => {
    const attractions = user.onboardingData?.knownAttractions || [];
    attractions.forEach((attr: string) => {
      acc[attr] = (acc[attr] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const attractionsChartData = Object.entries(attractionsData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-indigo-600" />
          Survei & Strategi
        </h1>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BarChart2 className="w-4 h-4" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'manage' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Settings className="w-4 h-4" />
            Kelola Survei
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Responden Survei</p>
                  <p className="text-2xl font-bold text-gray-900">{usersWithSurvey.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sumber Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Sumber Informasi</h2>
              <div className="h-64 min-w-0 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Frekuensi Kunjungan */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Frekuensi Kunjungan</h2>
              <div className="h-64 min-w-0 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visitChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {visitChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Wisata yang Diketahui */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Wisata Paling Populer</h2>
              <div className="h-80 min-w-0 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attractionsChartData} layout="vertical" margin={{ left: 50 }}>
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Harapan & Ekspektasi */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Harapan & Ekspektasi Pengunjung</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {usersWithSurvey.filter(u => u.onboardingData?.expectations).map((user, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-gray-800 italic">"{user.onboardingData?.expectations}"</p>
                  <p className="text-xs text-gray-500 mt-2">- {user.displayName || 'Anonim'} ({user.onboardingData?.address || 'Lokasi tidak diketahui'})</p>
                </div>
              ))}
              {usersWithSurvey.filter(u => u.onboardingData?.expectations).length === 0 && (
                <p className="text-gray-500 text-center py-4">Belum ada data harapan/ekspektasi.</p>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'manage' ? (
        <div className="space-y-6">
          {isAdding ? (
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Survei' : 'Buat Survei Baru'}
                </h2>
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Judul Survei</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Contoh: Survei Kepuasan Pelanggan"
                    value={newSurvey.title}
                    onChange={(e) => setNewSurvey(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi (Opsional)</label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                    placeholder="Berikan penjelasan singkat tentang survei ini..."
                    value={newSurvey.description}
                    onChange={(e) => setNewSurvey(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Pertanyaan</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAddQuestion('single')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                      >
                        <List className="w-3.5 h-3.5" /> + Single
                      </button>
                      <button 
                        onClick={() => handleAddQuestion('multiple')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> + Multi
                      </button>
                      <button 
                        onClick={() => handleAddQuestion('essay')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100"
                      >
                        <Type className="w-3.5 h-3.5" /> + Essay
                      </button>
                    </div>
                  </div>

                  {newSurvey.questions?.map((q, qIndex) => (
                    <div key={q.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 relative group">
                      <button 
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                          {qIndex + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          q.type === 'single' ? 'bg-blue-100 text-blue-600' :
                          q.type === 'multiple' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {q.type === 'single' ? 'Pilihan Tunggal' : q.type === 'multiple' ? 'Pilihan Ganda' : 'Essay'}
                        </span>
                      </div>

                      <input 
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 mb-4 font-bold text-gray-900"
                        placeholder="Tulis pertanyaan Anda di sini..."
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(q.id, { question: e.target.value })}
                      />

                      {q.type !== 'essay' && (
                        <div className="space-y-2 ml-8">
                          {q.options?.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <div className={`w-4 h-4 border-2 rounded-full ${q.type === 'multiple' ? 'rounded-sm' : 'rounded-full'} border-gray-300`}></div>
                              <input 
                                type="text"
                                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                                placeholder={`Opsi ${optIndex + 1}`}
                                value={opt}
                                onChange={(e) => handleUpdateOption(q.id, optIndex, e.target.value)}
                              />
                              <button 
                                onClick={() => handleRemoveOption(q.id, optIndex)}
                                className="p-1.5 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => handleAddOption(q.id)}
                            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-2"
                          >
                            <Plus className="w-3 h-3" /> Tambah Opsi
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {(!newSurvey.questions || newSurvey.questions.length === 0) && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <p className="text-gray-500">Belum ada pertanyaan. Klik tombol di atas untuk menambah.</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveSurvey}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Simpan Survei
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Daftar Survei Kustom</h2>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5" />
                  Buat Survei
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {surveys.map(survey => (
                  <div key={survey.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{survey.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{survey.description || 'Tidak ada deskripsi'}</p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEditSurvey(survey)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                          title="Edit"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleSurveyStatus(survey)}
                          className={`p-2 rounded-lg transition-colors ${survey.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                          title={survey.isActive ? 'Aktif' : 'Nonaktif'}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSurvey(survey.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Pertanyaan</span>
                            <span className="text-sm font-bold text-gray-900">{survey.questions.length}</span>
                          </div>
                          <div className="w-[1px] h-6 bg-gray-100"></div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Respon</span>
                            <span className="text-sm font-bold text-gray-900">{getResultsForSurvey(survey.id).length}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleViewResults(survey)}
                          className="text-indigo-600 text-xs font-bold hover:underline"
                        >
                          Lihat Hasil →
                        </button>
                      </div>
                  </div>
                ))}

                {surveys.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 font-bold">Belum ada survei kustom</h3>
                    <p className="text-gray-500 text-sm mt-1">Mulai buat survei untuk mendapatkan feedback lebih detail dari pengunjung.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'results' && selectedSurveyResults ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setActiveTab('manage')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-6 h-6 text-gray-500" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedSurveyResults.title}</h2>
              <p className="text-sm text-gray-500">{getResultsForSurvey(selectedSurveyResults.id).length} Respon Diterima</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {processSurveyResults(selectedSurveyResults).map((q, idx) => (
              <div key={q.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{q.question}</h3>
                </div>

                {q.type === 'essay' ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {(q.results as string[]).map((ans, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 italic">
                        "{ans}"
                      </div>
                    ))}
                    {(q.results as string[]).length === 0 && (
                      <p className="text-gray-500 text-center py-4 italic">Belum ada jawaban.</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={q.results as any[]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(q.results as any[]).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {(q.results as any[]).map((res, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">{res.name}</span>
                          <span className="text-sm font-bold text-indigo-600">{res.value}</span>
                        </div>
                      ))}
                      {(q.results as any[]).length === 0 && (
                        <p className="text-gray-500 text-center py-4 italic">Belum ada data.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
