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
    if (!sourceCode) throw new Error("app.js nicht gefunden");
    return new Function(`${sourceCode}; return { renderStepInstructions };`)();
}

describe("renderStepInstructions", () => {
    let functionCollection;
    beforeEach(() => {
        document.body.innerHTML = '<main class="container"></main>';
        functionCollection = loadFunctions();
    });

    it("rendert Schritte als Listeneinträge", () => {
        const stepList = [
            { instruction: "Geradeaus" },
            { instruction: "Links abbiegen" },
            { instruction: "Rechts abbiegen" }
        ];
        functionCollection.renderStepInstructions(stepList);
        const listElement = document.getElementById("steps");
        expect(listElement).toBeTruthy();
        const items = listElement.querySelectorAll("li");
        expect(items.length).toBe(3);
        expect(items[0].textContent).toBe("Geradeaus");
        expect(items[2].textContent).toBe("Rechts abbiegen");
    });
});
