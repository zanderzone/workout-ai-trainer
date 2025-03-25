# Workout AI Trainer

## Overview

Workout AI Trainer is an AI-powered system that generates personalized CrossFit-style Workouts of the Day (WODs). The system uses OpenAI's models to create varied, challenging workouts based on user profiles, available equipment, and fitness goals. Each WOD includes a warm-up, main workout, and cool-down, with appropriate scaling options for different fitness levels.

## Core Features

### 1. Personalized WOD Generation
- Creates daily workouts based on user's:
  - Fitness level (beginner, intermediate, advanced)
  - Available equipment
  - Training goals
  - Injury history and limitations
  - Age and sex

### 2. CrossFit-Style Programming
- Mix of strength, conditioning, and gymnastics movements
- Benchmark workout integration
- Varied functional movements
- Appropriate intensity and volume based on user profile

### 3. Equipment-Aware
- Filters exercises based on available equipment
- Provides scaling options for different equipment setups
- Works with home gyms and commercial gyms
- Alternative movements when equipment is in use

### 4. Safety & Accessibility
- Includes scaling options for all exercises
- Provides alternative movements when needed
- Considers injury history and limitations
- Emphasizes proper form and progression

## Use Cases

### 1. Home Gym Training
- Generate WODs based on available equipment
- Structured daily workouts without a coach
- Consistent programming for steady progress

### 2. Commercial Gym Training
- Custom WODs that work with available equipment
- Alternative movements when equipment is in use
- Self-guided training with proper structure

### 3. CrossFit-Style Training
- Daily varied functional movements
- Mix of strength, conditioning, and gymnastics
- Benchmark workout integration
- Scaling options for all fitness levels

## Future Implementation

### Phase 1: Enhanced Personalization
- Integration with more AI models
- Better adaptation based on workout performance
- Expanded exercise library
- More detailed movement descriptions

### Phase 2: User Experience
- Web dashboard for WOD tracking
- Mobile app support
- Progress visualization
- Workout logging and history

### Phase 3: Advanced Features
- Support for additional fitness modalities
- Recovery recommendations
- Nutrition guidance
- Social features and sharing

### Phase 4: Performance Optimization
- Caching and database optimization
- API performance improvements
- Better error handling
- Rate limiting and backoff strategies

## Technical Requirements

- Node.js 18+
- TypeScript
- OpenAI API Key
- MongoDB (for user profiles and workout storage)
- Docker (optional, for running MongoDB locally)

## Local Environment Setup

### Prerequisites

