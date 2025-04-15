import { WodType } from '../types/wod.types';
import { FitnessProfile } from '../types/fitnessProfile.types';
import { WorkoutRequest } from '../types/workoutRequest.types';

/**
 * Generates a string summarizing the user's available equipment and their most recent workouts.
 * The string is formatted as markdown and can be used as a prompt for generating a workout.
 * @param workouts An array of recent workouts
 * @param fitnessProfile The user's fitness profile
 * @returns A markdown-formatted string summarizing the user's equipment and recent workouts
 */
export function formatWorkoutOverview(workouts: WodType[], fitnessProfile: FitnessProfile, workoutRequest?: WorkoutRequest): string {
    let overview = '';

    // Add recent workouts section if there are any
    // if (workouts.length > 0) {
    //     overview += 'Recent Workouts:\n';
    //     workouts.forEach(workout => {
    //         overview += `- ${workout.workout.type} workout on ${new Date(workout.createdAt).toLocaleDateString()}\n`;
    //         overview += `  Duration: ${workout.workout.duration}\n`;
    //         overview += `  Focus: ${workout.workout.wodGoal}\n`;
    //         overview += `  Key Exercises:\n`;
    //         if (workout.workout.exercises) {
    //             workout.workout.exercises.slice(0, 3).forEach(exercise => {
    //                 overview += `    * ${exercise.exercise} (${exercise.reps} reps)\n`;
    //             });
    //         }
    //     });
    //     overview += '\n';
    // }

    if (workoutRequest) {
        overview += `Workout Request:\n`;
        overview += `  User Description: ${workoutRequest.userDescription}\n`;
        overview += `  WOD Duration: ${workoutRequest.wodDuration}\n`;
        overview += `  WOD Focus: ${workoutRequest.workoutFocus}\n`;
        overview += `  Scaling Preference: ${workoutRequest.scalingPreference}\n`;
        overview += `  WOD Duration: ${workoutRequest.wodDuration}\n`;
    }

    // Add equipment categories
    overview += 'Available Equipment:\n';
    const equipmentCategories = fitnessProfile.availableEquipment.reduce((acc: Record<string, string[]>, item: string) => {
        let category = 'Other';
        if (item.toLowerCase().includes('barbell') || item.toLowerCase().includes('plate')) {
            category = 'Barbells and Weights';
        } else if (item.toLowerCase().includes('rower') || item.toLowerCase().includes('bike') || item.toLowerCase().includes('treadmill')) {
            category = 'Cardio Equipment';
        } else if (item.toLowerCase().includes('pull') || item.toLowerCase().includes('ring')) {
            category = 'Gymnastics Equipment';
        } else if (item.toLowerCase().includes('kettlebell') || item.toLowerCase().includes('dumbbell') ||
            item.toLowerCase().includes('jump') || item.toLowerCase().includes('box') ||
            item.toLowerCase().includes('band') || item.toLowerCase().includes('bag') ||
            item.toLowerCase().includes('ball')) {
            category = 'Conditioning Equipment';
        }

        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    Object.entries(equipmentCategories).forEach(([category, items]) => {
        overview += `${category}:\n`;
        items.forEach((item: string) => overview += `  * ${item}\n`);
        overview += '\n';
    });

    return overview;
} 