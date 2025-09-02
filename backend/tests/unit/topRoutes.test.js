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
    return new Function(`${sourceCode}; return { renderTopRouteSearches, increaseTopRouteSearchCount };`)();
}

describe("TopRoutes", () => {
    let functionCollection;
    beforeEach(() => {
        document.body.innerHTML = '<main class="container"></main>';
        localStorage.clear();
        localStorage.setItem("topRoutes", JSON.stringify({
            "Bern → Zürich": 5,
            "Basel → Luzern": 2,
            "Chur → Davos": 7
        }));
        functionCollection = loadFunctions();
    });

    it("rendert sortierte Liste", () => {
        functionCollection.renderTopRouteSearches();
        const listElement = document.getElementById("topRoutes");
        const items = Array.from(listElement.querySelectorAll("li")).map(e => e.textContent);
        expect(items[0]).toMatch(/Chur → Davos \(7\)/);
        expect(items).toContain("Bern → Zürich (5)");
        expect(items).toContain("Basel → Luzern (2)");
    });

    it("erhöht Zähler", () => {
        functionCollection.increaseTopRouteSearchCount("Bern → Zürich");
        const raw = localStorage.getItem("topRoutes");
        const parsed = JSON.parse(raw);
        expect(parsed["Bern → Zürich"]).toBe(6);
    });
});