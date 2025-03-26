import { Collection, WithId, Document, OptionalUnlessRequiredId } from "mongodb";
import { BaseCollection } from "./base.collection";
import { DatabaseError } from "../utils/error-handling";

export abstract class BaseService<T extends Document> extends BaseCollection<T> {
    constructor(collection: Collection<T>) {
        super(collection);
    }

    protected async createWithValidation(data: T, schema: any): Promise<WithId<T>> {
        const validation = schema.safeParse(data);
        if (!validation.success) {
            throw new DatabaseError("Invalid data", validation.error);
        }

        const result = await this.collection.insertOne(validation.data as OptionalUnlessRequiredId<T>);
        if (!result.acknowledged) {
            throw new DatabaseError("Failed to insert document");
        }

        return { ...validation.data, _id: result.insertedId } as WithId<T>;
    }

    protected async updateWithValidation(
        query: any,
        data: Partial<T>,
        schema: any,
        options: any = {}
    ): Promise<WithId<T> | null> {
        const validation = schema.safeParse(data);
        if (!validation.success) {
            throw new DatabaseError("Invalid data", validation.error);
        }

        const result = await this.collection.findOneAndUpdate(
            query,
            { $set: validation.data },
            { returnDocument: 'after', ...options }
        );

        return result.value as WithId<T> | null;
    }
} 