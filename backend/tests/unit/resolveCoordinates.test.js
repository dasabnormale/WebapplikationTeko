import { JSDOM } from "jsdom";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fileSystem from "fs";
import * as pathModule from "path";

const virtualEnvironment = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
globalThis.window = virtualEnvironment.window;
globalThis.document = virtualEnvironment.window.document;
globalThis.localStorage = virtualEnvironment.window.localStorage;

function loadFunctions() {
    const candidatePaths = ["public/app.js", "app.js"];
    let sourceCode = null;
    for (const relativePath of candidatePaths) {
        const absolutePath = pathModule.resolve(relativePath);
        if (fileSystem.existsSync(absolutePath)) {
            sourceCode = fileSystem.readFileSync(absolutePath, "utf8");
            break;
        }
    }
    if (!sourceCode) throw new Error("app.js nicht gefunden");
    return new Function(`${sourceCode}; return { resolveCoordinates };`)();
}

describe("resolveCoordinates", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("liefert Koordinaten aus dem Cache", async () => {
        const { resolveCoordinates } = loadFunctions();
        const cacheMap = new Map();
        cacheMap.set("Bern", { longitude: 7.4474, latitude: 46.948 });
        const result = await resolveCoordinates("Bern", cacheMap);
        expect(result.label).toBe("Bern");
        expect(result.coord).toEqual({ longitude: 7.4474, latitude: 46.948 });
    });

    it("holt Koordinaten über fetch, wenn nicht im Cache", async () => {
        const { resolveCoordinates } = loadFunctions();
        const cacheMap = new Map();
        const mockedFetch = vi.fn().mockResolvedValue({
            json: () =>
                Promise.resolve({
                    features: [
                        {
                            properties: { label: "Zürich HB" },
                            geometry: { coordinates: [8.54, 47.38] }
                        }
                    ]
                })
        });
        globalThis.fetch = mockedFetch;
        const result = await resolveCoordinates("Zürich HB", cacheMap);
        expect(mockedFetch).toHaveBeenCalledTimes(1);
        expect(result.label).toBe("Zürich HB");
        expect(result.coord).toEqual({ longitude: 8.54, latitude: 47.38 });
    });
});