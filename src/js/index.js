import { initApp } from "./initApp.js";
let map
initApp();
async function initMap() {
	const { Map } = await google.maps.importLibrary("maps");
	map = new Map(document.getElementById("map"), {
		center: { lat: 53.973313, lng: 22.920539 },
		zoom: 18,
	});
}
//initMap();



// //onAuthStateChanged(auth, async (user) => {
// 	//if (user) {
// 		console.log("Logged in:", user.uid);

// 		const snap = await getDoc(doc(db, "users", user.uid));
// 		console.log(snap.data());
// 	}
// });
