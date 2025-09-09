#Installation
cd backend
npm install
npm run generate
npm run migrate

#Umgebungsvariablen

Erstelle im Ordner backend/ eine Datei .env:

ORS_API_KEY=DEIN_OPENROUTESERVICE_KEY
DATABASE_URL="file:./prisma/dev.db"

#Start
cd backend
npm run start


Web-App: http://localhost:3000/

Health: http://localhost:3000/health

Swagger UI: http://localhost:3000/docs

#Tests
https://www.reddit.com/r/nextjs/comments/1hvf227/new_to_testing_what_would_you_recommend_in_2025/
Unit-Tests
cd backend
npm run test:unit


Läuft mit Vitest in JSDOM.

Getestet werden die selbst geschriebenen Frontend-Helfer (Formatierung, Debounce, Rendering, LocalStorage, Netzwerk-Helper) sowie optional die Backend-Validierung.

End-to-End-Tests (Akzeptanztests)
cd backend
npx playwright test
# Report öffnen:
npx playwright show-report


Läuft mit Playwright.

Die OpenRouteService-Requests werden im Test gemockt, daher ist kein echter API-Key nötig.

Projektstruktur (Auszug)
backend/
public/
index.html
StyleSheet.css
app.js
openapi.json
server.js
routes.js
ors.js
index.js
prisma/
schema.prisma
dev.db
tests/
assignment.test.js        # Playwright (E2E)
unit/                     # Vitest (Unit)

#Funktionen der Anwendung

Eingabe von Start und Ziel, Routenberechnung und Anzeige von Distanz und Dauer.

Adressvorschläge per Autocomplete.

Speichern persönlicher Routen in der Datenbank über eine REST-Schnittstelle.

Zählen der meistgesuchten Routen im Browser-Speicher und Anzeige der Top-10.

Verwendete Technologien und Einbindung
Server und API

#Express

import express from "express";
const app = express();
app.use(express.json());
app.use(express.static("public"));


CORS

import cors from "cors";
app.use(cors());


dotenv

import dotenv from "dotenv";
dotenv.config();


swagger-ui-express

import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

const openapiJson = JSON.parse(fs.readFileSync(path.join(__dirname, "openapi.json"), "utf-8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiJson));


node-fetch (Proxy zu OpenRouteService)

import fetch from "node-fetch";
// /api/ors/autocomplete  -> https://api.openrouteservice.org/geocode/autocomplete
// /api/ors/search        -> https://api.openrouteservice.org/geocode/search
// /api/ors/directions    -> https://api.openrouteservice.org/v2/directions/driving-car


#Prisma Client

import { PrismaClient } from "@prisma/client";
const prismaClient = new PrismaClient();


Datenbankzugriff über ORM-Methoden (findMany, create, delete), keine Raw-SQL-Strings.

#Frontend

Vanilla JavaScript (public/app.js)

Autocomplete und Suche (per fetch an die eigenen Proxy-Endpunkte).

Routenberechnung, Anzeige von Distanz und Dauer.

Rendering der Schritt-Anweisungen.

Top-10 Routen im localStorage zählen und anzeigen.

Tests

Playwright (E2E)

Konfiguration: backend/playwright.config.js

Startet die App, füllt Formulare, prüft Ergebnis und Schritte.

ORS-Calls werden im Test gemockt.

#Vitest (Unit)

Konfiguration über backend/package.json (vitest.test.environment = jsdom).

Testverzeichnis: backend/tests/unit/.

API-Dokumentation

Datei: backend/openapi.json

UI: GET /docs

Endpunkte:

GET /api/routes

POST /api/routes

GET /api/routes/{id}

DELETE /api/routes/{id}

Schutz vor SQL-Injection

Kein Raw-SQL.

Ausschließlich parametrisierte Prisma-Methoden.

Optional: serverseitige Validierung vor dem DB-Schreiben.

Nützliche Skripte
# Entwicklung
npm run dev
npm run start

# Prisma
npm run generate
npm run migrate
npm run studio

# Tests
npm run test:unit
npm run test:e2e
npm run test:e2e:ui