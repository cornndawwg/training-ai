'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthUser, Role, Process, ProcessQuestion, InterviewSession } from '@/types';
import ScreenshotUpload from '@/components/ScreenshotUpload';

function InterviewContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<ProcessQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, { text: string; screenshots: string[]; files?: File[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [savedResponses, setSavedResponses] = useState<Record<string, any>>({});
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadRoles();
      loadProcesses();
      
      // Check for processId in URL params
      const processId = searchParams.get('processId');
      if (processId) {
        setSelectedProcessId(processId);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, searchParams]);

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadProcesses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/processes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProcesses(data);
      }
    } catch (error) {
      console.error('Error loading processes:', error);
    }
  };

  const loadOrCreateSession = async () => {
    if (!selectedRoleId || !selectedProcessId) {
      alert('Please select both a role and a process');
      return;
    }

    setIsCreatingSession(true);
    try {
      const token = localStorage.getItem('token');
      
      // Check for existing session
      const sessionsResponse = await fetch('/api/interview/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json();
        const existingSession = sessions.find((s: any) => 
          s.roleId === selectedRoleId && 
          s.processId === selectedProcessId && 
          s.status === 'IN_PROGRESS'
        );

        if (existingSession) {
          setCurrentSession(existingSession);
          
          // Load process questions first
          const process = processes.find(p => p.id === selectedProcessId);
          if (process?.questions && Array.isArray(process.questions)) {
            const sortedQuestions = process.questions.sort((a: ProcessQuestion, b: ProcessQuestion) => (a.order || 0) - (b.order || 0));
            setQuestions(sortedQuestions);
          }
          
          // Then load session data
          await loadSessionData(existingSession);
          return;
        }
      }

      // Create new session
      const createResponse = await fetch('/api/interview/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roleId: selectedRoleId,
          processId: selectedProcessId
        })
      });

      if (createResponse.ok) {
        const session = await createResponse.json();
        setCurrentSession(session);
        
        // Load process questions
        const process = processes.find(p => p.id === selectedProcessId);
        if (process?.questions && Array.isArray(process.questions)) {
          const sortedQuestions = process.questions.sort((a: ProcessQuestion, b: ProcessQuestion) => (a.order || 0) - (b.order || 0));
          setQuestions(sortedQuestions);
        }
      }
    } catch (error) {
      console.error('Error creating/loading session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const loadSessionData = async (session: InterviewSession) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interview/sessions/${session.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const sessionData = await response.json();
        
        // Load process questions
        let processQuestions: ProcessQuestion[] = [];
        if (sessionData.process?.questions && Array.isArray(sessionData.process.questions)) {
          processQuestions = sessionData.process.questions.sort((a: ProcessQuestion, b: ProcessQuestion) => (a.order || 0) - (b.order || 0));
          setQuestions(processQuestions);
        }

        // Load existing responses - match by question text
        const responsesMap: Record<string, { text: string; screenshots: string[]; files?: File[] }> = {};
        const savedResponsesMap: Record<string, any> = {};
        
        if (sessionData.interviewResponses && processQuestions.length > 0) {
          sessionData.interviewResponses.forEach((resp: any) => {
            // Match response to question by question text
            const question = processQuestions.find(q => q.question === resp.question);
            if (question) {
              responsesMap[question.id] = {
                text: resp.response || '',
                screenshots: Array.isArray(resp.screenshotUrls) ? resp.screenshotUrls : [],
                files: []
              };
              savedResponsesMap[question.id] = resp;
            }
          });
        }
        
        setResponses(responsesMap);
        setSavedResponses(savedResponsesMap);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const saveResponse = async (questionId: string, questionText: string) => {
    if (!currentSession) return;

    const response = responses[questionId];
    if (!response) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('sessionId', currentSession.id);
      formData.append('question', questionText);
      formData.append('response', response.text || '');

      // Add screenshot files if any
      if (response.files && response.files.length > 0) {
        response.files.forEach((file) => {
          formData.append('screenshots', file);
        });
      }

      const existingResponse = savedResponses[questionId];
      const url = '/api/interview/responses';

      if (existingResponse) {
        formData.append('id', existingResponse.id);
      }

      const fetchOptions: RequestInit = {
        method: existingResponse ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      };

      const saveResponse = await fetch(url, fetchOptions);

      if (saveResponse.ok) {
        const saved = await saveResponse.json();
        setSavedResponses({ ...savedResponses, [questionId]: saved });
        
        // Clear files after successful upload
        if (response.files && response.files.length > 0) {
          setResponses({
            ...responses,
            [questionId]: {
              ...response,
              files: []
            }
          });
        }
      }
    } catch (error) {
      console.error('Error saving response:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResponseChange = (questionId: string, text: string) => {
    setResponses({
      ...responses,
      [questionId]: {
        ...(responses[questionId] || { text: '', screenshots: [], files: [] }),
        text
      }
    });
  };

  const handleScreenshotsChange = (questionId: string, screenshots: string[], files: File[]) => {
    setResponses({
      ...responses,
      [questionId]: {
        ...(responses[questionId] || { text: '', screenshots: [], files: [] }),
        screenshots,
        files: [...(responses[questionId]?.files || []), ...files]
      }
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const currentQuestion = questions[currentQuestionIndex];
      saveResponse(currentQuestion.id, currentQuestion.question);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      saveResponse(currentQuestion.id, currentQuestion.question);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleExport = async () => {
    if (!currentSession) {
      alert('No active session to export');
      return;
    }

    // Save current response first
    if (questions[currentQuestionIndex]) {
      const currentQuestion = questions[currentQuestionIndex];
      await saveResponse(currentQuestion.id, currentQuestion.question);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interview/export/${currentSession.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-${currentSession.id}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('Interview exported successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to export interview');
      }
    } catch (error) {
      console.error('Error exporting interview:', error);
      alert('Failed to export interview');
    }
  };

  const handleCompleteSession = async () => {
    if (!currentSession) return;

    // Save current response first
    if (questions[currentQuestionIndex]) {
      const currentQuestion = questions[currentQuestionIndex];
      await saveResponse(currentQuestion.id, currentQuestion.question);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interview/sessions/${currentSession.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Interview completed! You can now export it.');
      }
    } catch (error) {
      console.error('Error completing session:', error);
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

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Start Interview</h2>

            <div className="bg-white shadow rounded-lg p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Role *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                >
                  <option value="">Choose a role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Process *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedProcessId}
                  onChange={(e) => setSelectedProcessId(e.target.value)}
                >
                  <option value="">Choose a process...</option>
                  {processes.map(process => (
                    <option key={process.id} value={process.id}>{process.title}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={loadOrCreateSession}
                disabled={!selectedRoleId || !selectedProcessId || isCreatingSession}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCreatingSession ? 'Starting...' : 'Start Interview'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = currentQuestion ? (responses[currentQuestion.id] || { text: '', screenshots: [], files: [] }) : { text: '', screenshots: [], files: [] };
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(responses).filter(id => responses[id]?.text.trim()).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
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
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Interview: {currentSession.process?.title || 'Untitled Process'}
              </h2>
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Export Interview
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Role: {currentSession.role?.title} | 
              Questions: {questions.length} | 
              Answered: {answeredCount}
            </p>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {currentQuestion && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-600">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  {currentQuestion.required && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                      Required
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900">{currentQuestion.question}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response
                  </label>
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your response here..."
                    value={currentResponse.text}
                    onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                  />
                </div>

                <div>
                  <ScreenshotUpload
                    screenshots={currentResponse.screenshots || []}
                    onScreenshotsChange={(screenshots, files) => handleScreenshotsChange(currentQuestion.id, screenshots, files)}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="space-x-2">
                    <button
                      onClick={() => saveResponse(currentQuestion.id, currentQuestion.question)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <button
                        onClick={handleNext}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleCompleteSession}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Complete Interview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!currentQuestion && (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-600">No questions found for this process.</p>
              <Link href="/processes" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
                Edit Process
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    }>
      <InterviewContent />
    </Suspense>
  );
}
