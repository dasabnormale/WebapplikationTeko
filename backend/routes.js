//imports
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

//erstellt express app mit Datenbank
const prismaClient = new PrismaClient();
const router = Router();

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
router.get("/", async (_request, response) => {
    const routeList = await prismaClient.route.findMany({ orderBy: { createdAt: "desc" } });
    response.json(routeList);
});

//rest neue routen hinzufügen
router.post("/", async (request, response) => {
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
router.get("/:id", async (request, response) => {
    const routeId = Number(request.params.id);
    if (!Number.isInteger(routeId)) return response.status(400).json({ error: "invalid id" });

    const foundRoute = await prismaClient.route.findUnique({ where: { id: routeId } });
    if (!foundRoute) return response.sendStatus(404);

    response.json(foundRoute);
});

//einzelne  route löschen
router.delete("/:id", async (request, response) => {
    const routeId = Number(request.params.id);
    if (!Number.isInteger(routeId)) return response.status(400).json({ error: "invalid id" });

    try {
        await prismaClient.route.delete({ where: { id: routeId } });
        response.sendStatus(204);
    } catch {
        response.sendStatus(404);
    }
});

export default router;