const startFeld = document.getElementById("Start");
const endFeld = document.getElementById("End");
const button = document.getElementById("submit");
const ergebnis = document.getElementById("ergebnis");

startFeld.addEventListener("input", writesopenRouteServiceToConsole);

const apikey = "5b3ce3597851110001cf6248fc8c8feb395847c7a020e880211e1d68"; // move to server in production

async function writesopenRouteServiceToConsole() {
    const query = (startFeld.value || "").trim();
    if (!query) return; // ab dem ersten Buchstaben

    const res = await fetch(
        `https://api.openrouteservice.org/geocode/autocomplete?api_key=${apikey}&text=${encodeURIComponent(query)}&size=10&lang=de`,
        { headers: { Accept: "application/json" } }
    );

    const { features = [] } = await res.json();

    console.table(
        features.map((f) => ({
            label: f?.properties?.label ?? "",
            layer: f?.properties?.layer ?? "",
            country: f?.properties?.country ?? "",
            lon: f?.geometry?.coordinates?.[0],
            lat: f?.geometry?.coordinates?.[1],
        }))
    );
}


