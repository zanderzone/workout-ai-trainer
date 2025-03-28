'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';

export default function ExerciseLibraryPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading exercise library...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Exercise Library</h1>
            <p className="text-sm text-gray-500">Browse and learn about different exercises</p>
          </div>
        </div>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <option>All Categories</option>
            <option>Strength</option>
            <option>Cardio</option>
            <option>Flexibility</option>
            <option>Bodyweight</option>
            <option>Equipment</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example Exercise Cards with Hover Effects */}
        <div className="bg-white rounded-lg shadow overflow-hidden transform hover:scale-105 transition-all duration-200">
          <div className="aspect-w-16 aspect-h-9 bg-gray-200 group">
            <div className="flex items-center justify-center h-full group-hover:bg-blue-50 transition-colors duration-200">
              <svg className="h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">Push-ups</h3>
            <p className="mt-1 text-sm text-gray-500">Upper body strength exercise</p>
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Bodyweight
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden transform hover:scale-105 transition-all duration-200">
          <div className="aspect-w-16 aspect-h-9 bg-gray-200 group">
            <div className="flex items-center justify-center h-full group-hover:bg-blue-50 transition-colors duration-200">
              <svg className="h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">Squats</h3>
            <p className="mt-1 text-sm text-gray-500">Lower body strength exercise</p>
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Bodyweight
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden transform hover:scale-105 transition-all duration-200">
          <div className="aspect-w-16 aspect-h-9 bg-gray-200 group">
            <div className="flex items-center justify-center h-full group-hover:bg-blue-50 transition-colors duration-200">
              <svg className="h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">Running</h3>
            <p className="mt-1 text-sm text-gray-500">Cardiovascular exercise</p>
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Cardio
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Load More Button with Animation */}
      <div className="flex justify-center">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
        >
          Load More Exercises
          <svg
            className="ml-2 -mr-1 h-4 w-4 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
} 