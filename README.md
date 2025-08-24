# WebapplikationTeko
Als Benotete Modularbeit erstellt

Testing mit Playwright

#Vorbereitung Playwright
https://playwright.dev/docs/intro
npm init playwright@latest  

Initializing project in '.'
√ Do you want to use TypeScript or JavaScript? · JavaScript
√ Where to put your end-to-end tests? · tests
√ Add a GitHub Actions workflow? (y/N) · true
√ Install Playwright browsers (can be done manually via 'npx playwright install')? (Y/n) · true
Initializing NPM project (npm init -y)…

- [api.openrouteservice.org/geocode/search](https://api.openrouteservice.org/geocode/search)
- [api.openrouteservice.org/v2/directions/](https://api.openrouteservice.org/v2/directions/)
- [api.openrouteservice.org/geocode/autocomplete](https://api.openrouteservice.org/geocode/autocomplete)



datenbank
npm init -y
npm i express prisma @prisma/client
npx prisma init --datasource-provider sqlite

datasource db {
provider = "sqlite"
url      = "file:./dev.db"
}

npx prisma migrate dev --name init

npx prisma generate

npx prisma studio

//backend starten

node server.js

npm install express cors swagger-ui-express @prisma/client
npm install -D prisma

npm i @prisma/client
npx prisma generate

API ready on http://localhost:3000
Swagger UI on http://localhost:3000/docs
