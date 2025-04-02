import { WodType } from '../types/wod.types';
import { FitnessProfile } from '../types/fitnessProfile.types';

export function formatWorkoutOverview(workouts: WodType[], fitnessProfile: FitnessProfile): string {
    let overview = '';

    // Add recent workouts section if there are any
    if (workouts.length > 0) {
        overview += 'Recent Workouts:\n';
        workouts.forEach(workout => {
            overview += `- ${workout.workout.type} workout on ${new Date(workout.createdAt).toLocaleDateString()}\n`;
            overview += `  Duration: ${workout.workout.duration}\n`;
            overview += `  Focus: ${workout.workout.wodGoal}\n`;
            overview += `  Key Exercises:\n`;
            if (workout.workout.exercises) {
                workout.workout.exercises.slice(0, 3).forEach(exercise => {
                    overview += `    * ${exercise.exercise} (${exercise.reps} reps)\n`;
                });
            }
        });
        overview += '\n';
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