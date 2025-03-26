import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile } from '../src/types/userProfile.types';
import { WorkoutOptions } from '../src/types/workoutOptions.types';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const CONFIG = {
    resultsDir: path.join(__dirname, '../test-results'),
    maxResultAge: 7, // days to keep test results
    maxResultFiles: 20, // maximum number of result files to keep
};

const API_URL = 'http://localhost:3000';

// Add this after the CONFIG definition and before the scenarios
interface TestResult {
    timestamp: string;
    scenarioName: string;
    requestData: any;
    response?: any;
    error?: any;
    status?: number;
    fetchedWod?: any;
}

// Test scenarios
const scenarios = {
    minimal: {
        name: 'Minimal Request',
        data: {
            userId: uuidv4()
        }
    },

    basic: {
        name: 'Basic Request',
        data: {
            userId: uuidv4(),
            userProfile: {
                ageRange: "45-54",
                fitnessLevel: "intermediate",
                goals: ["strength", "conditioning"]
            } as UserProfile,
            workoutOptions: {
                totalAvailableTime: "60 minutes",
                workoutDuration: "15 minutes",
                includeWarmups: true,
                includeCooldown: true
            } as WorkoutOptions
        }
    },

    full: {
        name: 'Full Request',
        data: {
            userId: uuidv4(),
            userProfile: {
                ageRange: "45-54",
                sex: "male",
                fitnessLevel: "beginner",
                goals: ["weight loss", "strength", "athletic conditioning", "endurance", "hypertrophy"],
                injuriesOrLimitations: ["left knee tightness"]
            } as UserProfile,
            workoutOptions: {
                userId: uuidv4(),
                totalAvailableTime: "45 minutes",
                userDescription: "I'd like an intense workout that focuses on strength and conditioning. Can you structure this for a group of experienced and intermediate level Crossfit athetes?",
                workoutDuration: "8 minutes <= duration <= 10 minutes",
                scaling: "shorter duration, shorter distances, lighter weight or bodyweight exercises",
                includeScalingOptions: true,
                includeWarmups: true,
                includeAlternateMovements: true,
                includeCooldown: true,
                includeRestDays: true,
                includeBenchmarkWorkouts: true,
                availableEquipment: [
                    "45 lb olympic barbell",
                    "35 lb olympic barbell",
                    "15-45 lb Dumbbell pairs",
                    "Bumper Plates weight > 300 lbs",
                    "53 lb kettlebells",
                    "32 lb kettlebells",
                    "jump ropes",
                    "pull up bar",
                    "Concept 2 Rower"
                ],
                weather: "current Woodland, CA weather",
                location: "garage home gym",
                indoorAndOutdoorWorkout: false,
                includeExercises: [],
                excludeExercises: []
            } as WorkoutOptions
        }
    },

    specificExercises: {
        name: 'Specific Exercises Request',
        data: {
            userId: uuidv4(),
            userProfile: {
                fitnessLevel: "intermediate",
                injuriesOrLimitations: ["shoulder pain"]
            } as UserProfile,
            workoutOptions: {
                totalAvailableTime: "45 minutes",
                includeExercises: ["deadlifts", "squats", "rowing"],
                excludeExcercises: ["pull-ups", "push-ups"],
                availableEquipment: ["barbell", "plates", "rowing machine"]
            } as WorkoutOptions
        }
    },

    invalidRequest: {
        name: 'Invalid Request (Missing userId)',
        data: {
            userProfile: {
                fitnessLevel: "intermediate"
            }
        }
    },

    invalidEnum: {
        name: 'Invalid Enum Values',
        data: {
            userId: uuidv4(),
            userProfile: {
                fitnessLevel: "super-advanced" as any,
                ageRange: "invalid-range" as any
            }
        }
    }
};

async function testScenario(name: string, data: any): Promise<TestResult> {
    console.log(`\n🏋️‍♂️ Testing Scenario: ${name}`);
    console.log('Request Data:', JSON.stringify(data, null, 2));

    const result: TestResult = {
        timestamp: new Date().toISOString(),
        scenarioName: name,
        requestData: data
    };

    try {
        const response = await axios.post(`${API_URL}/api/wod`, data);
        result.status = response.status;
        result.response = response.data;

        if (response.data._id) {
            const getResponse = await axios.get(`${API_URL}/api/wod/${response.data._id}`);
            result.fetchedWod = getResponse.data;
        }

    } catch (error) {
        if (axios.isAxiosError(error)) {
            result.status = error.response?.status;
            result.error = error.response?.data;
        } else {
            result.error = String(error);
        }
    }

    return result;
}

