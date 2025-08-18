const feld1 = document.getElementById("Start");
const feld2 = document.getElementById("End");
const btn = document.getElementById("submit");
const ergebnis = document.getElementById("ergebnis");

const apikey = "5b3ce3597851110001cf6248fc8c8feb395847c7a020e880211e1d68"

async function openRouteService_StartToConsole() {
    const q = (feld1.value || "").trim();
    if (!q) return; // ab dem ersten Buchstaben

    const res = await fetch(
        `https://api.openrouteservice.org/geocode/autocomplete?api_key=${apikey}&text=${encodeURIComponent(q)}&size=10&lang=de`,
        { headers: { Accept: "application/json" } }
    );

    const { features = [] } = await res.json();

    console.table(features.map(f => ({
        label: f?.properties?.label ?? "",
        layer: f?.properties?.layer ?? "",
        country: f?.properties?.country ?? "",
        lon: f?.geometry?.coordinates?.[0],
        lat: f?.geometry?.coordinates?.[1],
    })));
}


feld1.addEventListener("input", openRouteService_StartToConsole);
