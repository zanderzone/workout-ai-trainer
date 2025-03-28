'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import WODRequestForm, { WODRequestData } from '@/components/workout/WODRequestForm';
import WODDisplay from '@/components/workout/WODDisplay';
import { generateWOD, saveWOD, WODResponse } from '@/services/workoutService';

export default function ExerciseLibraryPage() {
  const { user } = useUser();
  const [generatedWOD, setGeneratedWOD] = useState<WODResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleWODSubmit = async (data: WODRequestData) => {
    try {
      const wod = await generateWOD(data);
      setGeneratedWOD(wod);
    } catch (error) {
      console.error('Error generating WOD:', error);
      throw error;
    }
  };

  const handleSaveWOD = async () => {
    if (!generatedWOD) return;
    
    setIsSaving(true);
    try {
      await saveWOD(generatedWOD);
      // You could add a success message or redirect here
    } catch (error) {
      console.error('Error saving WOD:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
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

      {!generatedWOD ? (
        <WODRequestForm onSubmit={handleWODSubmit} />
      ) : (
        <WODDisplay
          wod={generatedWOD}
          onSave={handleSaveWOD}
          isLoading={isSaving}
        />
      )}
    </div>
  );
} 