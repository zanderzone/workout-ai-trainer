import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile } from '../src/types/userProfile.types';
import { WorkoutOptions } from '../src/types/workoutOptions.types';

const API_URL = 'http://localhost:3000';

const userProfile: UserProfile = {
    ageRange: "45-54",
    sex: "male",
    fitnessLevel: "intermediate",
    goals: ["weight loss", "strength", "athletic conditioning"],
    injuriesOrLimitations: ["left knee tightness"]
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
        const userId = uuidv4();
        const response = await axios.post(`${API_URL}/wod`, {
            userId,
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