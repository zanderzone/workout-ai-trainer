'use client';

import React from 'react';
import { WODResponse } from '@/services/workoutService';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface WODDisplayProps {
  wod: WODResponse;
  onSave?: () => Promise<void>;
  onFeedback?: (rating: 'positive' | 'negative') => Promise<void>;
  isLoading?: boolean;
  isFeedbackLoading?: boolean;
}

export default function WODDisplay({ 
  wod, 
  onSave, 
  onFeedback,
  isLoading,
  isFeedbackLoading 
}: WODDisplayProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{wod.name}</h2>
            <p className="text-gray-600">{wod.description}</p>
            <div className="mt-4 flex space-x-4 text-sm text-gray-500">
              <span>Duration: {wod.duration}</span>
              <span>Intensity: {wod.intensity}</span>
            </div>
          </div>
          {onFeedback && (
            <div className="flex space-x-2">
              <button
                onClick={() => onFeedback('positive')}
                disabled={isFeedbackLoading}
                className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors duration-200"
                title="Like this workout"
              >
                <ThumbsUp className="w-6 h-6" />
              </button>
              <button
                onClick={() => onFeedback('negative')}
                disabled={isFeedbackLoading}
                className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
                title="Dislike this workout"
              >
                <ThumbsDown className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Exercises</h3>
        <div className="space-y-4">
          {wod.exercises.map((exercise, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{exercise.name}</h4>
              <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Sets:</span> {exercise.sets}
                </div>
                <div>
                  <span className="font-medium">Reps:</span> {exercise.reps}
                </div>
                <div>
                  <span className="font-medium">Rest:</span> {exercise.rest}
                </div>
              </div>
              {exercise.notes && (
                <p className="mt-2 text-sm text-gray-600">{exercise.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Scaling Options</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Beginner</h4>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
              {wod.scaling.beginner.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Intermediate</h4>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
              {wod.scaling.intermediate.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Advanced</h4>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
              {wod.scaling.advanced.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Tips</h3>
        <ul className="list-disc list-inside text-sm text-gray-600">
          {wod.tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>

      {onSave && (
        <button
          onClick={onSave}
          disabled={isLoading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Saving...' : 'Save Workout'}
        </button>
      )}
    </div>
  );
} 