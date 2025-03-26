import { Collection, WithId, Document, OptionalUnlessRequiredId } from "mongodb";

export class BaseCollection<T extends Document> {
    protected collection: Collection<T>;

    constructor(collection: Collection<T>) {
        this.collection = collection;
    }

    async findOne(query: any): Promise<WithId<T> | null> {
        return this.collection.findOne(query);
    }

    async find(query: any): Promise<WithId<T>[]> {
        return this.collection.find(query).toArray();
    }

    async create(document: T): Promise<WithId<T>> {
        const result = await this.collection.insertOne(document as OptionalUnlessRequiredId<T>);
        return { ...document, _id: result.insertedId } as WithId<T>;
    }

    async update(query: any, update: any): Promise<boolean> {
        const result = await this.collection.updateOne(query, update);
        return result.modifiedCount > 0;
    }

    async delete(query: any): Promise<boolean> {
        const result = await this.collection.deleteOne(query);
        return result.deletedCount > 0;
    }
} 