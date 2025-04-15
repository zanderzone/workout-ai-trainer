import { useState, useCallback } from 'react';
import { FitnessProfileData, ValidationErrors, validationService } from '@/lib/validation';

interface UseFormValidationProps {
    onValidationChange?: (isValid: boolean) => void;
    initialData?: Partial<FitnessProfileData>;
}

export function useFormValidation({ onValidationChange, initialData }: UseFormValidationProps = {}) {
    const [formData, setFormData] = useState<Partial<FitnessProfileData>>({
        goals: [],
        availableEquipment: [],
        preferredTrainingDays: [],
        injuriesOrLimitations: [],
        fitnessLevel: 'beginner',
        ageRange: '18-24',
        sex: 'male',
        preferredWorkoutDuration: 'medium',
        locationPreference: 'gym',
        ...initialData
    });
    const [errors, setErrors] = useState<ValidationErrors>({});

    const updateField = useCallback((field: keyof FitnessProfileData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Validate the field
        const result = validationService.validateField(field, value);
        if (!result.isValid && result.errors.length > 0) {
            setErrors(prev => ({
                ...prev,
                [field]: result.errors[0].message
            }));
        } else {
            setErrors(prev => {
                const { [field]: _, ...rest } = prev;
                return rest;
            });
        }

        onValidationChange?.(Object.keys(errors).length === 0);
    }, [errors, onValidationChange]);

    const updateFields = useCallback((fields: Partial<FitnessProfileData>) => {
        setFormData(prev => ({
            ...prev,
            ...fields
        }));

        // Validate all updated fields
        const newErrors: ValidationErrors = {};
        Object.entries(fields).forEach(([field, value]) => {
            const result = validationService.validateField(field as keyof FitnessProfileData, value);
            if (!result.isValid && result.errors.length > 0) {
                newErrors[field] = result.errors[0].message;
            }
        });

        setErrors(prev => ({
            ...prev,
            ...newErrors
        }));

        onValidationChange?.(Object.keys(newErrors).length === 0);
    }, [onValidationChange]);

    const validateStep = useCallback((step: 'basic' | 'fitness' | 'preferences') => {
        const result = validationService.validateStep(step, formData);
        const newErrors = validationService.formatErrors(result.errors);
        setErrors(newErrors);
        onValidationChange?.(result.isValid);
        return { isValid: result.isValid, errors: newErrors };
    }, [formData, onValidationChange]);

    const validateForm = useCallback(() => {
        const result = validationService.validateFitnessProfile(formData);
        const newErrors = validationService.formatErrors(result.errors);
        setErrors(newErrors);
        onValidationChange?.(result.isValid);
        return { isValid: result.isValid, errors: newErrors };
    }, [formData, onValidationChange]);

    const resetForm = useCallback(() => {
        setFormData({
            goals: [],
            availableEquipment: [],
            preferredTrainingDays: [],
            injuriesOrLimitations: [],
            fitnessLevel: 'beginner',
            ageRange: '18-24',
            sex: 'male',
            preferredWorkoutDuration: 'medium',
            locationPreference: 'gym',
            ...initialData
        });
        setErrors({});
        onValidationChange?.(true);
    }, [initialData, onValidationChange]);

    return {
        formData,
        errors,
        isValid: Object.keys(errors).length === 0,
        validateStep,
        validateForm,
        updateField,
        updateFields,
        resetForm,
        getFormattedErrors: () => errors
    };
} 