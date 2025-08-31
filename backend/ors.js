//imports
import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

//api autocomplete
router.get("/autocomplete", async (request, response) => {
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
router.get("/search", async (request, response) => {
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
router.post("/directions", async (request, response) => {
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

export default router;