'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { completeProfile } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { EquipmentInput } from "@/components/ui/equipment-input";
import jwt_decode from 'jwt-decode';

interface DecodedToken {
  name?: string;
  email?: string;
  sub?: string;
  exp?: number;
}

type FormData = {
  ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
  sex?: "male" | "female" | "other";
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  goals: Array<"weight loss" | "muscle gain" | "strength" | "endurance" | "power" | "flexibility" | "general fitness">;
  injuriesOrLimitations?: string[];
  availableEquipment: string[];
  preferredTrainingDays?: Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday">;
  preferredWorkoutDuration?: "short" | "medium" | "long";
  locationPreference?: "gym" | "home" | "park" | "indoor" | "outdoor" | "both";
};

const FITNESS_GOALS = [
  "weight loss",
  "muscle gain",
  "strength",
  "endurance",
  "power",
  "flexibility",
  "general fitness"
] as const;

const FITNESS_LEVELS = [
  "beginner",
  "intermediate",
  "advanced"
] as const;

const AGE_RANGES = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+"
] as const;

const SEX_OPTIONS = [
  "male",
  "female",
  "other"
] as const;

const TRAINING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
] as const;

const WORKOUT_DURATIONS = [
  "short",
  "medium",
  "long"
] as const;

const LOCATION_PREFERENCES = [
  "gym",
  "home",
  "park",
  "indoor",
  "outdoor",
  "both"
] as const;

const INJURY_CATEGORIES = [
  "Back",
  "Knee",
  "Shoulder",
  "Wrist",
  "Ankle",
  "Hip",
  "Neck",
  "None"
] as const;

