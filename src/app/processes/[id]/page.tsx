'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AuthUser, Process, ProcessQuestion } from '@/types';

export default function ProcessDetailPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [process, setProcess] = useState<Process | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<ProcessQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({ question: '', required: true });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const processId = params.id as string;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadProcess();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    }
  }, [router, processId]);

  const loadProcess = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/processes/${processId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProcess(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
      }
    } catch (error) {
      console.error('Error loading process:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    if (!newQuestion.question.trim()) return;

    const question: ProcessQuestion = {
      id: `q-${Date.now()}-${Math.random()}`,
      question: newQuestion.question,
      required: newQuestion.required,
      order: questions.length
    };

    setQuestions([...questions, question]);
    setNewQuestion({ question: '', required: true });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id).map((q, index) => ({ ...q, order: index })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/processes/${processId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          questions
        })
      });

      if (response.ok) {
        await loadProcess();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating process:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Process not found</p>
          <Link href="/processes" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
            Back to Processes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/processes" className="text-xl font-semibold text-gray-900">
                Training AI
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Process' : process.title}
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Edit
              </button>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            {isEditing ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Process Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Questions
                  </label>

                  <div className="space-y-4 mb-4">
                    {questions.map((q, index) => (
                      <div key={q.id} className="flex items-start space-x-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">Q{index + 1}:</span>
                            <span className={`text-xs px-2 py-1 rounded ${q.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                              {q.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{q.question}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter a question..."
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addQuestion();
                        }
                      }}
                    />
                    <label className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white">
                      <input
                        type="checkbox"
                        checked={newQuestion.required}
                        onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                      />
                      <span className="text-sm text-gray-700">Required</span>
                    </label>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Add Question
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      loadProcess();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !title.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {process.description && (
                  <p className="text-gray-600 mb-6">{process.description}</p>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Questions</h3>
                  <div className="space-y-3">
                    {questions.length > 0 ? (
                      questions.map((q, index) => (
                        <div key={q.id} className="p-3 border border-gray-200 rounded-md">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">Q{index + 1}:</span>
                            <span className={`text-xs px-2 py-1 rounded ${q.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                              {q.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{q.question}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No questions added yet.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    href={`/interview?processId=${processId}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Start Interview
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
