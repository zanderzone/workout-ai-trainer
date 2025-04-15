import { z } from 'zod';

// Validation schemas
export const fitnessProfileSchema = z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    displayName: z.string().min(1, 'Display name is required').optional(),
    ageRange: z.enum(['18-24', '25-34', '35-44', '45-54', '55+']).optional(),
    sex: z.enum(['male', 'female', 'other']).optional(),
    fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    goals: z.array(z.enum([
        'weight loss',
        'muscle gain',
        'strength',
        'endurance',
        'power',
        'flexibility',
        'general fitness'
    ])).min(1, 'At least one goal is required').optional(),
    availableEquipment: z.array(z.string()).min(1, 'At least one piece of equipment is required').optional(),
    preferredTrainingDays: z.array(z.enum([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ])).optional(),
    preferredWorkoutDuration: z.enum(['short', 'medium', 'long']).optional(),
    locationPreference: z.enum(['gym', 'home', 'park', 'indoor', 'outdoor', 'both']).optional(),
    injuriesOrLimitations: z.array(z.string()).default([]),
    profilePicture: z.string().optional()
});

// Types
export type FitnessProfileData = z.infer<typeof fitnessProfileSchema>;

// Validation error type
export type ValidationError = {
    field: string;
    message: string;
};

// Validation result type
export interface ValidationResult<T> {
    isValid: boolean;
    errors: ValidationError[];
    data?: T;
}

export type ValidationErrors = {
    [key: string]: string;
};

class ValidationService {
    private static instance: ValidationService;

    private constructor() { }

    public static getInstance(): ValidationService {
        if (!ValidationService.instance) {
            ValidationService.instance = new ValidationService();
        }
        return ValidationService.instance;
    }

    // Validate fitness profile data
    public validateFitnessProfile = (data: Partial<FitnessProfileData>): ValidationResult<FitnessProfileData> => {
        try {
            const result = fitnessProfileSchema.parse(data);
            // Remove any default values that weren't in the original input
            const cleanedResult = Object.keys(result).reduce((acc, key) => {
                if (key in data) {
                    acc[key] = result[key];
                }
                return acc;
            }, {} as Record<string, any>);

            return {
                isValid: true,
                data: cleanedResult as FitnessProfileData,
                errors: []
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    isValid: false,
                    errors: error.errors.map(err => ({
                        field: err.path[0] as string,
                        message: err.message
                    }))
                };
            }
            return {
                isValid: false,
                errors: [{
                    field: 'unknown',
                    message: 'An unexpected validation error occurred'
                }]
            };
        }
    }

    // Validate individual field
    public validateField(field: keyof FitnessProfileData, value: any): ValidationResult<FitnessProfileData> {
        try {
            const fieldSchema = fitnessProfileSchema.shape[field];
            const validatedValue = fieldSchema.parse(value);
            return {
                isValid: true,
                errors: [],
                data: { [field]: validatedValue } as FitnessProfileData
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    isValid: false,
                    errors: error.errors.map(err => ({
                        field: field as string,
                        message: err.message
                    }))
                };
            }
            return {
                isValid: false,
                errors: [{
                    field: field as string,
                    message: 'An unexpected validation error occurred'
                }]
            };
        }
    }

    // Validate step data
    public validateStep(step: 'basic' | 'fitness' | 'preferences', data: Partial<FitnessProfileData>): ValidationResult<FitnessProfileData> {
        const stepFields = {
            basic: ['ageRange', 'sex'],
            fitness: ['fitnessLevel', 'goals', 'availableEquipment'],
            preferences: ['preferredTrainingDays', 'preferredWorkoutDuration', 'locationPreference']
        };

        const stepSchema = z.object(
            stepFields[step].reduce((acc, field) => ({
                ...acc,
                [field]: fitnessProfileSchema.shape[field]
            }), {})
        );

        try {
            const validatedData = stepSchema.parse(data);
            return {
                isValid: true,
                errors: [],
                data: validatedData as FitnessProfileData
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    isValid: false,
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                };
            }
            return {
                isValid: false,
                errors: [{
                    field: 'unknown',
                    message: 'An unexpected validation error occurred'
                }]
            };
        }
    }

    // Sanitize data before validation
    public sanitizeData(data: Partial<FitnessProfileData>): Partial<FitnessProfileData> {
        return {
            ...data,
            firstName: data.firstName?.trim(),
            lastName: data.lastName?.trim(),
            displayName: data.displayName?.trim(),
            goals: data.goals?.map(goal => goal.trim()),
            availableEquipment: data.availableEquipment?.map(equipment => equipment.trim()),
            injuriesOrLimitations: data.injuriesOrLimitations?.map(injury => injury.trim())
        };
    }

    // Format validation errors for display
    public formatErrors(errors: ValidationError[]): ValidationErrors {
        return errors.reduce((acc, error) => ({
            ...acc,
            [error.field]: error.message
        }), {} as ValidationErrors);
    }
}

// Export singleton instance
export const validationService = ValidationService.getInstance();

// Export types
export type { ValidationError, ValidationResult }; 