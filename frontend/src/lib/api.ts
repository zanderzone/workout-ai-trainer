const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://wod-coach.ngrok.app';

export async function loginWithGoogle() {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
}

export async function loginWithApple() {
    window.location.href = `${API_BASE_URL}/api/auth/apple`;
}

export async function isAppleSignInEnabled(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();
        return data.services?.oauth?.apple?.status === 'configured';
    } catch (error) {
        console.error('Error checking Apple Sign In status:', error);
        return false;
    }
}

export async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        return { isAuthenticated: false, user: null };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return { isAuthenticated: false, user: null };
        }

        return response.json();
    } catch (error) {
        console.error('Error checking auth status:', error);
        return { isAuthenticated: false, user: null };
    }
}

interface FitnessProfileData {
    ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
    sex?: "male" | "female" | "other";
    fitnessLevel?: "beginner" | "intermediate" | "advanced";
    goals: Array<"weight loss" | "muscle gain" | "strength" | "endurance" | "power" | "flexibility" | "general fitness">;
    injuriesOrLimitations?: string[];
    availableEquipment: string[];
    preferredTrainingDays?: Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday">;
    preferredWorkoutDuration?: "short" | "medium" | "long";
    locationPreference?: "gym" | "home" | "park" | "indoor" | "outdoor" | "both";
}

export async function completeProfile(data: FitnessProfileData, headers?: HeadersInit): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to complete profile');
        }

        // Store completion status
        localStorage.setItem('isRegistrationComplete', 'true');
    } catch (error) {
        console.error('Error completing profile:', error);
        throw error;
    }
}

export async function validateProfile(data: FitnessProfileData): Promise<{ isValid: boolean; errors: Record<string, string> }> {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!data.fitnessLevel) {
        errors.fitnessLevel = 'Fitness level is required';
    } else if (!["beginner", "intermediate", "advanced"].includes(data.fitnessLevel)) {
        errors.fitnessLevel = 'Invalid fitness level';
    }

    if (!data.goals || data.goals.length === 0) {
        errors.goals = 'At least one goal is required';
    }
    if (!data.availableEquipment || data.availableEquipment.length === 0) {
        errors.availableEquipment = 'At least one piece of equipment is required';
    }

    // Optional fields validation
    if (data.ageRange && !["18-24", "25-34", "35-44", "45-54", "55+"].includes(data.ageRange)) {
        errors.ageRange = 'Invalid age range';
    }
    if (data.sex && !["male", "female", "other"].includes(data.sex)) {
        errors.sex = 'Invalid sex option';
    }
    if (data.preferredWorkoutDuration && !["short", "medium", "long"].includes(data.preferredWorkoutDuration)) {
        errors.preferredWorkoutDuration = 'Invalid workout duration';
    }
    if (data.locationPreference && !["gym", "home", "park", "indoor", "outdoor", "both"].includes(data.locationPreference)) {
        errors.locationPreference = 'Invalid location preference';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
} 