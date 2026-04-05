// TypeScript 5.9 changed Object.values(any) to return unknown[] instead of any[].
// Since this codebase is incrementally migrated from JS, restore the any[] behavior.
interface ObjectConstructor {
    values(o: any): any[];
    keys(o: any): string[];
    entries(o: any): [string, any][];
}
