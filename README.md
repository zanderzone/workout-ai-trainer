# Workout AI Trainer

## Overview

Workout AI Trainer is an AI-powered system designed to generate structured, periodized workout plans.  Initially focused on CrossFit-style programming, the system leverages user profiles, past workout history, and specific training goals to create progressive and balanced training plans.  The AI incorporates various workout styles, including Olympic lifts, strength training, metabolic conditioning (metcon), and gymnastics.  Future development will explore support for other fitness modalities, such as bodybuilding, powerlifting, running, and yoga.

**Currently we only support OpenAI models due to my familiarity with the product.  Further investigation is needed in open source models or lower cost options.**

**Target Audience:** Workout AI Trainer is designed for individuals who:

*   **Train at home with a home gym:**  The system takes into account available equipment to generate appropriate workouts.
*   **Train at globo gyms but prefer to follow their own programming:**  Workout AI Trainer provides assistance in creating structured and periodized workout plans, allowing users to take control of their training while benefiting from AI guidance.

🚀 **This is an early version of the API, and all use cases have not been fully addressed or identified. The API is a work in progress, and future versions will include improvements in workout generation, UI enhancements, and the expansion of supported fitness modalities.**

**Important Disclaimer:**  While Workout AI Trainer uses AI to generate workout plans based on user input, it is essential to consult with a qualified fitness professional or healthcare provider before beginning any new exercise program.  The information provided by Workout AI Trainer is for informational purposes only and should not be considered a substitute for professional guidance.  Individual results may vary, and engaging in any exercise program carries inherent risks.  By using Workout AI Trainer, you acknowledge and assume these risks.

## Features
- **Custom Workout Plans**: Tailors workouts based on the user’s fitness level, available equipment, and goals.
- **Periodization Support**: Supports structured programming such as block, linear, and undulating periodization.
- **Adaptive Scheduling**: Generates workouts for a given week and only proceeds to the next week when all workouts are completed or skipped.
- **Continuity Tracking**: Uses a `continuationToken` to track remaining workouts and ensure training progress.
- **JSON Schema Compliance**: Ensures AI-generated plans conform to a strict schema for consistency.

## Future Improvements
The following enhancements are planned for future versions:
- **Prompts**: Improving prompts to generate consistent and complete response is a work in progress.
- **Advanced AI Models**: Integration with multiple AI models to improve workout recommendations.
- **Personalization Enhancements**: Better adaptation based on user performance and past progress.
- **UI and Dashboard**: Development of a frontend interface for users to track their workouts.
- **Workout Recovery Recommendations**: Smarter recommendations for rest, mobility work, and injury prevention.
- **Database Optimization**: Improved handling of workout data with caching for faster responses.
- **Mobile Support**: API adjustments for seamless integration into mobile apps.
- **Expanded Exercise Library**: More detailed breakdowns and scaling options for workouts.
- **Exponential Backoff**: Support retry thresholds and exponential backoff for AI API requests.

## How It Works
1. **User Profile & History**: The system takes in user-specific data such as age, fitness level, and past workout performances.
2. **Workout Plan Generation**: The AI generates a workout plan, covering only the missing days for the current week.
3. **Validation**: The response is validated against the predefined JSON schema using `zod`.
4. **Progression Tracking**: The system waits for workout completion before advancing to the next week.

## Schema & Validation
Workout plans must conform to a predefined **JSON schema** to ensure consistency and completeness. The schema is validated using `zod`. A valid workout plan includes:
- **Workout Program Metadata**: Description, duration, and type.
- **Structured Weekly Plans**: Each week consists of multiple training days.
- **Workouts per Day**: Includes warm-ups, strength training, metcons, cooldowns, and recovery recommendations.
- **Continuation Tokens**: Tracks missing workouts to ensure users complete one week before advancing to the next.

Every AI-generated response is checked against this schema, and invalid responses are logged for debugging.

## How Workouts Are Requested (Multi-Week Plans)
For multi-week workout plans:
- Only **one week** of workouts is requested at a time.
- Users must complete or skip all workouts in a given week before the next week is requested.
- If some days are missing from the AI response, a continuation request is made for only those missing days.
- The process repeats until the full program duration is reached.

## Roadmap

This roadmap outlines the planned phases for the Workout AI Trainer project.  It will be updated as the project progresses.

**Phase 1: Minimum Viable Product (MVP) - Core Workout Generation**

*   **Goal:** A functional API endpoint that generates basic, structured CrossFit-style workouts in JSON format. Focus on core functionality.
*   **Timeline:** 2-4 weeks (adjust as needed)
*   **Key Features:**
    *   Workout Generation (Core): Generate workouts with warm-ups, exercises (strength, metcon, gymnastics – start with a *very* limited exercise library), and cool-downs. Focus on structure and JSON schema compliance.
    *   JSON Schema Definition: Finalize the *strict* JSON schema for workout plans. This is *critical*.
    *   Basic Endpoint (`/api/workout/generate`): Implement the core endpoint. For the MVP, accept *minimal* input (e.g., a simple training goal).
    *   Unit Tests: Write unit tests for the workout generation logic and the endpoint.
