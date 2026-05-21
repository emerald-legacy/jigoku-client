// TypeScript 5.9 changed Object.values(any) to return unknown[] instead of any[].
// Since this codebase is incrementally migrated from JS, prefer generic inference
// from Record-shaped objects so callers retain useful element types.
interface ObjectConstructor {
    values<T>(o: { [s: string]: T } | ArrayLike<T> | Record<string, T>): T[];
    keys<T>(o: { [s: string]: T } | ArrayLike<T> | Record<string, T>): string[];
    entries<T>(o: { [s: string]: T } | ArrayLike<T> | Record<string, T>): [string, T][];
}
