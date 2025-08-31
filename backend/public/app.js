//todo tests
//todo no abbreviations
//todo unittests
//todo not too much details on playwrighttests
//todo atomic commit
//todo no innerhtml


//DOM elemente
let startInputElement, endInputElement, submitButtonElement, resultElement, startDatalistElement, endDatalistElement;

const startSuggestionCache = new Map();
const endSuggestionCache = new Map();

//entprellfunktion
function debounce(functionToDebounce, milliseconds = 300) {
    let timeoutIdentifier;
    return (...parameters) => {
        clearTimeout(timeoutIdentifier);
        timeoutIdentifier = setTimeout(() => functionToDebounce(...parameters), milliseconds);
    };
}

//funktion zu autocomplete backend und holt json
function fetchAutocompleteResults(searchText) {
    const absoluteUrl = new URL("/api/ors/autocomplete", window.location.origin);
    absoluteUrl.searchParams.set("text", searchText);
    absoluteUrl.searchParams.set("size", "5");
    return fetch(absoluteUrl.toString()).then(httpResponse => httpResponse.json());
}

//daten füllen und cache pflegen
function fillDatalistWithSuggestions(datalistElement, featureList, cacheMap) {
    datalistElement.innerHTML = "";
    featureList.forEach(feature => {
        const suggestionLabel = feature?.properties?.label ?? "";
        const [longitude, latitude] = feature?.geometry?.coordinates ?? [];
        if (!suggestionLabel || longitude == null || latitude == null) return;

        const optionElement = document.createElement("option");
        optionElement.value = suggestionLabel;
        datalistElement.appendChild(optionElement);

        cacheMap.set(suggestionLabel, { longitude: longitude, latitude: latitude });
    });
}

//start input mit entprellfunktion
const handleStartInput = debounce(() => {
    const trimmedStartInputText = startInputElement.value.trim();
    if (trimmedStartInputText.length < 2) return;
    fetchAutocompleteResults(trimmedStartInputText)
        .then(jsonData => fillDatalistWithSuggestions(startDatalistElement, jsonData.features ?? [], startSuggestionCache));
}, 300);

//end input mit entpresllfunktion
const handleEndInput = debounce(() => {
    const trimmedEndInputText = endInputElement.value.trim();
    if (trimmedEndInputText.length < 2) return;
    fetchAutocompleteResults(trimmedEndInputText)
        .then(jsonData => fillDatalistWithSuggestions(endDatalistElement, jsonData.features ?? [], endSuggestionCache));
}, 300);

//routenabruf in deutsch
function fetchRouteDirections(startCoordinate, endCoordinate) {
    return fetch("/api/ors/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            coordinates: [
                [startCoordinate.longitude, startCoordinate.latitude],
                [endCoordinate.longitude, endCoordinate.latitude]
            ],
            instructions: true,
            language: "de" // wichtig: deutsche Straßennamen/Anweisungen
        })
    }).then(httpResponse => httpResponse.json());
}

//zeit formatieren
function formatSecondsToReadableTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.round((totalSeconds % 3600) / 60);
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

//nichtangeklicktes auch suchen
function fetchGeocodeSearch(queryText) {
    const url = new URL("/api/ors/search", window.location.origin);
    url.searchParams.set("text", queryText);
    url.searchParams.set("size", "1");
    return fetch(url.toString()).then(httpResponse => httpResponse.json());
}

//koordination
function resolveCoordinates(labelFromInput, cacheMap) {
    const cached = cacheMap.get(labelFromInput);
    if (cached) return Promise.resolve({ label: labelFromInput, coord: cached });

    return fetchGeocodeSearch(labelFromInput).then(jsonData => {
        const firstFeature = (jsonData.features || [])[0];
        if (!firstFeature) return null;
        const [longitude, latitude] = firstFeature.geometry?.coordinates || [];
        const resolvedLabel = firstFeature.properties?.label || labelFromInput;
        return { label: resolvedLabel, coord: { longitude, latitude } };
    });
}

//validiert eingabe, holt weg, zähler und routenspeichern
function handleSubmit() {
    const startLabelInput = startInputElement.value.trim();
    const endLabelInput = endInputElement.value.trim();

    if (!startLabelInput || !endLabelInput) {
        resultElement.textContent = "Please enter both start and end.";
        return;
    }

    Promise.all([
        resolveCoordinates(startLabelInput, startSuggestionCache),
        resolveCoordinates(endLabelInput, endSuggestionCache)
    ]).then(results => {
        const startResolved = results[0];
        const endResolved = results[1];

        if (!startResolved || !endResolved) {
            resultElement.textContent =
                "Please choose valid start and end addresses from the suggestions or enter a resolvable address.";
            return;
        }

        const startCoordinate = startResolved.coord;
        const endCoordinate = endResolved.coord;
        const startLabel = startResolved.label;
        const endLabel = endResolved.label;

        fetchRouteDirections(startCoordinate, endCoordinate)
            .then(jsonData => {
                const routeSummary = jsonData?.routes?.[0]?.summary;
                const distanceInKilometers = routeSummary ? (routeSummary.distance / 1000).toFixed(1) : "–";
                const durationFormatted = routeSummary ? formatSecondsToReadableTime(routeSummary.duration) : "–";

                resultElement.textContent =
                    `Route: ${startLabel} → ${endLabel}\nDistance: ${distanceInKilometers} km\nDuration: ${durationFormatted}`;

                const stepList = jsonData?.routes?.[0]?.segments?.[0]?.steps ?? [];
                renderStepInstructions(stepList);

                increaseTopRouteSearchCount(`${startLabel} → ${endLabel}`);
                renderTopRouteSearches();

                const payload = {
                    startLabel,
                    startLon: startCoordinate.longitude,
                    startLat: startCoordinate.latitude,
                    endLabel,
                    endLon: endCoordinate.longitude,
                    endLat: endCoordinate.latitude,
                    distanceMeters: routeSummary ? Math.round(routeSummary.distance) : null,
                    durationSeconds: routeSummary ? Math.round(routeSummary.duration) : null,
                    stepsJson: JSON.stringify(stepList)
                };
                saveRouteToBackend(payload).then(() => fetchSavedRoutes().then(renderSavedRoutes));
            });
    });
}

