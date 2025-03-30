import { WODRequestData } from '@/components/workout/WODRequestForm';

export class WODError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = 'WODError';
    }
}

export interface WODResponse {
    wodId: string;
    userId: string;
    description: string;
    warmup: {
        type: string;
        duration?: string;
        activities?: Array<{
            activity?: string;
            duration?: string;
            intensity?: string;
            reps?: string;
            weight?: string;
            height?: string;
            distance?: string;
            exercises?: Array<{
                name: string;
                reps?: string;
                sets?: string;
                rest?: string;
            }>;
        }>;
    };
    workout: {
        type: string;
        wodDescription?: string;
        wodStrategy?: string;
        wodGoal?: string;
        duration?: string;
        wodCutOffTime?: string;
        rest?: string;
        exercises?: Array<{
            exercise: string;
            type?: string;
            reps?: string;
            rounds?: string;
            weight?: string;
            height?: string;
            distance?: string;
            goal?: string;
            scalingOptions?: Array<{
                description?: string;
                exercise?: string;
                reps?: string;
            }>;
            personalBestReference?: boolean;
        }>;
        rounds?: number;
    };
    cooldown: {
        type: string;
        duration?: string;
        activities?: Array<{
            activity?: string;
            duration?: string;
            intensity?: string;
            reps?: string;
            weight?: string;
            height?: string;
            distance?: string;
            exercises?: Array<{
                name: string;
                reps?: string;
                sets?: string;
                rest?: string;
            }>;
        }>;
    };
    recovery?: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function generateWOD(data: WODRequestData, userId: string): Promise<WODResponse> {
    try {
        const response = await fetch('/api/wod', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                workoutOptions: {
                    userId,
                    ...data
                }
            }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new WODError(
                responseData.message || 'Failed to generate workout',
                response.status,
                responseData.code
            );
        }

        return responseData;
    } catch (error) {
        if (error instanceof WODError) {
            throw error;
        }
        if (error instanceof Error) {
            throw new WODError(error.message);
        }
        throw new WODError('An unexpected error occurred while generating the workout');
    }
}

export async function saveWOD(wod: WODResponse): Promise<void> {
    try {
        const response = await fetch('/api/wod', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(wod),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new WODError(
                responseData.message || 'Failed to save workout',
                response.status,
                responseData.code
            );
        }
    } catch (error) {
        if (error instanceof WODError) {
            throw error;
        }
        if (error instanceof Error) {
            throw new WODError(error.message);
        }
        throw new WODError('An unexpected error occurred while saving the workout');
    }
} 