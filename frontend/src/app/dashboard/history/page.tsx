'use client';

import React from 'react';
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';

export default function WorkoutHistoryPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading workout history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xl">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workout History</h1>
            <p className="text-sm text-gray-500">Track your workout progress over time</p>
          </div>
        </div>
        <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>All time</option>
        </select>
      </div>

      {/* Empty State with Animation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg className="h-full w-full animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts logged yet</h3>
          <p className="text-gray-500 mb-6">Start your fitness journey by generating your first WOD</p>
          <Link
            href="/dashboard/generate"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Generate WOD
            <svg
              className="ml-2 -mr-1 h-4 w-4 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
} 