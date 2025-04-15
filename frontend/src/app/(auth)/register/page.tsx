'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { completeProfile } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { EquipmentInput } from "@/components/ui/equipment-input";
import { jwtDecode } from 'jwt-decode';

type HeadersInit = Headers | string[][] | Record<string, string>;

interface DecodedToken {
  name?: string;
  email?: string;
  sub?: string;
  exp?: number;
}

type FormData = {
  firstName: string;
  lastName: string;
  displayName: string;
  ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
  sex?: "male" | "female" | "other";
  fitnessLevel?: "beginner" | "intermediate" | "advanced";
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

// Add validation function
const validateProfile = async (data: FormData): Promise<{ isValid: boolean; errors: Partial<Record<keyof FormData, string>> }> => {
  const errors: Partial<Record<keyof FormData, string>> = {};

  // Required fields validation
  if (!data.fitnessLevel) {
    errors.fitnessLevel = 'Fitness level is required';
  }

  if (!data.goals || data.goals.length === 0) {
    errors.goals = 'At least one fitness goal is required';
  }

  if (!data.availableEquipment || data.availableEquipment.length === 0) {
    errors.availableEquipment = 'At least one piece of equipment is required';
  }

  // Optional fields validation
  if (data.ageRange && !['18-24', '25-34', '35-44', '45-54', '55+'].includes(data.ageRange)) {
    errors.ageRange = 'Invalid age range';
  }

  if (data.sex && !['male', 'female', 'other'].includes(data.sex)) {
    errors.sex = 'Invalid sex value';
  }

  if (data.preferredTrainingDays && data.preferredTrainingDays.some(day => 
    !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day))) {
    errors.preferredTrainingDays = 'Invalid training day';
  }

  if (data.preferredWorkoutDuration && !['short', 'medium', 'long'].includes(data.preferredWorkoutDuration)) {
    errors.preferredWorkoutDuration = 'Invalid workout duration';
  }

  if (data.locationPreference && !['gym', 'home', 'park', 'indoor', 'outdoor', 'both'].includes(data.locationPreference)) {
    errors.locationPreference = 'Invalid location preference';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Add step type
type Step = 'basic' | 'fitness' | 'preferences' | 'review';

// Add tooltip component
const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block">
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
      <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
        {text}
      </div>
    </div>
  </div>
);

// Add error types
type ApiError = {
  message: string;
  code?: string;
  field?: string;
};

// Add error handling component
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry?: () => void }) => (
  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm text-red-700">{error}</p>
        {onRetry && (
          <div className="mt-2">
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-medium text-red-700 hover:text-red-600 focus:outline-none focus:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Add draft types
type DraftData = {
  formData: FormData;
  currentStep: Step;
  progress: number;
  lastUpdated: string;
};

// Add draft management functions
const saveDraft = (data: DraftData) => {
  localStorage.setItem('registrationDraft', JSON.stringify(data));
};

const loadDraft = (): DraftData | null => {
  const draft = localStorage.getItem('registrationDraft');
  return draft ? JSON.parse(draft) : null;
};

const clearDraft = () => {
  localStorage.removeItem('registrationDraft');
};

// Add DraftBanner component
const DraftBanner = ({ 
  onResume, 
  onDiscard 
}: { 
  onResume: () => void; 
  onDiscard: () => void; 
}) => (
  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm text-blue-700">
          You have a saved draft. Would you like to resume where you left off?
        </p>
        <div className="mt-2 flex space-x-4">
          <button
            type="button"
            onClick={onResume}
            className="text-sm font-medium text-blue-700 hover:text-blue-600 focus:outline-none focus:underline"
          >
            Resume Draft
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="text-sm font-medium text-blue-700 hover:text-blue-600 focus:outline-none focus:underline"
          >
            Discard Draft
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Add ConfirmationDialog component
const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | 'success';
}) => {
  if (!isOpen) return null;
  
  const colors = {
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      button: 'bg-green-600 hover:bg-green-700'
    }
  };
  
  const color = colors[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${color.bg} ${color.border}`}>
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className={`text-sm ${color.text}`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${color.button}`}
            >
              {confirmText}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {cancelText}
            </button>
            </div>
          </div>
            </div>
          </div>
  );
};

