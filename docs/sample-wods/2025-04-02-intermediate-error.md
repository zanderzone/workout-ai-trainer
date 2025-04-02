# Error Generating Workout for intermediate

## Error Details
- Error Type: InvalidWodStructureError
- Message: workout.exercises.1.type: Invalid enum value. Expected 'strength' | 'cardio' | 'gymnastics' | 'olympic' | 'accessory', received 'conditioning'

## Profile Information
{
  "userId": "1108d8c2-548c-4b30-a7bb-ccae367e1a8a",
  "ageRange": "25-34",
  "sex": "other",
  "fitnessLevel": "intermediate",
  "goals": [
    "muscle gain",
    "strength"
  ],
  "injuriesOrLimitations": [],
  "availableEquipment": [
    "barbell",
    "dumbbells",
    "kettlebells",
    "pull-up bar"
  ],
  "createdAt": "2025-04-02T05:08:04.821Z",
  "updatedAt": "2025-04-02T05:08:04.821Z"
}

## Workout Request
{
  "requestId": "fc026c3a-e219-4fe9-a4c5-194d3a7f07eb",
  "userId": "1108d8c2-548c-4b30-a7bb-ccae367e1a8a",
  "workoutFocus": "Strength & Conditioning",
  "totalAvailableTime": 60,
  "scalingPreference": "standard",
  "includeExercises": [
    "barbell squats",
    "kettlebell swings"
  ],
  "excludeExercises": [],
  "includeWarmups": true,
  "includeCooldown": true,
  "wodRequestTime": "2025-04-02T05:08:04.821Z",
  "createdAt": "2025-04-02T05:08:04.821Z",
  "updatedAt": "2025-04-02T05:08:04.821Z"
}