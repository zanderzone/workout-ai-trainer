import { z } from "zod";

// Workout Schema Validation
export const workoutResponseSchema = z.object({
    workout_program_description: z.string(),
    workout_plan_duration: z.string(),
    workout_plan_type: z.string(),
    continuation_token: z.object({ 
        token: z.string(), 
        currentWeek: z.number().optional(),
        missingDays: z.array(z.number()),
        missingWeeks: z.array(z.number())
    }).optional(),
    workout_plan: z.array(
        z.object({
            week: z.number(),
            phase: z.string(),
            focus: z.string(),
            days: z.array(
                z.object({
                    day: z.number(),
                    warmup: z.object({
                        type: z.string(),
                        duration: z.string(),
                        activities: z.array(
                            z.object({
                                activity: z.string().optional(),
                                duration: z.string().optional(),
                                intensity: z.string().optional(),
                                reps: z.string().optional(),
                                weight: z.string().optional(),
                                height: z.string().optional(),
                                distance: z.string().optional(),
                                exercises: z.array(
                                    z.object({
                                        name: z.string(),
                                        reps: z.string().optional(),
                                        sets: z.string().optional(),
                                        rest: z.string().optional()
                                    })
                                ).optional()
                            })
                        ).optional()
                    }),
                    workout: z.object({
                        type: z.string(),
                        duration: z.string(),
                        exercises: z.array(
                            z.object({
                                exercise: z.string(),
                                reps: z.string().optional(),
                                rounds: z.string().optional(),
                                weight: z.string().optional(),
                                height: z.string().optional(),
                                distance: z.string().optional(),
                                goal: z.string().optional(),
                                scaling_options: z.array(
                                    z.object({
                                        description: z.string().optional(),
                                        exercise: z.string().optional(),
                                        reps: z.string().optional()
                                    })
                                ).optional(),
                                personalBestReference: z.boolean().optional()
                            })
                        ).optional()
                    }),
                    cooldown: z.object({
                        type: z.string(),
                        duration: z.string(),
                        activities: z.array(
                            z.object({
                                activity: z.string().optional(),
                                duration: z.string().optional(),
                                intensity: z.string().optional(),
                                reps: z.string().optional(),
                                weight: z.string().optional(),
                                height: z.string().optional(),
                                distance: z.string().optional(),
                                exercises: z.array(
                                    z.object({
                                        name: z.string(),
                                        reps: z.string().optional(),
                                        sets: z.string().optional(),
                                        rest: z.string().optional()
                                    })
                                ).optional()
                            })
                        ).optional()
                    }),
                    recovery: z.string().optional()
                })
            )
        })
    )
});

// Infer TypeScript type from Zod schema
export type WorkoutPlan = z.infer<typeof workoutResponseSchema>;

// Workout Result Schema
export const workoutResultSchema = z.object({
    date: z.string(),
    completed: z.boolean(),
    details: z.object({
        workout: z.string(),
        time: z.string().optional(),
        modifications: z.array(z.string()).optional(),
    }),
});

export type WorkoutResult = z.infer<typeof workoutResultSchema>;