// Add analytics types
type AnalyticsEvent = {
  name: string;
  properties?: Record<string, any>;
};

// Add analytics functions
const trackEvent = (event: AnalyticsEvent) => {
  try {
    // In a real implementation, this would send to your analytics service
    console.log('Analytics Event:', event);
    
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, event.properties);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

const trackFormStep = (step: Step, action: 'view' | 'complete' | 'error') => {
  trackEvent({
    name: 'form_step',
    properties: {
      step,
      action,
      timestamp: new Date().toISOString()
    }
  });
};

const trackFormSubmission = (success: boolean, error?: string) => {
  trackEvent({
    name: 'form_submission',
    properties: {
      success,
      error,
      timestamp: new Date().toISOString()
    }
  });
};

const trackDraftAction = (action: 'save' | 'load' | 'discard') => {
  trackEvent({
    name: 'draft_action',
    properties: {
      action,
      timestamp: new Date().toISOString()
    }
  });
};

// Add step navigation component
const StepNavigation = ({ 
  currentStep, 
  onNext, 
  onPrevious, 
  isNextDisabled 
}: { 
  currentStep: Step; 
  onNext: () => void; 
  onPrevious: () => void; 
  isNextDisabled: boolean;
}) => (
  <div className="flex justify-between items-center mt-6">
    {currentStep !== 'basic' && (
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        className="mr-2"
      >
        Previous
      </Button>
    )}
    <Button
      type="button"
      onClick={onNext}
      disabled={isNextDisabled}
      className="ml-auto"
    >
      {currentStep === 'review' ? 'Register' : 'Next'}
    </Button>
      </div>
);

type StepProps = {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onMultiSelect?: (field: keyof FormData, values: string[]) => void;
  errors?: Record<string, string>;
};

const BasicInfoStep = ({ formData, onChange, errors }: StepProps) => (
  <div className="space-y-4">
    <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
    <div>
      <label className="block text-sm font-medium text-gray-700" htmlFor="ageRange">
        Age Range <span className="text-red-500">*</span>
        <Tooltip text="This helps us tailor workouts to your age group" />
      </label>
      <select
        id="ageRange"
        name="ageRange"
        value={formData.ageRange || ''}
        onChange={onChange}
        className={`mt-1 block w-full rounded-md border ${
          errors?.ageRange ? 'border-red-300' : 'border-gray-300'
        } focus:border-primary focus:ring-primary bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-1`}
      >
        <option value="">Select your age range</option>
        {AGE_RANGES.map((range) => (
          <option key={range} value={range}>{range}</option>
        ))}
      </select>
      {errors?.ageRange && (
        <p className="mt-1 text-sm text-red-600" role="alert" data-testid="ageRange-error">{errors.ageRange}</p>
      )}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700" htmlFor="sex">
        Sex <span className="text-red-500">*</span>
        <Tooltip text="This helps us customize workouts for your body type" />
      </label>
      <select
        id="sex"
        name="sex"
        value={formData.sex || ''}
        onChange={onChange}
        className={`mt-1 block w-full rounded-md border ${
          errors?.sex ? 'border-red-300' : 'border-gray-300'
        } focus:border-primary focus:ring-primary bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-1`}
      >
        <option value="">Select your sex</option>
        {SEX_OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {errors?.sex && (
        <p className="mt-1 text-sm text-red-600" role="alert" data-testid="sex-error">{errors.sex}</p>
      )}
    </div>
  </div>
);

const FitnessInfoStep = ({ formData, onChange, onMultiSelect, errors }: StepProps) => (
              <div className="space-y-4">
    <h3 className="text-lg font-medium text-gray-900">Fitness Information</h3>
                <div>
      <label htmlFor="fitnessLevel" className="block text-sm font-medium text-gray-700">
        Fitness Level <span className="text-red-500">*</span> <Tooltip text="Select your current fitness level to get appropriate workout intensity" />
                  </label>
                  <select
                    id="fitnessLevel"
                    name="fitnessLevel"
                    required
        value={formData.fitnessLevel || ''}
        onChange={onChange}
        className={`mt-1 block w-full rounded-md border ${
          errors?.fitnessLevel ? 'border-red-300' : 'border-gray-300'
        } focus:border-primary focus:ring-primary bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-1`}
                  >
                    <option value="">Select your fitness level</option>
        {FITNESS_LEVELS.map((level) => (
          <option key={level} value={level}>{level}</option>
        ))}
                  </select>
      {errors?.fitnessLevel && (
        <p className="mt-1 text-sm text-red-600" role="alert" data-testid="fitnessLevel-error">Required</p>
      )}
                </div>

                <div>
      <label htmlFor="goals" className="block text-sm font-medium text-gray-700">
        Fitness Goals <span className="text-red-500">*</span> <Tooltip text="Select your primary fitness goals to get targeted workouts" />
                  </label>
                  <select
                    id="goals"
                    name="goals"
                    multiple
        required
                    value={formData.goals}
        onChange={(e) => {
          if (onMultiSelect) {
            onMultiSelect('goals', Array.from(e.target.selectedOptions, option => option.value));
          }
        }}
        className={`mt-1 block w-full rounded-md border ${
          errors?.goals ? 'border-red-300' : 'border-gray-300'
        } focus:border-primary focus:ring-primary bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-1 min-h-[120px]`}
      >
        {FITNESS_GOALS.map((goal) => (
          <option key={goal} value={goal}>{goal}</option>
                    ))}
                  </select>
      {errors?.goals && (
        <p className="mt-1 text-sm text-red-600" data-testid="goals-error">{errors.goals}</p>
      )}
                </div>

                <div>
      <label htmlFor="availableEquipment" className="block text-sm font-medium text-gray-700">
        Available Equipment <span className="text-red-500">*</span> <Tooltip text="Select the equipment you have access to for personalized workouts" />
      </label>
      <EquipmentInput
        value={formData.availableEquipment}
        onChange={(value) => {
          if (onMultiSelect) {
            onMultiSelect('availableEquipment', value);
          }
        }}
        error={errors?.availableEquipment}
        data-testid="availableEquipment-error"
      />
    </div>
  </div>
);

const PreferencesStep = ({ formData, onChange, onMultiSelect, errors }: StepProps) => (
  <div className="space-y-4">
    <h3 className="text-lg font-medium text-gray-900">Training Preferences</h3>
    <div>
      <label htmlFor="preferredTrainingDays" className="block text-sm font-medium text-gray-700">
        Preferred Training Days <Tooltip text="Select the days you prefer to work out" />
                  </label>
                  <select
        id="preferredTrainingDays"
        name="preferredTrainingDays"
                    multiple
        value={formData.preferredTrainingDays || []}
        onChange={(e) => {
          if (onMultiSelect) {
            onMultiSelect('preferredTrainingDays', Array.from(e.target.selectedOptions, option => option.value));
          }
        }}
        className={`mt-1 block w-full rounded-md border ${
          errors?.preferredTrainingDays ? 'border-red-300' : 'border-gray-300'
        } focus:border-primary focus:ring-primary bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-1 min-h-[120px]`}
      >
        {TRAINING_DAYS.map(day => (
          <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
      {errors?.preferredTrainingDays && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errors.preferredTrainingDays}
        </p>
      )}
            </div>

                <div>
      <label htmlFor="preferredWorkoutDuration" className="block text-sm font-medium text-gray-700">
        Preferred Workout Duration <Tooltip text="Select your preferred workout length" />
                  </label>
                  <select
        id="preferredWorkoutDuration"
        name="preferredWorkoutDuration"
        value={formData.preferredWorkoutDuration}
        onChange={onChange}
        className={`mt-1 block w-full rounded-md border ${
          errors?.preferredWorkoutDuration ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
        } bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-1`}
      >
        {WORKOUT_DURATIONS.map(duration => (
          <option key={duration} value={duration}>{duration}</option>
        ))}
                  </select>
      {errors?.preferredWorkoutDuration && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errors.preferredWorkoutDuration}
        </p>
      )}
                </div>

                <div>
      <label htmlFor="locationPreference" className="block text-sm font-medium text-gray-700">
        Preferred Workout Location <Tooltip text="Select where you prefer to work out" />
                  </label>
                  <select
        id="locationPreference"
        name="locationPreference"
        value={formData.locationPreference || ''}
        onChange={onChange}
        className={`mt-1 block w-full rounded-md border ${
          errors?.locationPreference ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
        } bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-1`}
      >
        <option value="">Select your preferred location</option>
        {LOCATION_PREFERENCES.map(location => (
          <option key={location} value={location}>{location}</option>
        ))}
                  </select>
      {errors?.locationPreference && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errors.locationPreference}
        </p>
      )}
                </div>
              </div>
);

