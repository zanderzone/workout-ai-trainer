/**
 * Utility functions to format WOD JSON into markdown
 */

/**
 * Example usage:
 * 
 * const wodJson = {
 *   "description": "Hero WOD: Murph",
 *   "duration": "45-60 minutes",
 *   "wod": {
 *     "warmup": { ... },
 *     "workout": { ... },
 *     "cooldown": { ... },
 *     "recovery": "Foam roll quads and shoulders for 5-10 minutes."
 *   }
 * };
 * 
 * const markdown = formatWodToMarkdown(wodJson);
 * console.log(markdown);
 */
import { WorkoutPlanDB } from "../types/workout.types";

interface ScalingOption {
  description?: string;
  exercise?: string;
  reps?: string;
}

interface Exercise {
  exercise: string;
  type?: string;
  reps?: string;
  rounds?: string;
  weight?: string;
  height?: string;
  distance?: string;
  goal?: string;
  scalingOptions?: ScalingOption[];
  personalBestReference?: boolean;
}

interface WarmupOrCooldownActivity {
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
}

// Update the Activity interface to match WarmupOrCooldownActivity
type Activity = Required<Pick<WarmupOrCooldownActivity, 'activity'>> & Omit<WarmupOrCooldownActivity, 'activity'>;

interface WarmupOrCooldown {
  type: string;
  duration?: string;
  activities?: WarmupOrCooldownActivity[];
}

interface Workout {
  type: string;
  wodDescription?: string;
  wodStrategy?: string;
  wodGoal?: string;
  duration?: string;
  wodCutOffTime?: string;
  rounds?: number;
  rest?: string;
  exercises?: Exercise[];
}

interface WOD {
  description: string;
  duration?: string;
  wodId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  wod: {
    warmup?: WarmupOrCooldown;
    workout: Workout;
    cooldown?: WarmupOrCooldown;
    recovery?: string;
  };
}

/**
 * Formats a WOD JSON object into a markdown string
 * @param wod The WOD JSON object
 * @returns A formatted markdown string
 */
export function formatWodToMarkdown(wod: WOD): string {
  const { description, duration, wod: workout } = wod;

  let markdown = `# ${description}\n\n`;
  if (duration) {
    markdown += `**Total Duration:** ${duration}\n\n`;
  }

  // Warmup section
  if (workout.warmup) {
    markdown += `## Warm-up\n\n`;
    markdown += `**Type:** ${workout.warmup.type}\n\n`;
    markdown += `**Duration:** ${workout.warmup.duration}\n\n`;

    if (workout.warmup.activities && workout.warmup.activities.length > 0) {
      markdown += `### Activities:\n\n`;
      workout.warmup.activities.forEach(activity => {
        markdown += `* **${activity.activity}** `;
        if (activity.duration) markdown += `(Duration: ${activity.duration}, `;
        if (activity.intensity) markdown += `Intensity: ${activity.intensity}, `;
        if (activity.reps) markdown += `Reps: ${activity.reps}, `;
        if (activity.weight) markdown += `Weight: ${activity.weight}, `;
        if (activity.height) markdown += `Height: ${activity.height}, `;
        if (activity.distance) markdown += `Distance: ${activity.distance}`;
        markdown += `)\n`;
      });
      markdown += `\n`;
    }
  }

  // Main workout section
  if (workout.workout) {
    markdown += `## Workout\n\n`;
    markdown += `**Type:** ${workout.workout.type}\n\n`;
    markdown += `**Duration:** ${workout.workout.duration}\n\n`;
    if (workout.workout.wodDescription) markdown += `${workout.workout.wodDescription}\n\n`;
    if (workout.workout.wodStrategy) markdown += `### Strategy\n\n${workout.workout.wodStrategy}\n\n`;
    if (workout.workout.wodGoal) markdown += `### Goal\n\n${workout.workout.wodGoal}\n\n`;
    if (workout.workout.wodCutOffTime) markdown += `**Cut-off Time:** ${workout.workout.wodCutOffTime}\n\n`;
    if (workout.workout.rounds) markdown += `**Rounds:** ${workout.workout.rounds}\n\n`;
    if (workout.workout.rest) markdown += `**Rest:** ${workout.workout.rest}\n\n`;

    if (workout.workout.exercises && workout.workout.exercises.length > 0) {
      markdown += `### Exercises:\n\n`;
      workout.workout.exercises.forEach(exercise => {
        markdown += `#### ${exercise.exercise}\n\n`;
        if (exercise.reps) markdown += `**Reps:** ${exercise.reps} | `;
        if (exercise.weight) markdown += `**Weight:** ${exercise.weight} | `;
        if (exercise.height) markdown += `**Height:** ${exercise.height} | `;
        if (exercise.distance) markdown += `**Distance:** ${exercise.distance} | `;
        if (exercise.type) markdown += `**Type:** ${exercise.type}\n\n`;
        if (exercise.goal) markdown += `**Goal:** ${exercise.goal}\n\n`;

        if (exercise.scalingOptions && exercise.scalingOptions.length > 0) {
          markdown += `**Scaling Options:**\n\n`;
          exercise.scalingOptions.forEach(option => {
            markdown += `* ${option.description}\n`;
            if (option.exercise) markdown += `  * Exercise: ${option.exercise}\n`;
            if (option.reps) markdown += `  * Reps: ${option.reps}\n`;
          });
          markdown += `\n`;
        }

        if (exercise.personalBestReference) {
          markdown += `💪 **Reference your personal best for this movement** 💪\n\n`;
        }
      });
    }
  }

  // Cooldown section
  if (workout.cooldown) {
    markdown += `## Cool-down\n\n`;
    markdown += `**Type:** ${workout.cooldown.type}\n\n`;
    markdown += `**Duration:** ${workout.cooldown.duration}\n\n`;

    if (workout.cooldown.activities && workout.cooldown.activities.length > 0) {
      markdown += `### Activities:\n\n`;
      workout.cooldown.activities.forEach(activity => {
        markdown += `* **${activity.activity}** `;
        if (activity.duration) markdown += `(Duration: ${activity.duration}, `;
        if (activity.intensity) markdown += `Intensity: ${activity.intensity}`;
        markdown += `)\n`;
      });
      markdown += `\n`;
    }
  }

  // Recovery notes
  if (workout.recovery) {
    markdown += `## Recovery Notes\n\n`;
    markdown += `${workout.recovery}\n\n`;
  }

  return markdown;
}

