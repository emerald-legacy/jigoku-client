// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

import UserService from "../../../server/services/UserService.js";

function serviceWithCollection(collection: Record<string, unknown>): UserService {
    const service = Object.create(UserService.prototype);
    service.users = collection;
    return service;
}

const caseInsensitive = { locale: "en", strength: 2 };

describe("UserService lookups", () => {
    it("finds a user by exact username with a case-insensitive collation", async () => {
        const findOne = vi.fn().mockResolvedValue({ username: "Hida" });
        const service = serviceWithCollection({ findOne });

        expect(await service.getUserByUsername("hIDA")).toEqual({ username: "Hida" });
        expect(findOne).toHaveBeenCalledWith({ username: "hIDA" }, { collation: caseInsensitive });
    });

    it("treats regex characters in a username literally", async () => {
        const findOne = vi.fn().mockResolvedValue(null);
        const service = serviceWithCollection({ findOne });

        await service.getUserByUsername("a.*");
        expect(findOne).toHaveBeenCalledWith({ username: "a.*" }, { collation: caseInsensitive });
    });

    it("finds a user by exact email with a case-insensitive collation", async () => {
        const findOne = vi.fn().mockResolvedValue(null);
        const service = serviceWithCollection({ findOne });

        await service.getUserByEmail("Hida@Example.com");
        expect(findOne).toHaveBeenCalledWith({ email: "Hida@Example.com" }, { collation: caseInsensitive });
    });

    it("finds no user for a value that isn't a string, without querying", async () => {
        const findOne = vi.fn().mockResolvedValue({ username: "Hida" });
        const service = serviceWithCollection({ findOne });
        const operator = { $regex: "^H" } as unknown as string;

        expect(await service.getUserByUsername(operator)).toBeNull();
        expect(await service.getUserByEmail(operator)).toBeNull();
        expect(findOne).not.toHaveBeenCalled();
    });
});

describe("UserService.ensureIndexes", () => {
    it("creates username and email indexes with the lookup collation", async () => {
        const createIndex = vi.fn().mockResolvedValue("ok");
        const service = serviceWithCollection({ createIndex });

        await service.ensureIndexes();
        expect(createIndex).toHaveBeenCalledWith({ username: 1 }, { name: "username_ci", collation: caseInsensitive });
        expect(createIndex).toHaveBeenCalledWith({ email: 1 }, { name: "email_ci", collation: caseInsensitive });
    });

    it("does not throw when index creation fails", async () => {
        const createIndex = vi.fn().mockRejectedValue(new Error("boom"));
        const service = serviceWithCollection({ createIndex });

        await expect(service.ensureIndexes()).resolves.toBeUndefined();
    });
});
