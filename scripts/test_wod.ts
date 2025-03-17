import { OpenAIWorkoutAdapter } from "../src/services/workout.service";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { WorkoutResult } from "../src/types/workout.types";
import { WorkoutOptions } from "../src/types/workoutOptions.types";

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

