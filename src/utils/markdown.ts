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
  let markdown = '';

  // Add title and description
  markdown += `# ${wod.description}\n\n`;
  
  if (wod.duration) {
    markdown += `**Total Duration:** ${wod.duration}\n\n`;
  }

  // Format warmup section
  if (wod.wod.warmup) {
    markdown += formatWarmupOrCooldown(wod.wod.warmup, 'Warm-up');
  }

  // Format workout section
  markdown += formatWorkout(wod.wod.workout);

  // Format cooldown section
  if (wod.wod.cooldown) {
    markdown += formatWarmupOrCooldown(wod.wod.cooldown, 'Cool-down');
  }

  // Add recovery notes
  if (wod.wod.recovery) {
    markdown += `## Recovery Notes\n\n${wod.wod.recovery}\n\n`;
  }

  return markdown;
}

/**
 * Formats warmup or cooldown section
 * @param section The warmup or cooldown section
 * @param title Section title (Warm-up or Cool-down)
 * @returns Formatted markdown string
 */
function formatWarmupOrCooldown(section: WarmupOrCooldown, title: string): string {
  let markdown = `## ${title}\n\n`;
  
  if (section.type) {
    markdown += `**Type:** ${section.type}\n\n`;
  }
  
  if (section.duration) {
    markdown += `**Duration:** ${section.duration}\n\n`;
  }
  
  if (section.activities && section.activities.length > 0) {
    markdown += `### Activities:\n\n`;
    
    for (const activity of section.activities) {
      if (!activity.activity) continue;  // Skip if no activity name
      
      markdown += `* **${activity.activity}**`;
      
      const details: string[] = [];
      if (activity.duration) details.push(`Duration: ${activity.duration}`);
      if (activity.intensity) details.push(`Intensity: ${activity.intensity}`);
      if (activity.reps) details.push(`Reps: ${activity.reps}`);
      if (activity.weight) details.push(`Weight: ${activity.weight}`);
      if (activity.height) details.push(`Height: ${activity.height}`);
      if (activity.distance) details.push(`Distance: ${activity.distance}`);
      
      if (details.length > 0) {
        markdown += ` (${details.join(', ')})`;
      }
      markdown += '\n';
      
      // Format nested exercises if they exist
      if (activity.exercises && activity.exercises.length > 0) {
        for (const exercise of activity.exercises) {
          const exerciseDetails: string[] = [];
          if (exercise.reps) exerciseDetails.push(`${exercise.reps} reps`);
          if (exercise.sets) exerciseDetails.push(`${exercise.sets} sets`);
          if (exercise.rest) exerciseDetails.push(`Rest: ${exercise.rest}`);
          
          const detailsText = exerciseDetails.length > 0 ? ` - ${exerciseDetails.join(', ')}` : '';
          markdown += `  * ${exercise.name}${detailsText}\n`;
        }
      }
    }
    markdown += '\n';
  }
  
  return markdown;
}

/**
 * Formats the workout section
 * @param workout The workout section
 * @returns Formatted markdown string
 */
function formatWorkout(workout: Workout): string {
  let markdown = `## Workout\n\n`;
  
  if (workout.type) {
    markdown += `**Type:** ${workout.type}\n\n`;
  }
  
  if (workout.wodDescription) {
    markdown += `${workout.wodDescription}\n\n`;
  }
  
  const workoutDetails: string[] = [];
  if (workout.duration) workoutDetails.push(`**Duration:** ${workout.duration}`);
  if (workout.wodCutOffTime) workoutDetails.push(`**Cut-off Time:** ${workout.wodCutOffTime}`);
  if (workout.rounds !== undefined) workoutDetails.push(`**Rounds:** ${workout.rounds}`);
  if (workout.rest) workoutDetails.push(`**Rest:** ${workout.rest}`);
  
  if (workoutDetails.length > 0) {
    markdown += workoutDetails.join(' | ') + '\n\n';
  }
  
  if (workout.wodStrategy) {
    markdown += `### Strategy\n\n${workout.wodStrategy}\n\n`;
  }
  
  if (workout.wodGoal) {
    markdown += `### Goal\n\n${workout.wodGoal}\n\n`;
  }
  
  // Format exercises
  if (workout.exercises && workout.exercises.length > 0) {
    markdown += `### Exercises:\n\n`;
    
    for (const exercise of workout.exercises) {
      markdown += `#### ${exercise.exercise}\n\n`;
      
      const details: string[] = [];
      if (exercise.reps) details.push(`**Reps:** ${exercise.reps}`);
      if (exercise.weight) details.push(`**Weight:** ${exercise.weight}`);
      if (exercise.height) details.push(`**Height:** ${exercise.height}`);
      if (exercise.distance) details.push(`**Distance:** ${exercise.distance}`);
      if (exercise.type) details.push(`**Type:** ${exercise.type}`);
      
      if (details.length > 0) {
        markdown += details.join(' | ') + '\n\n';
      }
      
      if (exercise.personalBestReference) {
        markdown += `💪 **Reference your personal best for this movement** 💪\n\n`;
      }
      
      // Format scaling options
      if (exercise.scalingOptions && exercise.scalingOptions.length > 0) {
        markdown += `**Scaling Options:**\n\n`;
        
        for (const option of exercise.scalingOptions) {
          if (!option.description) continue;  // Skip if no description
          
          markdown += `* ${option.description}`;
          
          const optionDetails: string[] = [];
          if (option.exercise) optionDetails.push(`Exercise: ${option.exercise}`);
          if (option.reps) optionDetails.push(`Reps: ${option.reps}`);
          
          if (optionDetails.length > 0) {
            markdown += ` (${optionDetails.join(', ')})`;
          }
          markdown += '\n';
        }
        markdown += '\n';
        markdown += '\n';
      }
    }
  }
  
  return markdown;
}

// Export the helper functions if they need to be used elsewhere
export { formatWarmupOrCooldown, formatWorkout };
