import { WODRequestData } from '@/components/workout/WODRequestForm';

export interface WODResponse {
    id: string;
    name: string;
    description: string;
    duration: string;
    intensity: string;
    exercises: Array<{
        name: string;
        sets: number;
        reps: string;
        rest: string;
        notes?: string;
    }>;
    equipment: string[];
    focus: string[];
    tips: string[];
    scaling: {
        beginner: string[];
        intermediate: string[];
        advanced: string[];
    };
}

export async function generateWOD(data: WODRequestData): Promise<WODResponse> {
    try {
        const response = await fetch('/api/workouts/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate workout');
        }

        return response.json();
    } catch (error) {
        console.error('Error generating workout:', error);
        throw error;
    }
}

export async function saveWOD(wod: WODResponse): Promise<void> {
    try {
        const response = await fetch('/api/workouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(wod),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save workout');
        }
    } catch (error) {
        console.error('Error saving workout:', error);
        throw error;
    }
} 