// Helper functions for formatting individual sections can be implemented and exported here if needed

export function formatWarmupOrCooldown(section: WarmupOrCooldown, title: string = "Warm-up"): string {
  let markdown = `## ${title}\n\n`;
  markdown += `**Type:** ${section.type}\n\n`;
  markdown += `**Duration:** ${section.duration}\n\n`;

  if (section.activities && section.activities.length > 0) {
    markdown += `### Activities:\n\n`;
    section.activities.forEach(activity => {
      markdown += `* **${activity.activity}** `;
      if (activity.duration) markdown += `(Duration: ${activity.duration}, `;
      if (activity.intensity) markdown += `Intensity: ${activity.intensity}, `;
      if (activity.reps) markdown += `Reps: ${activity.reps}, `;
      if (activity.weight) markdown += `Weight: ${activity.weight}, `;
      if (activity.height) markdown += `Height: ${activity.height}, `;
      if (activity.distance) markdown += `Distance: ${activity.distance}`;
      markdown += `)\n`;
    });
    markdown += `\n`;
  }

  return markdown;
}

export function formatWorkout(workout: Workout): string {
  let markdown = `## Workout\n\n`;
  markdown += `**Type:** ${workout.type}\n\n`;
  markdown += `**Duration:** ${workout.duration}\n\n`;
  if (workout.wodDescription) markdown += `${workout.wodDescription}\n\n`;
  if (workout.wodStrategy) markdown += `### Strategy\n\n${workout.wodStrategy}\n\n`;
  if (workout.wodGoal) markdown += `### Goal\n\n${workout.wodGoal}\n\n`;
  if (workout.wodCutOffTime) markdown += `**Cut-off Time:** ${workout.wodCutOffTime}\n\n`;
  if (workout.rounds) markdown += `**Rounds:** ${workout.rounds}\n\n`;
  if (workout.rest) markdown += `**Rest:** ${workout.rest}\n\n`;

  if (workout.exercises && workout.exercises.length > 0) {
    markdown += `### Exercises:\n\n`;
    workout.exercises.forEach(exercise => {
      markdown += `#### ${exercise.exercise}\n\n`;
      if (exercise.reps) markdown += `**Reps:** ${exercise.reps} | `;
      if (exercise.weight) markdown += `**Weight:** ${exercise.weight} | `;
      if (exercise.height) markdown += `**Height:** ${exercise.height} | `;
      if (exercise.distance) markdown += `**Distance:** ${exercise.distance} | `;
      if (exercise.type) markdown += `**Type:** ${exercise.type}\n\n`;
      if (exercise.goal) markdown += `**Goal:** ${exercise.goal}\n\n`;

      if (exercise.scalingOptions && exercise.scalingOptions.length > 0) {
        markdown += `**Scaling Options:**\n\n`;
        exercise.scalingOptions.forEach(option => {
          markdown += `* ${option.description}\n`;
          if (option.exercise) markdown += `  * Exercise: ${option.exercise}\n`;
          if (option.reps) markdown += `  * Reps: ${option.reps}\n`;
        });
        markdown += `\n`;
      }

      if (exercise.personalBestReference) {
        markdown += `💪 **Reference your personal best for this movement** 💪\n\n`;
      }
    });
  }

  return markdown;
}
