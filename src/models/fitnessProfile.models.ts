import { FitnessProfile as FitnessProfileType } from '../types/fitnessProfile.types';

/**
 * FitnessProfile model
 * 
 * This model represents a user's fitness profile in the database.
 * It contains information about the user's fitness level, goals, equipment, etc.
 */
export class FitnessProfile implements FitnessProfileType {
    userId: string;
    ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
    sex?: "male" | "female" | "other";
    fitnessLevel: "beginner" | "intermediate" | "advanced";
    goals: Array<"weight loss" | "muscle gain" | "strength" | "endurance" | "power" | "flexibility" | "general fitness">;
    injuriesOrLimitations?: string[];
    availableEquipment: string[];
    preferredTrainingDays?: Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday">;
    preferredWorkoutDuration?: "short" | "medium" | "long";
    locationPreference?: "gym" | "home" | "park" | "indoor" | "outdoor" | "both";
    createdAt: Date;
    updatedAt: Date;

    constructor(data: FitnessProfileType) {
        this.userId = data.userId;
        this.ageRange = data.ageRange;
        this.sex = data.sex;
        this.fitnessLevel = data.fitnessLevel;
        this.goals = data.goals;
        this.injuriesOrLimitations = data.injuriesOrLimitations;
        this.availableEquipment = data.availableEquipment;
        this.preferredTrainingDays = data.preferredTrainingDays;
        this.preferredWorkoutDuration = data.preferredWorkoutDuration;
        this.locationPreference = data.locationPreference;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    /**
     * Create a new fitness profile
     */
    static create(data: Omit<FitnessProfileType, 'createdAt' | 'updatedAt'>): FitnessProfile {
        return new FitnessProfile({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    /**
     * Update the fitness profile with new data
     */
    update(data: Partial<FitnessProfileType>): void {
        Object.assign(this, data);
        this.updatedAt = new Date();
    }

    /**
     * Convert the fitness profile to a plain object
     */
    toJSON(): FitnessProfileType {
        return {
            userId: this.userId,
            ageRange: this.ageRange,
            sex: this.sex,
            fitnessLevel: this.fitnessLevel,
            goals: this.goals,
            injuriesOrLimitations: this.injuriesOrLimitations,
            availableEquipment: this.availableEquipment,
            preferredTrainingDays: this.preferredTrainingDays,
            preferredWorkoutDuration: this.preferredWorkoutDuration,
            locationPreference: this.locationPreference,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
} 