export class MemoryStorage<T extends string | number | symbol, I> {
    private object = {} as Record<T, I>;

    public add(key: T, value: I) {
        this.object[key] = value;
    }

    public delete(key: T) {
        delete this.object[key];
    }

    public includes(key: T) {
        const keys = Object.keys(this.object);

        if (!keys) return false;

        return keys.includes(key.toString());
    }

    public get(key: T) {
        return this.object[key];
    }

    public getAll() {
        return this.object;
    }
}