const GYM_LOCATIONS = [
  "CrossFit Gym",
  "Garage Gym",
  "Mainstream Gym (Globo Gym)",
  "Home Gym",
  "Outdoor/No Gym",
  "Other"
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [tokenError, setTokenError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    ageRange: undefined,
    sex: undefined,
    fitnessLevel: "beginner",
    goals: [],
    injuriesOrLimitations: [],
    availableEquipment: [],
    preferredTrainingDays: [],
    preferredWorkoutDuration: "medium",
    locationPreference: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    const validateAndDecodeToken = () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setTokenError('No authentication token found. Please log in again.');
        router.push('/login');
        return;
      }

      try {
        const decoded = jwt_decode<DecodedToken>(token);
        
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          setTokenError('Your session has expired. Please log in again.');
          router.push('/login');
          return;
        }

        // Validate required fields
        if (!decoded.name) {
          console.warn('Token missing user name');
        } else {
          setUserName(decoded.name);
        }

        if (!decoded.email) {
          console.warn('Token missing user email');
        } else {
          setUserEmail(decoded.email);
        }

        if (!decoded.sub) {
          console.warn('Token missing user ID');
        }

      } catch (error) {
        console.error('Error decoding token:', error);
        setTokenError('Invalid authentication token. Please log in again.');
        router.push('/login');
      }
    };

    validateAndDecodeToken();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data
      const { isValid, errors } = await validateProfile(formData);
      if (!isValid) {
        setValidationErrors(errors);
        return;
      }

      // Submit profile data
      await completeProfile(formData);
      
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof FormData]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMultiSelect = (name: keyof FormData, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when user makes a selection
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Add effect to monitor form state changes
  useEffect(() => {
    console.log('Form Data Updated:', {
      sex: `"${formData.sex}"`,
      ageRange: `"${formData.ageRange}"`,
      fitnessLevel: `"${formData.fitnessLevel}"`,
      isValid: Boolean(formData.sex && formData.ageRange && formData.fitnessLevel)
    });
  }, [formData]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please provide your fitness information to get personalized workouts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Age Range */}
            <div>
              <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700">
                Age Range
              </label>
              <select
                id="ageRange"
                name="ageRange"
                value={formData.ageRange || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.ageRange ? 'border-red-300' : 'border-gray-300'
                } bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
              >
                <option value="">Select your age range</option>
                {AGE_RANGES.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
              {validationErrors.ageRange && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.ageRange}</p>
              )}
            </div>

            {/* Sex */}
            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                Sex
              </label>
              <select
                id="sex"
                name="sex"
                value={formData.sex || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.sex ? 'border-red-300' : 'border-gray-300'
                } bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
              >
                <option value="">Select your sex</option>
                {SEX_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {validationErrors.sex && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.sex}</p>
              )}
            </div>

            {/* Fitness Level */}
            <div>
              <label htmlFor="fitnessLevel" className="block text-sm font-medium text-gray-700">
                Fitness Level
              </label>
              <select
                id="fitnessLevel"
                name="fitnessLevel"
                required
                value={formData.fitnessLevel}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.fitnessLevel ? 'border-red-300' : 'border-gray-300'
                } bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
              >
                <option value="">Select your fitness level</option>
                {FITNESS_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              {validationErrors.fitnessLevel && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.fitnessLevel}</p>
              )}
            </div>

            {/* Goals */}
            <div>
              <label htmlFor="goals" className="block text-sm font-medium text-gray-700">
                Fitness Goals
              </label>
              <select
                id="goals"
                name="goals"
                multiple
                required
                value={formData.goals}
                onChange={(e) => handleMultiSelect('goals', Array.from(e.target.selectedOptions, option => option.value))}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.goals ? 'border-red-300' : 'border-gray-300'
                } bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px]`}
              >
                {FITNESS_GOALS.map(goal => (
                  <option key={goal} value={goal}>{goal}</option>
                ))}
              </select>
              {validationErrors.goals && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.goals}</p>
              )}
            </div>

            {/* Equipment */}
            <div>
              <label htmlFor="availableEquipment" className="block text-sm font-medium text-gray-700">
                Available Equipment
              </label>
              <EquipmentInput
                value={formData.availableEquipment}
                onChange={(value) => handleMultiSelect('availableEquipment', value)}
                error={validationErrors.availableEquipment}
              />
            </div>

            {/* Training Days */}
            <div>
              <label htmlFor="preferredTrainingDays" className="block text-sm font-medium text-gray-700">
                Preferred Training Days
              </label>
              <select
                id="preferredTrainingDays"
                name="preferredTrainingDays"
                multiple
                value={formData.preferredTrainingDays || []}
                onChange={(e) => handleMultiSelect('preferredTrainingDays', Array.from(e.target.selectedOptions, option => option.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px]"
              >
                {TRAINING_DAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            {/* Workout Duration */}
            <div>
              <label htmlFor="preferredWorkoutDuration" className="block text-sm font-medium text-gray-700">
                Preferred Workout Duration
              </label>
              <select
                id="preferredWorkoutDuration"
                name="preferredWorkoutDuration"
                value={formData.preferredWorkoutDuration}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.preferredWorkoutDuration ? 'border-red-300' : 'border-gray-300'
                } bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
              >
                {WORKOUT_DURATIONS.map(duration => (
                  <option key={duration} value={duration}>{duration}</option>
                ))}
              </select>
              {validationErrors.preferredWorkoutDuration && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.preferredWorkoutDuration}</p>
              )}
            </div>

            {/* Location Preference */}
            <div>
              <label htmlFor="locationPreference" className="block text-sm font-medium text-gray-700">
                Preferred Workout Location
              </label>
              <select
                id="locationPreference"
                name="locationPreference"
                value={formData.locationPreference || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.locationPreference ? 'border-red-300' : 'border-gray-300'
                } bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
              >
                <option value="">Select your preferred location</option>
                {LOCATION_PREFERENCES.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              {validationErrors.locationPreference && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.locationPreference}</p>
              )}
            </div>

            {/* Injuries or Limitations */}
            <div>
              <label htmlFor="injuriesOrLimitations" className="block text-sm font-medium text-gray-700">
                Injuries or Limitations
              </label>
              <select
                id="injuriesOrLimitations"
                name="injuriesOrLimitations"
                multiple
                value={formData.injuriesOrLimitations || []}
                onChange={(e) => handleMultiSelect('injuriesOrLimitations', Array.from(e.target.selectedOptions, option => option.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px]"
              >
                {INJURY_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isSubmitting ? 'Submitting...' : 'Complete Profile'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 