*   **Milestones:**
    *   JSON schema defined and validated.
    *   Basic workout generation logic implemented.
    *   `/api/workout/generate` endpoint functional.
    *   Unit tests passing.
*   **Database:** In-memory storage, a simple JSON file, or a very basic MongoDB setup.

**Phase 2: User Profiles and Preferences**

*   **Goal:** Enable users to create profiles and store preferences.
*   **Timeline:** 2-3 weeks
*   **Key Features:**
    *   User Management (Basic): User registration, login (basic authentication), and profile updates (fitness level, equipment, goals).
    *   Workout Generation (Preferences): Modify generation logic to incorporate user preferences (e.g., equipment filtering).
*   **Milestones:**
    *   Database schema updated for users and preferences.
    *   User management endpoints implemented.
    *   Workout generation updated to use preferences.
    *   Integration tests for preference-based generation.
*   **Database:** Commit to MongoDB.

**Phase 3: Workout Tracking and Logging**

*   **Goal:** Allow users to log workouts and track basic progress.
*   **Timeline:** 3-4 weeks
*   **Key Features:**
    *   Workout Tracking & Performance Logging: Endpoints for logging workouts (sets, reps, weights, fatigue).
    *   Basic Progress Tracking: Basic progress metrics (total weight lifted, workouts completed, PR tracking).
*   **Milestones:**
    *   Database schema updated for workout logs.
    *   Workout logging endpoints implemented.
    *   Progress calculation logic implemented.
    *   Basic progress display in API response (or simple UI).

**Phase 4: Adaptive Workouts (and Advanced Features)**

*   **Goal:** Begin implementing adaptive workout adjustments.
*   **Timeline:** Ongoing
*   **Key Features:**
    *   Adaptive Workout Adjustments (Initial Implementation): Progressive overload.
    *   Periodization: Basic periodization schemes (linear, undulating).
*   **Milestones:**
    *   Performance analysis algorithms developed.
    *   Workout adjustment logic implemented.
    *   Periodization logic integrated.

**Future Phases (Beyond Phase 4):**

*   Advanced AI Models
*   Personalization Enhancements
*   UI and Dashboard
*   Workout Recovery Recommendations
*   Database Optimization
*   Mobile Support
*   Expanded Exercise Library
*   Exponential Backoff

## Installation
### Prerequisites
- Node.js 18+
- TypeScript
- OpenAI API Key
- PostgreSQL (optional for logging)

### **Connecting to the Databases**
#### **PostgreSQL**
- Use the following command to connect to the PostgreSQL database inside the container:
   ```sh
   docker exec -it postgres-local psql -U postgres -d workouts
   ```
- To check running containers:
   ```sh
   docker ps
   ```

#### **MongoDB**
- Connect to the MongoDB shell:
   ```sh
   docker exec -it mongo-local mongosh
   ```
- List available databases:
   ```sh
   show dbs
   ```
   
### Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/workout-ai-trainer.git
   cd workout-ai-trainer
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and set your OpenAI API key:
   ```sh
   OPENAI_API_KEY=your-api-key-here
   ```
4. Run the service:
   ```sh
   npm run dev
   ```

## API Usage
### Generate a Workout Plan
**Endpoint:** `POST /api/workout/generate`

**Request Body:**
```json
{
  "userId": "12345",
  "userProfile": {
    "fitnessLevel": "Intermediate",
    "availableEquipment": ["barbell", "kettlebell", "pull-up bar"],
    "workoutFocus": "Strength & Conditioning"
  },
  "pastResults": [
    { "workout": "Fran", "time": "4:35", "scaling": "Rx" },
    { "workout": "Back Squat", "weight": "225 lbs", "reps": "5" }
  ],
  "continuationToken": null
}
```

**Response:**
```json
{
  "workoutPlan": {
    "workout_plan": [
      {
        "week": 1,
        "days": [
          {
            "day": 1,
            "warmup": { "type": "dynamic", "duration": "10 minutes" },
            "workout": { "type": "strength", "exercises": [{ "exercise": "Back Squat", "reps": "5", "rounds": "5", "weight": "80% 1RM" }] },
            "cooldown": { "type": "stretching", "duration": "10 minutes" }
          }
        ]
      }
    ]
  },
  "continuationToken": { "token": "abc123", "missingDays": [2, 3, 4, 5, 6, 7], "currentWeek": 1 }
}
```

## Generated Workout Plan
The AI-generated workout plan can be accessed in detail in the **[Generated Workout](docs/generated_workout.md)** file.

## Running `test_prompts.ts`
The `test_prompts.ts` script allows fine-tuning of AI-generated prompts before integration. To run it:
```sh
npx ts-node scripts/test_prompts.ts
```
Modify the test prompt file to adjust parameters such as user profile, past results, and continuation tokens to debug AI responses effectively.

## Automatically Generating `.gitignore`
To prevent unnecessary files from being committed, the repository includes a `.gitignore` file. You can generate one using:
```sh
npx gitignore node
```
Alternatively, manually create `.gitignore` and include:
```
# Node dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env

# Build output
dist/

# Logs
logs/
*.log
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License
This project is licensed under the MIT License.

