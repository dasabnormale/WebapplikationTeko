//imports
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

//erstellt express app instanz
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//pfad zu frontend
const PUBLIC_DIR = path.join(__dirname, "public");

//statische dateien
app.use(
    express.static(PUBLIC_DIR, {
        extensions: ["html"],
        setHeaders: (res, filePath) => {
            if (/\.(?:css|js|png|jpg|jpeg|gif|svg|woff2?)$/i.test(filePath)) {
                res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            } else {
                res.setHeader("Cache-Control", "no-cache");
            }
        }
    })
);

//serverstart
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Static server running at http://localhost:${PORT}`);
});