import { OpenAIWorkoutAdapter } from "../src/adapters/openai-workout.adapter";
import { FitnessProfile } from "../src/types/fitnessProfile.types";
import { WorkoutRequest } from "../src/types/workoutRequest.types";
import { WodResponse, WodType } from "../src/types/wod.types";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Sample fitness profiles for different scenarios
const sampleProfiles: Record<string, FitnessProfile> = {
    beginner: {
        userId: uuidv4(),
        ageRange: "25-34",
        sex: "male",
        fitnessLevel: "beginner",
        goals: ["general fitness", "weight loss"],
        availableEquipment: ["dumbbells", "resistance bands", "pull-up bar"],
        preferredWorkoutDuration: "short",
        locationPreference: "home",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    intermediate: {
        userId: uuidv4(),
        ageRange: "35-44",
        sex: "female",
        fitnessLevel: "intermediate",
        goals: ["strength", "muscle gain"],
        availableEquipment: ["barbell", "rack", "kettlebells", "dumbbells", "plates"],
        injuriesOrLimitations: ["lower back sensitivity"],
        preferredWorkoutDuration: "medium",
        locationPreference: "home",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    advanced: {
        userId: uuidv4(),
        ageRange: "25-34",
        sex: "male",
        fitnessLevel: "advanced",
        goals: ["strength", "power", "endurance"],
        availableEquipment: ["full gym"],
        preferredWorkoutDuration: "long",
        locationPreference: "gym",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    senior: {
        userId: uuidv4(),
        ageRange: "55+",
        sex: "female",
        fitnessLevel: "beginner",
        goals: ["flexibility", "general fitness"],
        availableEquipment: ["resistance bands", "light dumbbells", "yoga mat"],
        injuriesOrLimitations: ["arthritis", "knee pain"],
        preferredWorkoutDuration: "short",
        locationPreference: "home",
        createdAt: new Date(),
        updatedAt: new Date()
    }
};

// Sample workout requests for different scenarios
const sampleRequests: Record<string, WorkoutRequest> = {
    beginner: {
        requestId: uuidv4(),
        userId: sampleProfiles.beginner.userId,
        scalingPreference: "bodyweight",
        includeScalingOptions: true,
        totalAvailableTime: 60,
        wodDuration: "10 minutes to 20 minutes",
        workoutFocus: "Strength & Conditioning",
        includeWarmups: true,
        includeCooldown: true,
        wodRequestTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    intermediate: {
        requestId: uuidv4(),
        userId: sampleProfiles.intermediate.userId,
        scalingPreference: "lighter weight",
        includeScalingOptions: true,
        totalAvailableTime: 45,
        wodDuration: "10 minutes to 20 minutes",
        workoutFocus: "Strength",
        includeWarmups: true,
        includeCooldown: true,
        excludeExercises: ["deadlift"],
        wodRequestTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    advanced: {
        requestId: uuidv4(),
        userId: sampleProfiles.advanced.userId,
        scalingPreference: "advanced",
        includeScalingOptions: false,
        totalAvailableTime: 60,
        workoutFocus: "Strength & Conditioning",
        includeWarmups: true,
        includeCooldown: true,
        includeBenchmarkWorkouts: true,
        wodRequestTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    senior: {
        requestId: uuidv4(),
        userId: sampleProfiles.senior.userId,
        scalingPreference: "lighter weight",
        includeScalingOptions: true,
        totalAvailableTime: 60,
        wodDuration: "15 minutes to 30 minutes",
        workoutFocus: "Mobility",
        includeWarmups: true,
        includeCooldown: true,
        includeExercises: ["chair exercises", "walking"],
        wodRequestTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    }
};

function formatProfileForMarkdown(profile: FitnessProfile): string {
    return `
### Athlete Profile
- **Age Range**: ${profile.ageRange}
- **Sex**: ${profile.sex}
- **Fitness Level**: ${profile.fitnessLevel}
- **Goals**: ${profile.goals.join(', ')}
- **Available Equipment**: ${profile.availableEquipment.join(', ')}
${profile.injuriesOrLimitations ? `- **Limitations**: ${profile.injuriesOrLimitations.join(', ')}` : ''}
- **Preferred Duration**: ${profile.preferredWorkoutDuration}
- **Location**: ${profile.locationPreference}
`;
}

function formatRequestForMarkdown(request: WorkoutRequest): string {
    return `
### Workout Parameters
- **Focus**: ${request.workoutFocus}
- **Duration**: ${request.totalAvailableTime} minutes
- **Scaling**: ${request.scalingPreference}
- **Include Scaling Options**: ${request.includeScalingOptions ? 'Yes' : 'No'}
${request.includeExercises ? `- **Required Exercises**: ${request.includeExercises.join(', ')}` : ''}
${request.excludeExercises ? `- **Excluded Exercises**: ${request.excludeExercises.join(', ')}` : ''}
`;
}

function formatWodForMarkdown(wodResponse: WodResponse): string {
    const workout = wodResponse.wod;
    let markdown = `
### Generated Workout
**${workout.description || 'No description provided'}**\n`;

    // Format warmup section
    if (workout.warmup?.activities?.length) {
        markdown += `
#### Warm-up (${workout.warmup.duration || 'duration not specified'})
${workout.warmup.activities.map(activity => `
- ${activity.activity} (${activity.duration || 'duration not specified'}, ${activity.intensity || 'intensity not specified'})
  ${activity.exercises ? activity.exercises.map(ex =>
            `  * ${ex.name}: ${ex.sets}x${ex.reps}${ex.rest ? `, rest ${ex.rest}` : ''}`
        ).join('\n') : ''}`
        ).join('\n')}`;
    }

    // Format main workout section
    if (workout.workout) {
        markdown += `
#### Main Workout (${workout.workout.duration || 'duration not specified'})
- **Type**: ${workout.workout.type || 'type not specified'}
- **Description**: ${workout.workout.wodDescription || 'description not specified'}
- **Strategy**: ${workout.workout.wodStrategy || 'strategy not specified'}
- **Goal**: ${workout.workout.wodGoal || 'goal not specified'}

**Exercises**:
${(workout.workout.exercises || []).map(ex => `
- ${ex.exercise} (${ex.type})
  * Reps: ${ex.reps || 'not specified'}
  * Weight: ${ex.weight || 'not specified'}
  * Goal: ${ex.goal || 'not specified'}
  ${ex.scalingOptions ? `* Scaling Options:\n          - ${ex.scalingOptions.map(opt =>
            `${opt.description}: ${opt.exercise} (${opt.reps})`
        ).join('\n          - ')}` : ''}`
        ).join('\n')}`;
    }

    // Format cooldown section
    if (workout.cooldown?.activities?.length) {
        markdown += `
#### Cool-down (${workout.cooldown.duration || 'duration not specified'})
${workout.cooldown.activities.map(activity =>
            `- ${activity.activity} (${activity.duration || 'duration not specified'}, ${activity.intensity || 'intensity not specified'})`
        ).join('\n')}`;
    }

    // Format recovery notes
    if (workout.recovery) {
        markdown += `
#### Recovery Notes
${workout.recovery}`;
    }

    return markdown;
}

async function generateWodForProfile(profileType: string): Promise<string> {
    const adapter = new OpenAIWorkoutAdapter();
    const profile = sampleProfiles[profileType];
    const request = sampleRequests[profileType];

    let markdownContent = `## ${profileType.charAt(0).toUpperCase() + profileType.slice(1)} Athlete WOD\n`;
    markdownContent += formatProfileForMarkdown(profile);
    markdownContent += formatRequestForMarkdown(request);

    try {
        const response = await adapter.generateWod(
            profile.userId,
            profile,
            request
        );
        markdownContent += formatWodForMarkdown(response);
    } catch (error) {
        markdownContent += '\n### Error Generating Workout\n';
        markdownContent += `\`\`\`\n${error}\n\`\`\`\n`;
    }

    return markdownContent;
}

async function main() {
    const outputDir = path.join(__dirname, '..', 'docs', 'sample-wods');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    let fullMarkdown = '# Sample Generated WODs\n\n';
    fullMarkdown += `Generated on: ${timestamp}\n\n`;
    fullMarkdown += 'This document contains sample workouts generated for different athlete profiles.\n\n';
    fullMarkdown += '---\n\n';

    const profileTypes = ['beginner', 'intermediate', 'advanced', 'senior'];

    for (const profileType of profileTypes) {
        console.log(`Generating WOD for ${profileType.toUpperCase()} profile...`);
        const wodMarkdown = await generateWodForProfile(profileType);
        fullMarkdown += wodMarkdown + '\n\n---\n\n';
        await new Promise(resolve => setTimeout(resolve, 2000)); // Add delay between requests
    }

    const outputFile = path.join(outputDir, `generated-wods-${timestamp}.md`);
    fs.writeFileSync(outputFile, fullMarkdown);
    console.log(`Generated workouts have been saved to: ${outputFile}`);
}

main().catch(console.error);
