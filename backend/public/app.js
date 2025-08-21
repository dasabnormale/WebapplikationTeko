//todos:
//backend
//tests
//rest api
//db
//swagger
//api key als env variable im backend
//await muss noch ersetzt werden
//css mit variablen arbeiten (bsp. Farbe blau)

//funktionen sollen immer ein Verb beeinhalten


const apikey = "5b3ce3597851110001cf6248fc8c8feb395847c7a020e880211e1d68";

let startFeld, endFeld, button, ergebnis, startList, endList;

const cacheStart = new Map();
const cacheEnd = new Map();

function debounce(fn, miliSeconds = 300) {
    let time;
    return (...args) => {
        clearTimeout(time);
        //https://developer.mozilla.org/de/docs/Web/API/Window/setTimeout
        time = setTimeout(() => fn(...args), miliSeconds);
    };
}

async function fetchAutocomplete(text) {
    const url = new URL("https://api.openrouteservice.org/geocode/autocomplete");
    url.searchParams.set("text", text);
    url.searchParams.set("size", "5");
    url.searchParams.set("api_key", apikey);
    const response = await fetch(url.toString());
    return response.json();
}

function fillDatalist(listElement, features, cache) {
    listElement.innerHTML = "";
    features.forEach(f => {
        const label = f?.properties?.label ?? "";
        const [longitude, latitude] = f?.geometry?.coordinates ?? [];
        if (!label || longitude == null || latitude == null)
            return;
        const option = document.createElement("option");
        option.value = label;
        listElement.appendChild(option);
        cache.set(label, { lon: longitude, lat: latitude });
    });
}

const onStartInput = debounce(async () => {
    const trimmedStartField = startFeld.value.trim();
    if (trimmedStartField.length < 2)
        return;
    const data = await fetchAutocomplete(trimmedStartField);
    fillDatalist(startList, data.features ?? [], cacheStart);
}, 300);

const onEndInput = debounce(async () => {
    const trimmedEndField = endFeld.value.trim();
    if (trimmedEndField.length < 2) return;
    const data = await fetchAutocomplete(trimmedEndField);
    fillDatalist(endList, data.features ?? [], cacheEnd);
}, 300);

async function fetchDirections(start, end) {
    const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": apikey
        },
        body: JSON.stringify({
            coordinates: [
                [start.lon, start.lat],
                [end.lon, end.lat]
            ],
            instructions: true
        })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

function formatSeconds(seconds) {
    const hour = Math.floor(seconds / 3600);
    const minute = Math.round((seconds % 3600) / 60);
    return hour ? `${hour}h ${minute}m` : `${minute}m`;
}

async function onSubmit() {
    const startLabel = startFeld.value.trim();
    const endLabel = endFeld.value.trim();
    const startCache = cacheStart.get(startLabel);
    const endCache = cacheEnd.get(endLabel);
    if (!startCache || !endCache) {
        ergebnis.textContent = "Bitte gültige Start- und Zieladresse aus den Vorschlägen wählen.";
        return;
    }
    const data = await fetchDirections(startCache, endCache);
    const summary = data?.routes?.[0]?.summary;
    const distanceKm = summary ? (summary.distance / 1000).toFixed(1) : "–";
    const duration = summary ? formatSeconds(summary.duration) : "–";
    ergebnis.textContent = `Route: ${startLabel} → ${endLabel}\nDistanz: ${distanceKm} km\nDauer: ${duration}`;
    const steps = data?.routes?.[0]?.segments?.[0]?.steps ?? [];
    renderSteps(steps);
    incrementTopSearch(`${startLabel} → ${endLabel}`);
    renderTopSearches();
}

function renderSteps(steps) {
    let listOfSteps = document.getElementById("steps");
    if (!listOfSteps) {
        listOfSteps = document.createElement("ol");
        listOfSteps.id = "steps";
        listOfSteps.style.marginTop = "1rem";
        document.querySelector("main.container").appendChild(listOfSteps);
    }
    listOfSteps.innerHTML = steps.map(s => `<li>${s.instruction}</li>`).join("");
}

function incrementTopSearch(key) {
    const raw = localStorage.getItem("topRoutes") || "{}";
    const jsonObject = JSON.parse(raw);
    jsonObject[key] = (jsonObject[key] || 0) + 1;
    localStorage.setItem("topRoutes", JSON.stringify(jsonObject));
}

function renderTopSearches() {
    let list = document.getElementById("topRoutes");
    if (!list) {
        list = document.createElement("ul");
        list.id = "topRoutes";
        list.style.marginTop = "1rem";
        document.querySelector("main.container").appendChild(list);
    }
    const raw = localStorage.getItem("topRoutes") || "{}";

    //https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
    //https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
    const entries = Object.entries(JSON.parse(raw))
        .sort((a,b) => b[1] - a[1])
        .slice(0, 10);
    list.innerHTML = entries.map(([k,v]) => `<li>${k} (${v})</li>`).join("");
}

function init() {
    startFeld = document.getElementById("Start");
    endFeld   = document.getElementById("End");
    button    = document.getElementById("submit");
    ergebnis  = document.getElementById("ergebnis");
    startList = document.getElementById("StartList");
    endList   = document.getElementById("EndList");
    startFeld.addEventListener("input", onStartInput);
    endFeld.addEventListener("input", onEndInput);
    button.addEventListener("click", onSubmit);
    renderTopSearches();
}

document.addEventListener("DOMContentLoaded", init);
