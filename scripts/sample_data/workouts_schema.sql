CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
