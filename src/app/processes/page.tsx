'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthUser, Process, ProcessQuestion } from '@/types';

export default function ProcessesPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      loadProcesses();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Processes</h2>
            <Link
              href="/processes/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Create Process
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {processes.map((process) => (
                <li key={process.id}>
                  <Link href={`/processes/${process.id}`}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {process.title}
                          </p>
                          {process.description && (
                            <p className="mt-1 text-sm text-gray-500">{process.description}</p>
                          )}
                          {process.questions && Array.isArray(process.questions) && (
                            <p className="mt-1 text-xs text-gray-400">
                              {process.questions.length} question(s)
                            </p>
                          )}
                        </div>
                        <div className="ml-5 flex-shrink-0">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              {processes.length === 0 && (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No processes found. Create your first process to get started.
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
