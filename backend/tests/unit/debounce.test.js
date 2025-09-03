import { JSDOM } from "jsdom";
import { describe, it, expect, vi } from "vitest";
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
    return new Function(`${sourceCode}; return { debounce };`)();
}

describe("debounce", () => {
    it("ruft die Funktion nach der Wartezeit einmalig auf", () => {
        vi.useFakeTimers();
        const { debounce } = loadFunctions();
        const calledFunction = vi.fn();
        const debouncedFunction = debounce(calledFunction, 300);
        debouncedFunction();
        debouncedFunction();
        debouncedFunction();
        expect(calledFunction).not.toHaveBeenCalled();
        vi.advanceTimersByTime(299);
        expect(calledFunction).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(calledFunction).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
});