async function cleanupOldResults(): Promise<void> {
    try {
        console.log('🧹 Cleaning up old test results...');

        // Ensure directory exists
        try {
            await fs.access(CONFIG.resultsDir);
        } catch {
            console.log('No cleanup needed - results directory does not exist');
            return;
        }

        // Get all files in the directory
        const files = await fs.readdir(CONFIG.resultsDir);

        // Get file stats and add path info
        const fileStats = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(CONFIG.resultsDir, file);
                const stats = await fs.stat(filePath);
                return {
                    path: filePath,
                    name: file,
                    created: stats.birthtime,
                    size: stats.size
                };
            })
        );

        // Separate files by type
        const jsonFiles = fileStats.filter(file => file.name.includes('wod-test-results-'));
        const summaryFiles = fileStats.filter(file => file.name.includes('wod-test-summary-'));

        // Function to delete old files
        const deleteOldFiles = async (files: typeof fileStats) => {
            const now = new Date();
            const maxAge = CONFIG.maxResultAge * 24 * 60 * 60 * 1000; // Convert days to milliseconds

            // Sort files by creation date (newest first)
            const sortedFiles = files.sort((a, b) => b.created.getTime() - a.created.getTime());

            for (const file of sortedFiles) {
                const age = now.getTime() - file.created.getTime();
                const isOld = age > maxAge;
                const exceedsLimit = sortedFiles.indexOf(file) >= CONFIG.maxResultFiles;

                if (isOld || exceedsLimit) {
                    try {
                        await fs.unlink(file.path);
                        console.log(`Deleted old file: ${file.name}`);
                    } catch (error) {
                        console.error(`Failed to delete file ${file.name}:`, error);
                    }
                }
            }
        };

        // Delete old files of each type
        await Promise.all([
            deleteOldFiles(jsonFiles),
            deleteOldFiles(summaryFiles)
        ]);

        console.log('✨ Cleanup completed');
    } catch (error) {
        console.error('Error during cleanup:', error);
        // Don't throw error - cleanup failure shouldn't stop tests
    }
}

async function saveResults(results: TestResult[]) {
    try {
        await fs.mkdir(CONFIG.resultsDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `wod-test-results-${timestamp}.json`;
        const filepath = path.join(CONFIG.resultsDir, filename);
        const summaryPath = path.join(CONFIG.resultsDir, `wod-test-summary-${timestamp}.txt`);

        const summary = {
            testDate: new Date().toISOString(),
            totalTests: results.length,
            successfulTests: results.filter(r => r.status === 201 || r.status === 200).length,
            failedTests: results.filter(r => r.status !== 201 && r.status !== 200).length,
            results: results
        };

        const summaryContent = `
WOD API Test Summary
===================
Date: ${new Date().toLocaleString()}
Total Tests: ${summary.totalTests}
Successful Tests: ${summary.successfulTests}
Failed Tests: ${summary.failedTests}

Detailed Results:
${results.map(result => `
Scenario: ${result.scenarioName}
Status: ${result.status}
${result.error ? `Error: ${JSON.stringify(result.error)}` : 'Success'}
${'-'.repeat(50)}
`).join('\n')}`;

        await Promise.all([
            fs.writeFile(filepath, JSON.stringify(summary, null, 2)),
            fs.writeFile(summaryPath, summaryContent)
        ]);

        console.log(`\n📝 Test results saved to: ${filepath}`);
        console.log(`📝 Test summary saved to: ${summaryPath}`);
    } catch (error) {
        console.error('Error saving test results:', error);
        throw error;
    }
}

async function runTests() {
    console.log('🎯 Starting WOD API Tests\n');

    try {
        // Clean up old results first
        await cleanupOldResults();

        // Test each scenario
        const testResults: TestResult[] = [];
        for (const [key, scenario] of Object.entries(scenarios)) {
            const result = await testScenario(scenario.name, scenario.data);
            if (result) {
                testResults.push(result);
            }
        }

        // Test invalid WOD ID
        console.log('🔍 Testing Invalid WOD ID');
        try {
            await axios.get(`${API_URL}/api/wod/invalid-id`);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Expected Error! Status:', error.response?.status);
                console.log('Error Details:', error.response?.data);
            }
        }

        // Save all results
        await saveResults(testResults);
        console.log('✅ All tests completed and results saved successfully');

    } catch (error) {
        console.error('❌ Error during test execution:', error);
        process.exit(1);
    }
}

// Run the tests with proper error handling
runTests()
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    }); 