const ReviewStep = ({ formData }: { formData: FormData }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-medium text-gray-900">Review Your Profile</h3>
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>Age Range:</div>
        <div>{formData.ageRange || 'Not specified'}</div>
        <div>Sex:</div>
        <div>{formData.sex || 'Not specified'}</div>
              </div>
            </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">Fitness Information</h4>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>Fitness Level:</div>
        <div>{formData.fitnessLevel || 'Not specified'}</div>
        <div>Goals:</div>
        <div>{formData.goals.join(', ')}</div>
        <div>Equipment:</div>
        <div>{formData.availableEquipment.join(', ')}</div>
      </div>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">Training Preferences</h4>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>Training Days:</div>
        <div>{formData.preferredTrainingDays?.join(', ') || 'Not specified'}</div>
        <div>Duration:</div>
        <div>{formData.preferredWorkoutDuration || 'Not specified'}</div>
        <div>Location:</div>
        <div>{formData.locationPreference || 'Not specified'}</div>
      </div>
    </div>
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [tokenError, setTokenError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    displayName: '',
    fitnessLevel: undefined,
    goals: [],
    availableEquipment: [],
    preferredTrainingDays: undefined,
    preferredWorkoutDuration: undefined,
    locationPreference: undefined,
    ageRange: undefined,
    sex: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [progress, setProgress] = useState(25);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    const validateAndDecodeToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setTokenError('No authentication token found. Please log in again.');
        router.push('/login');
        return;
      }

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
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
          // Set display name from the token only if it's not already set
          setFormData(prev => {
            if (prev.displayName === '') {
              return {
                ...prev,
                displayName: decoded.name || ''
              };
            }
            return prev;
          });
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

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft.formData);
      setCurrentStep(draft.currentStep);
      setProgress(draft.progress);
      setHasDraft(true);
      setLastSaved(draft.lastUpdated);
    }
  }, []);

  // Auto-save draft every 30 seconds if there are changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData && currentStep && progress) {
        const draft: DraftData = {
          formData,
          currentStep,
          progress,
          lastUpdated: new Date().toISOString()
        };
        saveDraft(draft);
        setLastSaved(draft.lastUpdated);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, currentStep, progress]);

  // Handle draft resume
  const handleResumeDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft.formData);
      setCurrentStep(draft.currentStep);
      setProgress(draft.progress);
      setHasDraft(false);
      trackDraftAction('load');
    }
  };

  // Handle draft discard
  const handleDiscardDraft = () => {
    clearDraft();
    setHasDraft(false);
    setLastSaved(null);
    setShowDiscardDialog(false);
    trackDraftAction('discard');
  };

  // Track form abandonment
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formData && Object.keys(formData).length > 0) {
        trackEvent({
          name: 'form_abandonment',
          properties: {
            currentStep,
            progress,
            timestamp: new Date().toISOString()
          }
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, currentStep, progress]);

  // Save form data on changes
  useEffect(() => {
    localStorage.setItem('registrationFormData', JSON.stringify(formData));
  }, [formData]);

  // Save current step on changes
  useEffect(() => {
    localStorage.setItem('registrationStep', currentStep);
  }, [currentStep]);

  // Update step navigation with transitions
  const nextStep = () => {
    const steps: Step[] = ['basic', 'fitness', 'preferences', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(steps[currentIndex + 1]);
        setProgress(((currentIndex + 1) / (steps.length - 1)) * 100);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Add function to set step directly for testing
  const setStep = (step: Step) => {
    setCurrentStep(step);
    const steps: Step[] = ['basic', 'fitness', 'preferences', 'review'];
    const currentIndex = steps.indexOf(step);
    setProgress(((currentIndex) / (steps.length - 1)) * 100);
  };

  // Expose setStep for testing
  if (process.env.NODE_ENV === 'test') {
    (window as any).setStep = setStep;
  }

  const prevStep = () => {
    const steps: Step[] = ['basic', 'fitness', 'preferences', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(steps[currentIndex - 1]);
        setProgress(((currentIndex - 1) / (steps.length - 1)) * 100);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Track step views
  useEffect(() => {
    trackFormStep(currentStep, 'view');
  }, [currentStep]);

  useEffect(() => {
    trackFormStep(currentStep, 'view');
  }, [currentStep]);

  // Update step validation to track completion
  const validateStep = async (step: Step): Promise<boolean> => {
    const stepErrors: Record<string, string> = {};
    let isValid = true;
    
    switch (step) {
      case 'basic': {
        if (!formData.ageRange) {
          stepErrors.ageRange = 'Age range is required';
          isValid = false;
        }
        if (!formData.sex) {
          stepErrors.sex = 'Sex is required';
          isValid = false;
        }
        break;
      }
      case 'fitness': {
        if (!formData.fitnessLevel) {
          stepErrors.fitnessLevel = 'Fitness level is required';
          isValid = false;
        }
        if (!formData.goals?.length) {
          stepErrors.goals = 'At least one goal is required';
          isValid = false;
        }
        break;
      }
      case 'preferences': {
        if (!formData.preferredTrainingDays?.length) {
          stepErrors.preferredTrainingDays = 'At least one training day is required';
          isValid = false;
        }
        if (!formData.preferredWorkoutDuration) {
          stepErrors.preferredWorkoutDuration = 'Workout duration is required';
          isValid = false;
        }
        break;
      }
    }
    
    // Immediately set validation errors 
    setValidationErrors(stepErrors);
    
    if (isValid) {
      trackFormStep(step, 'complete');
    } else {
      trackFormStep(step, 'error');
    }
    
    return isValid;
  };

  // Update form submission flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 'review') return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const token = searchParams.get('token');
      if (!token) {
        throw new Error('No token provided');
      }

      await completeProfile(formData, { Authorization: `Bearer ${token}` });
      router.push('/dashboard');
    } catch (error) {
      setApiError({
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    // Immediately validate the current step before proceeding
    const stepErrors: Record<string, string> = {};
    
    // Perform validation based on the current step
    switch (currentStep) {
      case 'basic':
        if (!formData.ageRange) {
          stepErrors.ageRange = 'Age range is required';
        }
        if (!formData.sex) {
          stepErrors.sex = 'Sex is required';
        }
        break;
      case 'fitness':
        if (!formData.fitnessLevel) {
          stepErrors.fitnessLevel = 'Fitness level is required';
        }
        if (!formData.goals?.length) {
          stepErrors.goals = 'At least one goal is required';
        }
        if (!formData.availableEquipment?.length) {
          stepErrors.availableEquipment = 'At least one piece of equipment is required';
        }
        break;
      case 'preferences':
        if (!formData.preferredTrainingDays?.length) {
          stepErrors.preferredTrainingDays = 'At least one training day is required';
        }
        if (!formData.preferredWorkoutDuration) {
          stepErrors.preferredWorkoutDuration = 'Workout duration is required';
        }
        if (!formData.locationPreference) {
          stepErrors.locationPreference = 'Location preference is required';
        }
        break;
    }
    
    // Set validation errors immediately to show them in the UI
    setValidationErrors(stepErrors);
    
    // Check if there are any validation errors
    const isValid = Object.keys(stepErrors).length === 0;
    
    // Track validation result
    if (isValid) {
      trackFormStep(currentStep, 'complete');
      
      // Save the draft when moving to next step
      const draft: DraftData = {
        formData,
        currentStep,
        progress,
        lastUpdated: new Date().toISOString()
      };
      saveDraft(draft);
      setLastSaved(draft.lastUpdated);

      // Only proceed to next step if validation passed
      if (currentStep === 'basic') {
        setCurrentStep('fitness');
      } else if (currentStep === 'fitness') {
        setCurrentStep('preferences');
      } else if (currentStep === 'preferences') {
        setCurrentStep('review');
      } else if (currentStep === 'review') {
        const event = new Event('submit') as unknown as React.FormEvent;
        handleSubmit(event);
      }
    } else {
      trackFormStep(currentStep, 'error');
      return; // Prevent navigation if validation fails
    }
  };

  // Add retry function
  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    setApiError(null);
    
    // Retry the submission after a short delay
    setTimeout(() => {
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
      setIsRetrying(false);
    }, 1000);
  };

  // Add real-time validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate field in real-time and update errors
    validateField(name as keyof FormData, value);
  };

  // Add field-level validation
  // Add field-level validation
  const validateField = (field: keyof FormData, value: any) => {
    const fieldErrors: Partial<Record<keyof FormData, string>> = {};
    
    switch (field) {
      case 'ageRange':
        if (!value) {
          fieldErrors.ageRange = 'Age range is required';
        } else if (!['18-24', '25-34', '35-44', '45-54', '55+'].includes(value)) {
          fieldErrors.ageRange = 'Invalid age range';
        }
        break;
      case 'sex':
        if (!value) {
          fieldErrors.sex = 'Sex is required';
        } else if (!['male', 'female', 'other'].includes(value)) {
          fieldErrors.sex = 'Invalid sex value';
        }
        break;
      case 'fitnessLevel':
        if (!value) {
          fieldErrors.fitnessLevel = 'Fitness level is required';
        } else if (!['beginner', 'intermediate', 'advanced'].includes(value)) {
          fieldErrors.fitnessLevel = 'Invalid fitness level';
        }
        break;
      case 'goals':
        if (!value || value.length === 0) {
          fieldErrors.goals = 'At least one goal is required';
        }
        break;
      case 'availableEquipment':
        if (!value || value.length === 0) {
          fieldErrors.availableEquipment = 'At least one piece of equipment is required';
        }
        break;
      case 'preferredTrainingDays':
        if (!value || value.length === 0) {
          fieldErrors.preferredTrainingDays = 'At least one training day is required';
        }
        break;
      case 'preferredWorkoutDuration':
        if (!value) {
          fieldErrors.preferredWorkoutDuration = 'Workout duration is required';
        } else if (!['short', 'medium', 'long'].includes(value)) {
          fieldErrors.preferredWorkoutDuration = 'Invalid workout duration';
        }
        break;
      case 'locationPreference':
        if (!value) {
          fieldErrors.locationPreference = 'Location preference is required';
        } else if (!['gym', 'home', 'park', 'indoor', 'outdoor', 'both'].includes(value)) {
          fieldErrors.locationPreference = 'Invalid location preference';
        }
        break;
    }
    if (Object.keys(fieldErrors).length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        ...fieldErrors
      }));
    } else {
      // Clear validation errors when field becomes valid
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
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

  // Add progress bar component
  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Profile Completion</span>
        <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
            </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts if not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (currentStep !== 'review') {
            nextStep();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentStep !== 'basic') {
            prevStep();
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (currentStep === 'review') {
            handleSubmit(e as unknown as React.FormEvent);
          } else {
            nextStep();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (currentStep !== 'basic') {
            prevStep();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStep]);

  // Add keyboard navigation hints
  const KeyboardHints = () => (
    <div className="mt-4 text-sm text-gray-500">
      <p className="font-medium mb-1">Keyboard Shortcuts:</p>
      <ul className="space-y-1">
        <li>→ Next step</li>
        <li>← Previous step</li>
        <li>Enter Continue/Submit</li>
        <li>Esc Go back</li>
      </ul>
    </div>
  );

  // Add loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  const handlePrevious = () => {
    if (currentStep === 'fitness') {
      setCurrentStep('basic');
    } else if (currentStep === 'preferences') {
      setCurrentStep('fitness');
    } else if (currentStep === 'review') {
      setCurrentStep('preferences');
    }
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 'basic':
        return !formData.ageRange || !formData.sex;
      case 'fitness':
        return !formData.fitnessLevel || !formData.goals || formData.goals.length === 0;
      case 'preferences':
        return !formData.availableEquipment || formData.availableEquipment.length === 0;
      case 'review':
        return false;
      default:
        return true;
    }
  };

  const handleConfirmSubmit = () => {
    setShowSubmitDialog(false);
    const event = new Event('submit') as unknown as React.FormEvent;
    handleSubmit(event);
  };

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
          {hasDraft && (
            <DraftBanner
              onResume={handleResumeDraft}
              onDiscard={() => setShowDiscardDialog(true)}
            />
          )}
          
          {lastSaved && (
            <div className="mb-4 text-sm text-gray-500">
              Last saved: {lastSaved}
            </div>
          )}
          
          {userName && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">Welcome, {userName}!</p>
            </div>
          )}
          
          {tokenError && (
            <ErrorDisplay error={tokenError} />
          )}
          
          {apiError && (
            <ErrorDisplay 
              error={apiError.message} 
              onRetry={retryCount < 3 ? handleRetry : undefined} 
            />
          )}
          
          {error && !apiError && (
            <ErrorDisplay error={error} />
          )}

          <ProgressBar />

          <form 
            role="form"
            onSubmit={handleSubmit} 
            onInvalid={(e: React.FormEvent) => {
              e.preventDefault();
              const stepErrors: Record<string, string> = {};
              
              switch (currentStep) {
                case 'basic':
                  if (!formData.ageRange) {
                    stepErrors.ageRange = 'Age range is required';
                  } else if (!['18-24', '25-34', '35-44', '45-54', '55+'].includes(formData.ageRange)) {
                    stepErrors.ageRange = 'Invalid age range';
                  }
                  
                  if (!formData.sex) {
                    stepErrors.sex = 'Sex is required';
                  } else if (!['male', 'female', 'other'].includes(formData.sex)) {
                    stepErrors.sex = 'Invalid sex value';
                  }
                  break;
                  
                case 'fitness':
                  if (!formData.fitnessLevel) {
                    stepErrors.fitnessLevel = 'Fitness level is required';
                  }
                  if (!formData.goals?.length) {
                    stepErrors.goals = 'At least one goal is required';
                  }
                  if (!formData.availableEquipment?.length) {
                    stepErrors.availableEquipment = 'At least one piece of equipment is required';
                  }
                  break;
                  
                case 'preferences':
                  if (!formData.preferredTrainingDays?.length) {
                    stepErrors.preferredTrainingDays = 'At least one training day is required';
                  }
                  if (!formData.preferredWorkoutDuration) {
                    stepErrors.preferredWorkoutDuration = 'Workout duration is required';
                  }
                  break;
              }
              
              // Update validation errors state
              setValidationErrors(prev => ({
                ...prev,
                ...stepErrors
              }));
              
              // Clear errors for valid fields
              Object.keys(formData).forEach(key => {
                const field = key as keyof FormData;
                
                // If the field is valid but has an error, clear it
                if (!(field in stepErrors) && validationErrors[field]) {
                  setValidationErrors(prev => {
                    const updated = { ...prev };
                    delete updated[field];
                    return updated;
                  });
                }
              });
            }}
            className="space-y-6"
          >
            <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              {currentStep === 'basic' && (
                <BasicInfoStep
                  formData={formData}
                  onChange={handleInputChange}
                  errors={validationErrors}
                />
              )}
              {currentStep === 'fitness' && (
                <FitnessInfoStep
                  formData={formData}
                  onChange={handleInputChange}
                  onMultiSelect={handleMultiSelect}
                  errors={validationErrors}
                />
              )}
              {currentStep === 'preferences' && (
                <PreferencesStep
                  formData={formData}
                  onChange={handleInputChange}
                  onMultiSelect={handleMultiSelect}
                  errors={validationErrors}
                />
              )}
              {currentStep === 'review' && <ReviewStep formData={formData} />}
            </div>

            <StepNavigation
              currentStep={currentStep}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isNextDisabled={isNextDisabled()}
            />
          </form>

          <KeyboardHints />
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleDiscardDraft}
        title="Discard Draft?"
        message="Are you sure you want to discard your saved progress? This action cannot be undone."
        confirmText="Discard"
        cancelText="Keep"
        type="warning"
      />
      
      <ConfirmationDialog
        isOpen={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit Profile"
        message="Are you sure you want to submit your profile? Please review your information before proceeding."
        confirmText="Submit"
        type="info"
      />
    </div>
  );
} 