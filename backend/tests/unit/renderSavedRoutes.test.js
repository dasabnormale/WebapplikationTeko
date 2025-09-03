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
    // eslint-disable-next-line no-new-func
    return new Function(`${sourceCode}; return { renderSavedRoutes };`)();
}

describe("renderSavedRoutes", () => {
    let functionCollection;
    beforeEach(() => {
        document.body.innerHTML = '<main class="container"></main>';
        functionCollection = loadFunctions();
    });

    it("erstellt Liste und rendert Einträge", () => {
        const routes = [
            { id: 1, startLabel: "Bern", endLabel: "Zürich", distanceMeters: 121000, durationSeconds: 4800 },
            { id: 2, startLabel: "Basel", endLabel: "Luzern", distanceMeters: null, durationSeconds: null }
        ];

        functionCollection.renderSavedRoutes(routes);

        const listElement = document.getElementById("savedRoutes");
        expect(listElement).toBeTruthy();

        const items = listElement.querySelectorAll("li");
        expect(items.length).toBe(2);

        expect(listElement.textContent).toMatch(/Bern → Zürich/);
        expect(listElement.textContent).toMatch(/121\.0 km/);

        const deleteButton = items[0].querySelector("button.deleteSavedRouteButton");
        expect(deleteButton).toBeTruthy();
        expect(deleteButton.textContent).toBe("Delete");
        expect(deleteButton.getAttribute("data-id")).toBe("1");
    });
});
