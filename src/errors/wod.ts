import { ZodError } from "zod";

export class WodValidationError extends Error {
    constructor(message: string, public errors: ZodError["errors"]) {
        super(message);
        this.name = "WodValidationError";
    }
} 