//persistenz hilfen
function saveRouteToBackend(payload) {
    return fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).then(httpResponse => httpResponse.json());
}

function fetchSavedRoutes() {
    return fetch("/api/routes").then(httpResponse => httpResponse.json());
}

function deleteSavedRouteById(id) {
    return fetch(`/api/routes/${id}`, { method: "DELETE" });
}

//gespeicherte routen rendern und falls nötig listen element erstellen
function renderSavedRoutes(routeArray) {
    let listElement = document.getElementById("savedRoutes");
    if (!listElement) {
        listElement = document.createElement("ul");
        listElement.id = "savedRoutes";
        listElement.style.marginTop = "1rem";
        document.querySelector("main.container").appendChild(listElement);
    }

    listElement.innerHTML = routeArray.map(route => {
        const distanceText = route.distanceMeters != null ? `${(route.distanceMeters / 1000).toFixed(1)} km` : "– km";
        const durationText = route.durationSeconds != null ? formatSecondsToReadableTime(route.durationSeconds) : "–";
        return `<li data-id="${route.id}">
            ${route.startLabel} → ${route.endLabel}
            — ${distanceText}, ${durationText}
            <button class="deleteSavedRouteButton" data-id="${route.id}">Delete</button>
        </li>`;
    }).join("");

    listElement.querySelectorAll(".deleteSavedRouteButton").forEach(buttonElement => {
        buttonElement.addEventListener("click", () => {
            const identifier = Number(buttonElement.getAttribute("data-id"));
            deleteSavedRouteById(identifier)
                .then(() => fetchSavedRoutes().then(renderSavedRoutes));
        });
    });
}

//schritte rendern und
function renderStepInstructions(stepList) {
    let stepListElement = document.getElementById("steps");
    if (!stepListElement) {
        stepListElement = document.createElement("ol");
        stepListElement.id = "steps";
        stepListElement.style.marginTop = "1rem";
        document.querySelector("main.container").appendChild(stepListElement);
    }
    stepListElement.innerHTML = stepList.map(step => `<li>${step.instruction}</li>`).join("");
}

//in localstorage gespeicherte start-ziel hochzählen
function increaseTopRouteSearchCount(routeKey) {
    const rawJsonString = localStorage.getItem("topRoutes") || "{}";
    const topRoutesObject = JSON.parse(rawJsonString);
    topRoutesObject[routeKey] = (topRoutesObject[routeKey] || 0) + 1;
    localStorage.setItem("topRoutes", JSON.stringify(topRoutesObject));
}

//rendern der localstorage
function renderTopRouteSearches() {
    let topRoutesListElement = document.getElementById("topRoutes");
    if (!topRoutesListElement) {
        topRoutesListElement = document.createElement("ul");
        topRoutesListElement.id = "topRoutes";
        topRoutesListElement.style.marginTop = "1rem";
        document.querySelector("main.container").appendChild(topRoutesListElement);
    }

    const rawJsonString = localStorage.getItem("topRoutes") || "{}";
    const sortedTopRoutes = Object.entries(JSON.parse(rawJsonString))
        .sort((leftEntry, rightEntry) => rightEntry[1] - leftEntry[1])
        .slice(0, 10);

    topRoutesListElement.innerHTML = sortedTopRoutes
        .map(([routeText, searchCount]) => `<li>${routeText} (${searchCount})</li>`)
        .join("");
}

//initialisierung
function initializeApplication() {
    startInputElement = document.getElementById("Start");
    endInputElement = document.getElementById("End");
    submitButtonElement = document.getElementById("submit");
    resultElement = document.getElementById("ergebnis");
    startDatalistElement = document.getElementById("StartList");
    endDatalistElement = document.getElementById("EndList");

    startInputElement.addEventListener("input", handleStartInput);
    endInputElement.addEventListener("input", handleEndInput);
    submitButtonElement.addEventListener("click", handleSubmit);

    renderTopRouteSearches();
    fetchSavedRoutes().then(renderSavedRoutes);

    [startInputElement, endInputElement].forEach(inputElement => {
        inputElement.addEventListener("keydown", event => {
            if (event.key === "Enter") handleSubmit();
        });
    });
}

document.addEventListener("DOMContentLoaded", initializeApplication);