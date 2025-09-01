import { JSDOM } from "jsdom";
import { describe, it, expect } from "vitest";
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
        throw new Error("app.js nicht gefunden (erwartet in public/ oder Root).");
    }


    return new Function(`${sourceCode}; return { formatSecondsToReadableTime };`)();
}

describe("formatSecondsToReadableTime", () => {
    it("formatiert Minuten korrekt", () => {
        const { formatSecondsToReadableTime } = loadFunctions();
        expect(formatSecondsToReadableTime(180)).toBe("3m");
    });

    it("formatiert Stunden und Minuten korrekt", () => {
        const { formatSecondsToReadableTime } = loadFunctions();
        expect(formatSecondsToReadableTime(3660)).toBe("1h 1m");
    });
});
