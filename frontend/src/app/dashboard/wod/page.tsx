'use client';

import React, { useState } from 'react';

export default function GenerateWodPage() {
  const [loading, setLoading] = useState(false);
  const [generatedWod, setGeneratedWod] = useState<string | null>(null);

  const handleGenerateWod = async () => {
    try {
      setLoading(true);
      // TODO: Implement WOD generation API call
      // For now, just show a placeholder
      setGeneratedWod("Sample WOD - Coming Soon!");
    } catch (error) {
      console.error('Error generating WOD:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Workout of the Day</h1>
        
        <div className="space-y-6">
          {/* Workout Generation Form */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Workout Preferences</h2>
            
            {/* TODO: Add form fields for workout preferences */}
            
            <button
              onClick={handleGenerateWod}
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Generating...' : 'Generate WOD'}
            </button>
          </div>

          {/* Generated Workout Display */}
          {generatedWod && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Workout</h2>
              <div className="prose max-w-none">
                <p>{generatedWod}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 