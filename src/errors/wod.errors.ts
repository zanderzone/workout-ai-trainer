export class WodGenerationError extends Error {
    constructor(message: string, public cause?: unknown) {
        super(message);
        this.name = 'WodGenerationError';
    }
}

export class InvalidAIResponseError extends WodGenerationError {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidAIResponseError';
    }
}

export class InvalidWorkoutRequestError extends WodGenerationError {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidWorkoutRequestError';
    }
}

export class InvalidWodStructureError extends WodGenerationError {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidWodStructureError';
    }
} 