1. Install Node.js 18+ from [nodejs.org](https://nodejs.org/)
2. Install MongoDB:
   - Option 1: Download and install from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Option 2: Use Docker (recommended):
     ```sh
     docker run -d -p 27017:27017 --name mongo-local mongo:latest
     ```

3. Get an OpenAI API key from [OpenAI](https://platform.openai.com/api-keys)

### Project Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/workout-ai-trainer.git
   cd workout-ai-trainer
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   ```sh
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```
   OPENAI_API_KEY=your-api-key-here
   MONGO_URI=mongodb://localhost:27017/workouts_ai_trainer
   PORT=3000
   NODE_ENV=development
   ```

4. Initialize the database:
   ```sh
   # Populate the database with sample users
   npx ts-node scripts/populate_users.ts
   ```

5. Start the development server:
   ```sh
   npm run dev
   ```

### Testing

1. Run the test suite:
   ```sh
   npm test
   ```

2. Run specific test files:
   ```sh
   # Test WOD generation
   npx ts-node scripts/testWodGeneration.ts
   
   # Test WOD scenarios
   npx ts-node scripts/testWodScenarios.ts
   
   # Test prompts
   npx ts-node scripts/test_prompts.ts
   ```

### Development Tools

- **TypeScript**: The project uses TypeScript for type safety and better development experience
- **ESLint**: Code linting is configured for consistent code style
- **Prettier**: Code formatting is handled by Prettier
- **Vitest**: Testing framework for unit and integration tests

### Common Issues

1. **MongoDB Connection Issues**:
   - Ensure MongoDB is running: `docker ps` (if using Docker)
   - Check connection string in `.env`
   - Verify MongoDB port (default: 27017)

2. **OpenAI API Issues**:
   - Verify API key in `.env`
   - Check API key permissions
   - Ensure sufficient API credits

3. **TypeScript Errors**:
   - Run `npm run build` to check for type errors
   - Ensure all dependencies are installed

## Development Workflow

### Branch Strategy

1. Create a feature branch:
   ```sh
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```sh
   git add .
   git commit -m "feat: description of your changes"
   ```

3. Push to your branch:
   ```sh
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request:
   - Use the PR template if available
   - Include a description of changes
   - Link any related issues
   - Request your own review

5. Review your changes:
   - Check the diff
   - Run tests locally
   - Verify the changes work as expected

6. Merge to main:
   ```sh
   git checkout main
   git merge feature/your-feature-name
   git push origin main
   ```

### Commit Message Guidelines

Use conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding or modifying tests
- `chore:` for maintenance tasks

Example:
```sh
git commit -m "feat: add scaling options for pull-ups"
git commit -m "fix: resolve MongoDB connection timeout"
git commit -m "docs: update README with new setup instructions"
```

### Testing Before PR

1. Run the test suite:
   ```sh
   npm test
   ```

2. Run specific test files:
   ```sh
   # Test WOD generation
   npx ts-node scripts/testWodGeneration.ts
   
   # Test WOD scenarios
   npx ts-node scripts/testWodScenarios.ts
   
   # Test prompts
   npx ts-node scripts/test_prompts.ts
   ```

3. Check for type errors:
   ```sh
   npm run build
   ```

4. Verify database changes:
   ```sh
   # Test database population
   npx ts-node scripts/populate_users.ts
   ```

## Getting Started

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/workout-ai-trainer.git
   cd workout-ai-trainer
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   ```sh
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

## Important Disclaimer

While Workout AI Trainer uses AI to generate WODs, it is essential to consult with a qualified fitness professional or healthcare provider before beginning any new exercise program. The information provided is for informational purposes only and should not be considered a substitute for professional guidance.

## Local Development Setup

### Prerequisites
- Node.js v18+
- Docker (for MongoDB and PostgreSQL)
- ngrok (for OAuth callback URLs)
- Apple Developer Account (for Apple Sign In)
- Google Cloud Project (for Google OAuth)

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
USE_LOCAL_MONGO=true
MONGODB_URI=mongodb://localhost:27017/workouts_ai_trainer
POSTGRES_URI=postgresql://postgres:secret@localhost:5432/workouts_ai_trainer

# Server
PORT=3000

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Authentication
AUTH_ENABLED=true
JWT_SECRET=your_jwt_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.ngrok.app/api/auth/google/callback
GOOGLE_STATE=google-auth-state

# Apple Sign In
APPLE_CLIENT_ID=com.your-app-bundle-id
APPLE_SERVICES_ID=com.your-app-bundle-id.signin.service
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY_PATH=config/keys/AuthKey_YOURKEY.p8
APPLE_CALLBACK_URL=https://your-domain.ngrok.app/api/auth/apple/callback

# Session Management
SESSION_SECRET=your_session_secret

# Frontend Configuration
FRONTEND_URL=http://localhost:3001
API_URL=https://your-domain.ngrok.app
```

### OAuth Setup

#### Google OAuth Setup
1. Create a project in Google Cloud Console
2. Enable OAuth 2.0 and create credentials
3. Add authorized redirect URIs (your ngrok URL)
4. Copy Client ID and Secret to `.env`

#### Apple Sign In Setup
1. Register an App ID in Apple Developer Console
2. Enable Sign in with Apple capability
3. Create a Services ID
4. Generate a private key
5. Place the private key in `config/keys/`
6. Update `.env` with your credentials

### Running the Application

1. Start the databases:
```bash
docker-compose up -d
```

2. Start ngrok (required for OAuth):
```bash
ngrok http 3000 --domain=your-domain.ngrok.app
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:auth` - Run auth flow tests
- `npm run test:wod` - Run workout generation tests

## Project Structure

```
.
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Express middleware
│   ├── routes/        # Express routes
│   ├── services/      # Business logic
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── frontend/          # Next.js frontend
└── scripts/          # Test and utility scripts
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

ISC

