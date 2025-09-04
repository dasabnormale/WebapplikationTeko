import { JSDOM } from "jsdom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
    // eslint-disable-next-line no-new-func
    return new Function(`${sourceCode}; return { fetchAutocompleteResults, fetchGeocodeSearch, fetchRouteDirections, saveRouteToBackend, fetchSavedRoutes, deleteSavedRouteById };`)();
}

describe("network helpers", () => {
    let functions;

    beforeEach(() => {
        functions = loadFunctions();
        globalThis.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({}) });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("fetchAutocompleteResults baut die korrekte URL", async () => {
        await functions.fetchAutocompleteResults("Bern");
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const requestUrl = new URL(globalThis.fetch.mock.calls[0][0]);
        expect(requestUrl.pathname).toBe("/api/ors/autocomplete");
        expect(requestUrl.searchParams.get("text")).toBe("Bern");
        expect(requestUrl.searchParams.get("size")).toBe("5");
    });

    it("fetchGeocodeSearch baut die korrekte URL", async () => {
        await functions.fetchGeocodeSearch("Zürich HB");
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const requestUrl = new URL(globalThis.fetch.mock.calls[0][0]);
        expect(requestUrl.pathname).toBe("/api/ors/search");
        expect(requestUrl.searchParams.get("text")).toBe("Zürich HB");
        expect(requestUrl.searchParams.get("size")).toBe("1");
    });

    it("fetchRouteDirections sendet POST mit Body", async () => {
        await functions.fetchRouteDirections({ longitude: 7, latitude: 46 }, { longitude: 8, latitude: 47 });
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const [, options] = globalThis.fetch.mock.calls[0];
        expect(options.method).toBe("POST");
        expect(options.headers).toMatchObject({ "Content-Type": "application/json" });
        const bodyObject = JSON.parse(options.body);
        expect(bodyObject.instructions).toBe(true);
        expect(bodyObject.language).toBe("de");
        expect(bodyObject.coordinates).toEqual([[7, 46], [8, 47]]);
    });

    it("saveRouteToBackend sendet POST /api/routes mit JSON-Body", async () => {
        const payload = { startLabel: "A", startLon: 1, startLat: 2, endLabel: "B", endLon: 3, endLat: 4 };
        await functions.saveRouteToBackend(payload);
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const [firstArg, options] = globalThis.fetch.mock.calls[0];
        expect(firstArg).toBe("/api/routes");
        expect(options.method).toBe("POST");
        expect(options.headers).toMatchObject({ "Content-Type": "application/json" });
        expect(JSON.parse(options.body)).toEqual(payload);
    });

    it("fetchSavedRoutes ruft GET /api/routes auf", async () => {
        await functions.fetchSavedRoutes();
        expect(globalThis.fetch).toHaveBeenCalledWith("/api/routes");
    });

    it("deleteSavedRouteById ruft DELETE /api/routes/:id auf", async () => {
        await functions.deleteSavedRouteById(42);
        const [firstArg, options] = globalThis.fetch.mock.calls[0];
        expect(firstArg).toBe("/api/routes/42");
        expect(options.method).toBe("DELETE");
    });
});
