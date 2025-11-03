'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthUser, ProcessQuestion } from '@/types';

export default function NewProcessPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<ProcessQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({ question: '', required: true });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    newQuestions.forEach((q, i) => q.order = i);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/processes', {
        method: 'POST',
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
        const process = await response.json();
        router.push(`/processes/${process.id}`);
      }
    } catch (error) {
      console.error('Error creating process:', error);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Process</h2>

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
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
                placeholder="e.g., Customer Onboarding Process"
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
                placeholder="Describe this process..."
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
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === questions.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
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
              <Link
                href="/processes"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Creating...' : 'Create Process'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
