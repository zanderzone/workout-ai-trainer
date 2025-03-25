'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { completeProfile } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { EquipmentInput } from "@/components/ui/equipment-input";

type FormData = {
  ageRange: string;
  sex: string;
  fitnessLevel: string;
  goals: string[];
  injuriesOrLimitations: string[];
  workoutDuration: string;
  equipment: string[];
  gymLocation: string;
  totalAvailableTime: string;
};

const FITNESS_GOALS = [
  "Strength",
  "Endurance",
  "Flexibility",
  "Weight Loss",
  "Muscle Gain",
  "General Fitness",
  "Sports Performance"
];

const INJURY_CATEGORIES = [
  "Back",
  "Knee",
  "Shoulder",
  "Wrist",
  "Ankle",
  "Hip",
  "Neck",
  "None"
];

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
  const [formData, setFormData] = useState<FormData>({
    ageRange: '',
    sex: '',
    fitnessLevel: '',
    goals: [],
    injuriesOrLimitations: [],
    workoutDuration: '60 minutes',
    equipment: [],
    gymLocation: '',
    totalAvailableTime: '60 minutes'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if we have a token
    const token = searchParams.get('token');
    if (!token) {
      // No token means they didn't come from OAuth, redirect to login
      router.push('/login');
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = searchParams.get('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await completeProfile({
        ageRange: formData.ageRange as "18-24" | "25-34" | "35-44" | "45-54" | "55+",
        sex: formData.sex as "male" | "female" | "other",
        fitnessLevel: formData.fitnessLevel as "beginner" | "intermediate" | "advanced",
        goals: formData.goals,
        injuriesOrLimitations: formData.injuriesOrLimitations,
        workoutDuration: formData.workoutDuration,
        equipment: formData.equipment,
        gymLocation: formData.gymLocation
      }, token);

      // Store the token and redirect to dashboard
      localStorage.setItem('token', token);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed to:`, value);
    
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    
    // Debug validation
    const isValid = Boolean(newFormData.sex && newFormData.ageRange && newFormData.fitnessLevel);
    console.log('Current Form State:', {
      sex: `"${newFormData.sex}"`,
      ageRange: `"${newFormData.ageRange}"`,
      fitnessLevel: `"${newFormData.fitnessLevel}"`,
      isValid
    });
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

  const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>, field: keyof FormData) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      [field]: selectedOptions
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="text-center text-3xl font-bold text-gray-900">Complete Your Profile</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white/80 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="ageRange" className="block text-sm font-medium text-gray-800">
                    Age Range
                  </label>
                  <select
                    id="ageRange"
                    name="ageRange"
                    required
                    value={formData.ageRange}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select your age range</option>
                    <option value="18-24">18-24</option>
                    <option value="25-34">25-34</option>
                    <option value="35-44">35-44</option>
                    <option value="45-54">45-54</option>
                    <option value="55+">55+</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sex" className="block text-sm font-medium text-gray-800">
                    Sex
                  </label>
                  <select
                    id="sex"
                    name="sex"
                    required
                    value={formData.sex}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select your sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="gymLocation" className="block text-sm font-medium text-gray-800">
                    Gym Location
                  </label>
                  <select
                    id="gymLocation"
                    name="gymLocation"
                    value={formData.gymLocation}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select your gym location</option>
                    {GYM_LOCATIONS.map(location => (
                      <option key={location} value={location.toLowerCase()}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fitness Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2">Fitness Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="fitnessLevel" className="block text-sm font-medium text-gray-800">
                    Fitness Level
                  </label>
                  <select
                    id="fitnessLevel"
                    name="fitnessLevel"
                    required
                    value={formData.fitnessLevel}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select your fitness level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="goals" className="block text-sm font-medium text-gray-800">
                    Fitness Goals (Hold Ctrl/Cmd to select multiple)
                  </label>
                  <select
                    id="goals"
                    name="goals"
                    multiple
                    value={formData.goals}
                    onChange={(e) => handleMultiSelect(e, 'goals')}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px]"
                  >
                    {FITNESS_GOALS.map(goal => (
                      <option key={goal} value={goal.toLowerCase()}>{goal}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="injuriesOrLimitations" className="block text-sm font-medium text-gray-800">
                    Injuries or Limitations (Optional)
                  </label>
                  <select
                    id="injuriesOrLimitations"
                    name="injuriesOrLimitations"
                    multiple
                    value={formData.injuriesOrLimitations}
                    onChange={(e) => handleMultiSelect(e, 'injuriesOrLimitations')}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px]"
                  >
                    {INJURY_CATEGORIES.map(category => (
                      <option key={category} value={category.toLowerCase()}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Workout Preferences */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2">Workout Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="totalAvailableTime" className="block text-sm font-medium text-gray-800">
                    Total Available Time
                  </label>
                  <p className="text-sm text-gray-500 mb-1">
                    The total time you typically have available for your workout, including warmup, cooldown, and the main workout.
                  </p>
                  <select
                    id="totalAvailableTime"
                    name="totalAvailableTime"
                    value={formData.totalAvailableTime}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="30 minutes">30 minutes</option>
                    <option value="45 minutes">45 minutes</option>
                    <option value="60 minutes">60 minutes</option>
                    <option value="90 minutes">90 minutes</option>
                    <option value="120 minutes">120 minutes</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="workoutDuration" className="block text-sm font-medium text-gray-800">
                    Preferred Main Workout Duration
                  </label>
                  <p className="text-sm text-gray-500 mb-1">
                    The duration you prefer for the main workout portion (excluding warmup and cooldown).
                  </p>
                  <select
                    id="workoutDuration"
                    name="workoutDuration"
                    value={formData.workoutDuration}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="15 minutes">15 minutes</option>
                    <option value="20 minutes">20 minutes</option>
                    <option value="30 minutes">30 minutes</option>
                    <option value="45 minutes">45 minutes</option>
                    <option value="60 minutes">60 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2">Available Equipment</h3>
              
              <div>
                <label htmlFor="equipment" className="block text-sm font-medium text-gray-800">
                  List your available equipment
                </label>
                <EquipmentInput
                  value={formData.equipment}
                  onChange={(value) => setFormData(prev => ({ ...prev, equipment: value }))}
                  placeholder="Example: 45 lb barbell, 450 lbs in weightlifting bumper plates, pull up bar"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                type="submit"
                disabled={!formData.sex || !formData.ageRange || !formData.fitnessLevel}
                onClick={() => {
                  console.log('Submit Button State:', {
                    sex: `"${formData.sex}"`,
                    ageRange: `"${formData.ageRange}"`,
                    fitnessLevel: `"${formData.fitnessLevel}"`,
                    isDisabled: !formData.sex || !formData.ageRange || !formData.fitnessLevel
                  });
                }}
                className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
                  !formData.sex || !formData.ageRange || !formData.fitnessLevel
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Register'}
              </button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 