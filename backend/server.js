//imports
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

//umgebungsvariablen laden
dotenv.config();

//erstellt express app mit Datenbank
const app = express();
const prismaClient = new PrismaClient();

app.use(cors());
app.use(express.json());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

//api autocomplete
app.get("/api/ors/autocomplete", async (request, response) => {
    try {
        const orsUrl = new URL("https://api.openrouteservice.org/geocode/autocomplete");
        orsUrl.searchParams.set("text", String(request.query.text ?? ""));
        orsUrl.searchParams.set("size", String(request.query.size ?? "5"));
        orsUrl.searchParams.set("api_key", process.env.ORS_API_KEY);

        const orsResponse = await fetch(orsUrl.toString());
        const orsBody = await orsResponse.text();
        response.status(orsResponse.status).type("application/json").send(orsBody);
    } catch {
        response.status(500).json({ error: "ORS autocomplete proxy failed" });
    }
});

//api suche
app.get("/api/ors/search", async (request, response) => {
    try {
        const orsUrl = new URL("https://api.openrouteservice.org/geocode/search");
        orsUrl.searchParams.set("text", String(request.query.text ?? ""));
        orsUrl.searchParams.set("size", String(request.query.size ?? "1"));
        orsUrl.searchParams.set("api_key", process.env.ORS_API_KEY);

        const orsResponse = await fetch(orsUrl.toString());
        const orsBody = await orsResponse.text();
        response.status(orsResponse.status).type("application/json").send(orsBody);
    } catch {
        response.status(500).json({ error: "ORS search proxy failed" });
    }
});

//routenberechnung
app.post("/api/ors/directions", async (request, response) => {
    try {
        const orsResponse = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": process.env.ORS_API_KEY
            },
            body: JSON.stringify({
                coordinates: request.body.coordinates,
                instructions: !!request.body.instructions,
                language: request.body.language || "de"
            })
        });
        const orsBody = await orsResponse.text();
        response.status(orsResponse.status).type("application/json").send(orsBody);
    } catch {
        response.status(500).json({ error: "ORS directions proxy failed" });
    }
});

//swagger ui einbindung
const openapiPath = path.join(__dirname, "openapi.json");
const openapiJson = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiJson));

// validierungsherlfer
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

function validateNewRoute(routeBody) {
    const errorMessages = [];
    if (!routeBody || typeof routeBody !== "object") return ["body must be an object"];

    if (typeof routeBody.startLabel !== "string" || !routeBody.startLabel.trim()) errorMessages.push("startLabel required");
    if (!isFiniteNumber(routeBody.startLon)) errorMessages.push("startLon number required");
    if (!isFiniteNumber(routeBody.startLat)) errorMessages.push("startLat number required");
    if (typeof routeBody.endLabel !== "string" || !routeBody.endLabel.trim()) errorMessages.push("endLabel required");
    if (!isFiniteNumber(routeBody.endLon)) errorMessages.push("endLon number required");
    if (!isFiniteNumber(routeBody.endLat)) errorMessages.push("endLat number required");

    if (routeBody.distanceMeters != null && !Number.isInteger(routeBody.distanceMeters)) errorMessages.push("distanceMeters must be integer");
    if (routeBody.durationSeconds != null && !Number.isInteger(routeBody.durationSeconds)) errorMessages.push("durationSeconds must be integer");
    if (routeBody.stepsJson != null && typeof routeBody.stepsJson !== "string") errorMessages.push("stepsJson must be string");

    return errorMessages;
}

// rest alle routen lesen
app.get("/api/routes", async (_request, response) => {
    const routeList = await prismaClient.route.findMany({ orderBy: { createdAt: "desc" } });
    response.json(routeList);
});

//rest neue routen hinzufügen
app.post("/api/routes", async (request, response) => {
    const errorMessages = validateNewRoute(request.body);
    if (errorMessages.length) return response.status(400).json({ errors: errorMessages });

    const createdRoute = await prismaClient.route.create({
        data: {
            startLabel: request.body.startLabel.trim(),
            startLon: request.body.startLon,
            startLat: request.body.startLat,
            endLabel: request.body.endLabel.trim(),
            endLon: request.body.endLon,
            endLat: request.body.endLat,
            distanceMeters: request.body.distanceMeters ?? null,
            durationSeconds: request.body.durationSeconds ?? null,
            stepsJson: request.body.stepsJson ?? null
        }
    });

    response.status(201).json(createdRoute);
});

//einzelne route lesen
app.get("/api/routes/:id", async (request, response) => {
    const routeId = Number(request.params.id);
    if (!Number.isInteger(routeId)) return response.status(400).json({ error: "invalid id" });

    const foundRoute = await prismaClient.route.findUnique({ where: { id: routeId } });
    if (!foundRoute) return response.sendStatus(404);

    response.json(foundRoute);
});

//einzelne  route löschen
app.delete("/api/routes/:id", async (request, response) => {
    const routeId = Number(request.params.id);
    if (!Number.isInteger(routeId)) return response.status(400).json({ error: "invalid id" });

    try {
        await prismaClient.route.delete({ where: { id: routeId } });
        response.sendStatus(204);
    } catch {
        response.sendStatus(404);
    }
});

//check ob online
app.get("/health", (_request, response) => response.json({ ok: true }));

//serverstart
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API ready on http://localhost:${PORT}`);
    console.log(`Swagger UI on http://localhost:${PORT}/docs`);
});
