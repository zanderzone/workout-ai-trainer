# Workout AI Trainer

## Overview
Workout AI Trainer is an AI-powered system designed to generate structured, periodized CrossFit workout plans based on user profiles, past workout history, and specific training goals. The AI ensures progressive and balanced training plans, incorporating various workout styles such as Olympic lifts, strength training, metabolic conditioning (metcon), and gymnastics.

🚀 **This is an early version of the API, and all use cases have not been fully addressed or identified. The API is a work in progress, and future versions will include improvements in workout generation and UI enhancements.**

## Features
- **Custom Workout Plans**: Tailors workouts based on the user’s fitness level, available equipment, and goals.
- **Periodization Support**: Supports structured programming such as block, linear, and undulating periodization.
- **Adaptive Scheduling**: Generates workouts for a given week and only proceeds to the next week when all workouts are completed or skipped.
- **Continuity Tracking**: Uses a `continuationToken` to track remaining workouts and ensure training progress.
- **JSON Schema Compliance**: Ensures AI-generated plans conform to a strict schema for consistency.

## Future Improvements
The following enhancements are planned for future versions:
- **Advanced AI Models**: Integration with multiple AI models to improve workout recommendations.
- **Personalization Enhancements**: Better adaptation based on user performance and past progress.
- **UI and Dashboard**: Development of a frontend interface for users to track their workouts.
- **Workout Recovery Recommendations**: Smarter recommendations for rest, mobility work, and injury prevention.
- **Database Optimization**: Improved handling of workout data with caching for faster responses.
- **Mobile Support**: API adjustments for seamless integration into mobile apps.
- **Expanded Exercise Library**: More detailed breakdowns and scaling options for workouts.


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

