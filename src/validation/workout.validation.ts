import { z } from "zod";
import { ObjectId } from "mongodb";

// Time format validation (e.g., "60 minutes", "1 hour", "45 min")
const timeFormatRegex = /^\d+\s*(minute|hour|min|hr)s?$/i;
const timeFormatSchema = z.string().refine(
    (val) => timeFormatRegex.test(val),
    "Time must be in format: '60 minutes', '1 hour', '45 min'"
);

// Equipment validation
const equipmentSchema = z.array(
    z.string().min(1, "Equipment name cannot be empty")
).min(1, "At least one piece of equipment is required");

// Exercise name validation
const exerciseNameSchema = z.string()
    .min(1, "Exercise name cannot be empty")
    .max(100, "Exercise name is too long")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Exercise name can only contain letters, numbers, spaces, hyphens, and underscores");

// Enhanced workout options validation
export const enhancedWorkoutOptionsSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    userDescription: z.string().max(500, "Description is too long").optional(),
    scaling: z.string().max(200, "Scaling description is too long").optional(),
    includeScalingOptions: z.boolean().optional(),
    totalAvailableTime: timeFormatSchema.optional(),
    workoutPlanDuration: timeFormatSchema.optional(),
    workoutDuration: timeFormatSchema.optional(),
    workoutFocus: z.enum([
        "Strength",
        "Conditioning",
        "Endurance",
        "Power",
        "Olympic Weightlifting",
        "Gymnastics",
        "Mixed Modal"
    ]).optional(),
    availableEquipment: equipmentSchema.optional(),
    preferredTrainingDays: z.array(
        z.enum([
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ])
    ).optional(),
    includeWarmups: z.boolean().optional(),
    includeAlternateMovements: z.boolean().optional(),
    includeCooldown: z.boolean().optional(),
    includeRestDays: z.boolean().optional(),
    includeBenchmarkWorkouts: z.boolean().optional(),
    outdoorWorkout: z.boolean().optional(),
    indoorAndOutdoorWorkout: z.boolean().optional(),
    periodization: z.enum([
        "concurrent",
        "linear",
        "undulating",
        "block"
    ]).optional(),
    weather: z.enum([
        "sunny",
        "cloudy",
        "rainy",
        "snowy",
        "windy",
        "hot",
        "cold"
    ]).optional(),
    location: z.enum([
        "gym",
        "home",
        "park",
        "outdoor",
        "indoor"
    ]).optional(),
    goals: z.array(
        z.enum([
            "weight loss",
            "muscle gain",
            "strength",
            "endurance",
            "power",
            "flexibility",
            "general fitness"
        ])
    ).optional(),
    includeExercises: z.array(exerciseNameSchema).optional(),
    excludeExcercises: z.array(exerciseNameSchema).optional(),
    wodRequestTime: z.string().regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Time must be in 24-hour format (HH:MM)"
    ).optional(),
});

// Exercise validation schema
export const exerciseValidationSchema = z.object({
    exercise: exerciseNameSchema,
    reps: z.string().regex(/^\d+(x\d+)?$/, "Reps must be in format: '10' or '3x10'").optional(),
    weight: z.string().regex(/^\d+(\.\d+)?$/, "Weight must be a number").optional(),
    height: z.string().regex(/^\d+(\.\d+)?$/, "Height must be a number").optional(),
    distance: z.string().regex(/^\d+(\.\d+)?$/, "Distance must be a number").optional(),
    type: z.enum([
        "strength",
        "cardio",
        "gymnastics",
        "olympic",
        "accessory",
        "warmup",
        "cooldown"
    ]).optional(),
    goal: z.string().max(100, "Goal description is too long").optional(),
    scalingOptions: z.array(
        z.object({
            description: z.string().max(200, "Scaling description is too long").optional(),
            exercise: exerciseNameSchema.optional(),
            reps: z.string().regex(/^\d+(x\d+)?$/, "Reps must be in format: '10' or '3x10'").optional(),
        })
    ).optional(),
    personalBestReference: z.boolean().optional(),
});

// Activity validation schema
export const activityValidationSchema = z.object({
    activity: z.string().max(100, "Activity name is too long").optional(),
    duration: timeFormatSchema.optional(),
    intensity: z.enum(["low", "medium", "high"]).optional(),
    reps: z.string().regex(/^\d+(x\d+)?$/, "Reps must be in format: '10' or '3x10'").optional(),
    weight: z.string().regex(/^\d+(\.\d+)?$/, "Weight must be a number").optional(),
    height: z.string().regex(/^\d+(\.\d+)?$/, "Height must be a number").optional(),
    distance: z.string().regex(/^\d+(\.\d+)?$/, "Distance must be a number").optional(),
    exercises: z.array(
        z.object({
            name: exerciseNameSchema,
            reps: z.string().regex(/^\d+(x\d+)?$/, "Reps must be in format: '10' or '3x10'").optional(),
            sets: z.string().regex(/^\d+(x\d+)?$/, "Sets must be in format: '3' or '3x10'").optional(),
            rest: timeFormatSchema.optional(),
        })
    ).optional(),
});

// Enhanced WOD validation schema
export const enhancedWodValidationSchema = z.object({
    _id: z.union([z.string(), z.instanceof(ObjectId)]).optional(),
    wodId: z.string(),
    userId: z.string(),
    description: z.string(),
    warmup: z.object({
        type: z.string().min(1, "Warmup type is required"),
        duration: timeFormatSchema.optional(),
        activities: z.array(activityValidationSchema).optional(),
    }),
    workout: z.object({
        type: z.string().min(1, "Workout type is required"),
        wodDescription: z.string().max(1000, "Description is too long").optional(),
        wodStrategy: z.string().max(500, "Strategy description is too long").optional(),
        wodGoal: z.string().max(200, "Goal description is too long").optional(),
        duration: timeFormatSchema.optional(),
        wodCutOffTime: timeFormatSchema.optional(),
        rest: timeFormatSchema.optional(),
        exercises: z.array(exerciseValidationSchema).optional(),
        rounds: z.number().int().positive("Rounds must be a positive integer").optional(),
    }),
    cooldown: z.object({
        type: z.string().min(1, "Cooldown type is required"),
        duration: timeFormatSchema.optional(),
        activities: z.array(activityValidationSchema).optional(),
    }),
    recovery: z.string().max(500, "Recovery description is too long").optional(),
    createdAt: z.date(),
    updatedAt: z.date()
}); 