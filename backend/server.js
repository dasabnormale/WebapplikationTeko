//imports
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

import orsRouter from "./ors.js";
import routesRouter from "./routes.js";

//umgebungsvariablen laden
dotenv.config();

//erstellt express app mit Datenbank
const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

//swagger ui einbindung
const openapiPath = path.join(__dirname, "openapi.json");
const openapiJson = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiJson));

// API-Router mounten
app.use("/api/ors", orsRouter);
app.use("/api/routes", routesRouter);

//check ob online
app.get("/health", (_request, response) => response.json({ ok: true }));

//serverstart
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API ready on http://localhost:${PORT}`);
    console.log(`Swagger UI on http://localhost:${PORT}/docs`);
});
