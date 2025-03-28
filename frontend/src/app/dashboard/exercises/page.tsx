'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import WODRequestForm, { WODRequestData } from '@/components/workout/WODRequestForm';
import WODDisplay from '@/components/workout/WODDisplay';
import { generateWOD, saveWOD, WODResponse, WODError } from '@/services/workoutService';

export default function ExerciseLibraryPage() {
  const { user } = useUser();
  const [generatedWOD, setGeneratedWOD] = useState<WODResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleWODSubmit = async (data: WODRequestData) => {
    try {
      setError(null);
      if (!user?.id) {
        throw new WODError('User ID is required to generate a workout');
      }
      const wod = await generateWOD(data, user.id);
      setGeneratedWOD(wod);
      setRegenerationCount(prev => prev + 1);
    } catch (error) {
      console.error('Error generating WOD:', error);
      if (error instanceof WODError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while generating the workout');
      }
      throw error;
    }
  };

  const handleSaveWOD = async () => {
    if (!generatedWOD) return;
    
    setIsSaving(true);
    setError(null);
    try {
      await saveWOD(generatedWOD);
      // You could add a success message or redirect here
    } catch (error) {
      console.error('Error saving WOD:', error);
      if (error instanceof WODError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while saving the workout');
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeedback = async (rating: 'positive' | 'negative') => {
    if (!generatedWOD) return;
    
    setIsFeedbackLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wod/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wodId: generatedWOD.wodId,
          rating,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new WODError(
          responseData.message || 'Failed to submit feedback',
          response.status,
          responseData.code
        );
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      if (error instanceof WODError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while submitting feedback');
      }
      throw error;
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedWOD(null);
    setError(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading exercise library...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xl">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exercise Library</h1>
            <p className="text-sm text-gray-500">Generate personalized workouts based on your preferences</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!generatedWOD ? (
        <WODRequestForm 
          onSubmit={handleWODSubmit} 
          regenerationCount={regenerationCount}
        />
      ) : (
        <div className="space-y-4">
          <WODDisplay
            wod={generatedWOD}
            onSave={handleSaveWOD}
            onFeedback={handleFeedback}
            isLoading={isSaving}
            isFeedbackLoading={isFeedbackLoading}
          />
          {regenerationCount < 3 && (
            <div className="flex justify-center">
              <button
                onClick={handleRegenerate}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Generate a different workout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 