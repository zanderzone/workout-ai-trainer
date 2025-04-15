import { FitnessProfile } from '../types/fitnessProfile.types';
import { WorkoutRequest } from '../types/workoutRequest.types';
import { WodType, WodTypeRecommendation } from '../types/wod.types';
import { formatWorkoutOverview } from '../utils/workout.utils';
import { validateWorkoutRequest, createBaseWorkoutRequest, constructWod } from '../utils/wod.utils';
import { WodGenerationError } from '../errors/wod.errors';
import { WodAIAdapter } from '../types/wod.types';
import { WodService } from '../services/wod.service';
import { UserService } from '../services/user.service';

export class WodModel {
    constructor(
        private readonly aiAdapter: WodAIAdapter,
        private readonly wodService: WodService,
        private readonly userService: UserService
    ) { }

    async generateWod(
        userId: string,
        fitnessProfile: FitnessProfile,
        workoutRequest: WorkoutRequest
    ): Promise<WodType> {
        try {
            let userProfile = fitnessProfile;
            console.log('Starting WOD generation for user:', userId);
            console.log('Request:', workoutRequest);

            // Get user's recent workouts
            const recentWorkouts = await this.wodService.getRecentWorkouts(userId);
            console.log('Recent workouts:', recentWorkouts);

            // Get user's fitness profile
            if (!fitnessProfile) {
                const userProfile = await this.userService.getFitnessProfile(userId);
                console.log('Fitness profile:', userProfile);
            }

            // Format workout overview
            const workoutOverview = formatWorkoutOverview(recentWorkouts, userProfile, workoutRequest);

            // Determine workout type and duration
            const workoutTypeRecommendation = await this.aiAdapter.determineWorkoutType(
                workoutOverview,
                userProfile
            );
            console.log('Workout type recommendation:', workoutTypeRecommendation);

            // Create and validate workout request
            const baseRequest = createBaseWorkoutRequest(userId);
            const validatedRequest = validateWorkoutRequest({
                ...baseRequest,
                ...workoutRequest,
                workoutType: workoutTypeRecommendation.workoutType,
                wodDuration: workoutTypeRecommendation.durationRange,
                intensity: workoutTypeRecommendation.intensity,
                workoutFocus: workoutTypeRecommendation.focus as WorkoutRequest['workoutFocus']
            });
            console.log('Updated workout request:', validatedRequest);

            // Generate WOD using the AI adapter
            const aiResponse = await this.aiAdapter.generateWodWithAI(userProfile, validatedRequest);
            console.log('AI response:', aiResponse);

            // Construct and validate WOD
            const wod = constructWod(userId, aiResponse, workoutTypeRecommendation.workoutType);
            console.log('Generated WOD:', wod);

            return wod;
        } catch (error) {
            console.error('Error generating WOD:', error);
            throw error;
        }
    }
} 