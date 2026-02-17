import { initApp } from "./initApp.js";

initApp();
let map;
async function initMap() {
    const { Map } = (await google.maps.importLibrary('maps'));
    map = new Map(document.getElementById('map'), {
        center: { lat: 53.973313, lng: 22.920539 },
        zoom: 18,
    });
}
initMap();