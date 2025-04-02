export const completeProfile = async (data: {
    firstName: string;
    lastName: string;
    displayName: string;
    profilePicture?: string;
    ageRange: string;
    sex: string;
    fitnessLevel: string;
    goals: string[];
    injuriesOrLimitations: string[];
    availableEquipment: string[];
    preferredTrainingDays: string[];
    preferredWorkoutDuration: string;
    locationPreference: string;
}) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/complete-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to complete profile');
        }

        return await response.json();
    } catch (error) {
        console.error('Error completing profile:', error);
        throw error;
    }
}; 