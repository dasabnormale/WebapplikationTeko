import { JSDOM } from "jsdom";
import { describe, it, expect, beforeEach } from "vitest";
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

    if (!sourceCode) {
        throw new Error("app.js nicht gefunden");
    }

    return new Function(`${sourceCode}; return { fillDatalistWithSuggestions };`)();
}

describe("fillDatalistWithSuggestions", () => {
    let functions;
    beforeEach(() => {
        functions = loadFunctions();
    });

    it("füllt Datalist und Cache", () => {
        const datalistElement = document.createElement("datalist");
        const cacheMap = new Map();
        const featureList = [
            { properties: { label: "Bern" }, geometry: { coordinates: [7.4474, 46.948] } },
            { properties: { label: "Zürich" }, geometry: { coordinates: [8.5417, 47.3769] } }
        ];

        functions.fillDatalistWithSuggestions(datalistElement, featureList, cacheMap);

        expect(datalistElement.children.length).toBe(2);
        expect(datalistElement.children[0].value).toBe("Bern");
        expect(cacheMap.get("Bern")).toEqual({ longitude: 7.4474, latitude: 46.948 });
    });

    it("ignoriert unvollständige Einträge", () => {
        const datalistElement = document.createElement("datalist");
        const cacheMap = new Map();
        const featureList = [
            { properties: { label: "" }, geometry: { coordinates: [1, 2] } },
            { properties: { label: "Ok" }, geometry: { coordinates: [3, null] } }
        ];

        functions.fillDatalistWithSuggestions(datalistElement, featureList, cacheMap);

        expect(datalistElement.children.length).toBe(0);
        expect(cacheMap.size).toBe(0);
    });
});