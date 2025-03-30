/* eslint-disable */
// @ts-nocheck
// This file is part of the future workout feature and is temporarily disabled

import { z } from 'zod';

// Define a schema for a single set in a strength training exercise
const strengthSetSchema = z.object({
  reps: z.number().int().positive(),
  weight: z.number().int().optional(), // Weight might not always be applicable (e.g., bodyweight exercises)
  notes: z.string().optional()
});

// Define a schema for a single exercise result
const exerciseResultSchema = z.object({
  exercise: z.string(),
  sets: z.array(strengthSetSchema).optional(), // Sets are optional, as they don't apply to all exercise types
  scaling: z.string().optional(), // How the exercise was scaled (if applicable)
  roundsCompleted: z.number().int().positive().optional(), // For workouts like AMRAPs
  timeTaken: z.string().optional(), // For timed workouts (e.g., "12:34")
  // Add other fields as needed for different workout types (e.g., distance, reps for specific exercises)
});

// Define the overall workout result schema
const workoutResultSchema = z.object({
  workoutId: z.string(),
  userId: z.string(),
  date: z.string().datetime({ offset: true }), // Use Zod's datetime validation with offset for proper time handling
  results: z.array(exerciseResultSchema).optional(),
  overallFeeling: z.string().optional(),
  additional_notes: z.string().optional()
});

// Generate the TypeScript interface from the schema
type WorkoutResult = z.infer<typeof workoutResultSchema>;

export { workoutResultSchema, WorkoutResult };