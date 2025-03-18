import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BaseUser } from '../src/types/user.types';
import { WorkoutOptions } from '../src/types/workoutOptions.types';

const API_URL = 'http://localhost:3000';

const userProfile: BaseUser = {
    providerId: uuidv4(),
    email: "test@example.com",
    provider: "google",
    firstName: "Test",
    lastName: "User",
    ageRange: "45-54",
    sex: "male",
    fitnessLevel: "intermediate",
    goals: ["weight loss", "strength", "athletic conditioning"],
    injuriesOrLimitations: ["left knee tightness"],
    createdAt: new Date(),
    updatedAt: new Date()
};

const workoutOptions: WorkoutOptions = {
    totalAvailableTime: "60 minutes",
    userDescription: "Looking for an intense CrossFit style workout",
    workoutDuration: "10-15 minutes",
    scaling: "rx",
    includeScalingOptions: true,
    includeWarmups: true,
    includeAlternateMovements: true,
    includeCooldown: true,
    availableEquipment: [
        "barbell",
        "kettlebell",
        "pull up bar",
        "rowing machine"
    ]
};

async function testWodRequest() {
    try {
        const response = await axios.post(`${API_URL}/wod`, {
            userId: userProfile.providerId,
            userProfile,
            workoutOptions
        });

        console.log('Generated WOD:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error:', error.response?.data || error.message);
        } else {
            console.error('Error:', error);
        }
    }
}

testWodRequest(); 