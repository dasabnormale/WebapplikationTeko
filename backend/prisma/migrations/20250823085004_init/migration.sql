-- CreateTable
CREATE TABLE "Route" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startLabel" TEXT NOT NULL,
    "startLon" REAL NOT NULL,
    "startLat" REAL NOT NULL,
    "endLabel" TEXT NOT NULL,
    "endLon" REAL NOT NULL,
    "endLat" REAL NOT NULL,
    "distanceMeters" INTEGER,
    "durationSeconds" INTEGER,
    "stepsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
