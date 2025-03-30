'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';

interface WODRequestFormProps {
  onSubmit: (data: WODRequestData) => Promise<void>;
  regenerationCount?: number;
}

export interface WODRequestData {
  userId: string;
  preferences: {
    workoutType: string;
    duration: string;
    intensity: string;
    equipment: string[];
    focus: string[];
  };
  profile: {
    age: string;
    sex: string;
    fitnessLevel: string;
    goals: string[];
    injuries: string[];
  };
}

interface FormErrors {
  preferences: {
    workoutType?: string;
    duration?: string;
    intensity?: string;
    equipment?: string;
    focus?: string;
  };
}

export default function WODRequestForm({ onSubmit, regenerationCount = 0 }: WODRequestFormProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({
    preferences: {},
  });

  const [formData, setFormData] = useState<WODRequestData>({
    userId: user?.id || '',
    preferences: {
      workoutType: 'strength',
      duration: '30-45',
      intensity: 'moderate',
      equipment: [],
      focus: [],
    },
    profile: {
      age: user?.ageRange || '',
      sex: user?.sex || '',
      fitnessLevel: user?.fitnessLevel || '',
      goals: [],
      injuries: [],
    },
  });

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      preferences: {},
    };

    let isValid = true;

    // Validate workout type
    if (!formData.preferences.workoutType) {
      errors.preferences.workoutType = 'Please select a workout type';
      isValid = false;
    }

    // Validate duration
    if (!formData.preferences.duration) {
      errors.preferences.duration = 'Please select a duration';
      isValid = false;
    }

    // Validate intensity
    if (!formData.preferences.intensity) {
      errors.preferences.intensity = 'Please select an intensity level';
      isValid = false;
    }

    // Validate equipment (at least one option)
    if (formData.preferences.equipment.length === 0) {
      errors.preferences.equipment = 'Please select at least one piece of equipment';
      isValid = false;
    }

    // Validate focus areas (at least one option)
    if (formData.preferences.focus.length === 0) {
      errors.preferences.focus = 'Please select at least one focus area';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    if (regenerationCount >= 3) {
      setError('You have reached the maximum number of regenerations. Please try again later.');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workout');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (field: keyof typeof formData.preferences, value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
    // Clear error when user makes a change
    if (formErrors.preferences[field]) {
      setFormErrors(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [field]: undefined,
        },
      }));
    }
  };

  const handleProfileChange = (field: keyof typeof formData.profile, value: any) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading form...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Age Range:</span> {user.ageRange}
          </div>
          <div>
            <span className="font-medium">Sex:</span> {user.sex}
          </div>
          <div>
            <span className="font-medium">Fitness Level:</span> {user.fitnessLevel}
          </div>
          <div>
            <span className="font-medium">Experience:</span> {user.experience}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Preferences</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workout Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.preferences.workoutType}
                onChange={(e) => handlePreferenceChange('workoutType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.preferences.workoutType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a workout type</option>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="hiit">HIIT</option>
                <option value="endurance">Endurance</option>
                <option value="flexibility">Flexibility</option>
              </select>
              {formErrors.preferences.workoutType && (
                <p className="mt-1 text-sm text-red-600">{formErrors.preferences.workoutType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.preferences.duration}
                onChange={(e) => handlePreferenceChange('duration', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.preferences.duration ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select duration</option>
                <option value="15-30">15-30 minutes</option>
                <option value="30-45">30-45 minutes</option>
                <option value="45-60">45-60 minutes</option>
                <option value="60+">60+ minutes</option>
              </select>
              {formErrors.preferences.duration && (
                <p className="mt-1 text-sm text-red-600">{formErrors.preferences.duration}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intensity <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.preferences.intensity}
                onChange={(e) => handlePreferenceChange('intensity', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.preferences.intensity ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select intensity</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="intense">Intense</option>
                <option value="very-intense">Very Intense</option>
              </select>
              {formErrors.preferences.intensity && (
                <p className="mt-1 text-sm text-red-600">{formErrors.preferences.intensity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Available <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Bodyweight', 'Dumbbells', 'Kettlebells', 'Resistance Bands', 'Pull-up Bar', 'None'].map((equipment) => (
                  <label key={equipment} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferences.equipment.includes(equipment.toLowerCase())}
                      onChange={(e) => {
                        const newEquipment = e.target.checked
                          ? [...formData.preferences.equipment, equipment.toLowerCase()]
                          : formData.preferences.equipment.filter(e => e !== equipment.toLowerCase());
                        handlePreferenceChange('equipment', newEquipment);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{equipment}</span>
                  </label>
                ))}
              </div>
              {formErrors.preferences.equipment && (
                <p className="mt-1 text-sm text-red-600">{formErrors.preferences.equipment}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Focus Areas <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Upper Body', 'Lower Body', 'Core', 'Full Body', 'Cardio', 'Flexibility'].map((focus) => (
                  <label key={focus} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferences.focus.includes(focus.toLowerCase())}
                      onChange={(e) => {
                        const newFocus = e.target.checked
                          ? [...formData.preferences.focus, focus.toLowerCase()]
                          : formData.preferences.focus.filter(f => f !== focus.toLowerCase());
                        handlePreferenceChange('focus', newFocus);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{focus}</span>
                  </label>
                ))}
              </div>
              {formErrors.preferences.focus && (
                <p className="mt-1 text-sm text-red-600">{formErrors.preferences.focus}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm mt-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Regenerations remaining: {3 - regenerationCount}
          </div>
          <button
            type="submit"
            disabled={isLoading || regenerationCount >= 3}
            className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              (isLoading || regenerationCount >= 3) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Generating Workout...' : 'Generate Workout'}
          </button>
        </div>
      </form>
    </div>
  );
} 