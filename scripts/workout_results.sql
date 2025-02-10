CREATE TABLE workout_results (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workout_id INT REFERENCES workouts(id) ON DELETE CASCADE,
    result JSONB NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW()
);
