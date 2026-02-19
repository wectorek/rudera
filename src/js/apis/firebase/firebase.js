import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
	getFirestore,
	collection,
	addDoc,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { APIKey } from "../../../secrets/firebaseAPIKey.js";

const firebaseConfig = {
	apiKey: APIKey,
	authDomain: "rudera-587be.firebaseapp.com",
	projectId: "rudera-587be",
	storageBucket: "rudera-587be.firebasestorage.app",
	messagingSenderId: "249832808990",
	appId: "1:249832808990:web:c1771f51a09521e5f6840f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function addDocument(data) {
	const docRef = await addDoc(collection(db, "reservations"), data);
	console.log("Dokument dodany z ID:", docRef.id);
	return docRef;
}

export { db, app, auth };
//import { app } from "./apis/firebase/firebase.js";
import {
	getAuth,
	GoogleAuthProvider,
	signInWithPopup,
	signOut,
	onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
	//getFirestore,
	//doc,
	//getDoc,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const auth = getAuth(app);
//const db = getFirestore(app);

const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");

loginBtn.onclick = async () => {
	await signInWithPopup(auth, provider);
};

logoutBtn.onclick = async () => {
	await signOut(auth);
};

onAuthStateChanged(auth, (user) => {
	const authStatus = document.getElementById("auth-status");
	if (user) {
		console.log("Zalogowano:", user.displayName);
		console.log("Email:", user.email);
		console.log("UID:", user.uid);
		console.log("Zdjęcie:", user.photoURL);
		authStatus.textContent = `Zalogowano jako: ${user.email}`;
		loginBtn.style.display = "none";
		logoutBtn.style.display = "";
		document.getElementById("myReservation").style.display = "";
	} else {
		console.log("Użytkownik wylogowany");
		authStatus.textContent = "";
		loginBtn.style.display = "";
		logoutBtn.style.display = "none";
		document.getElementById("myReservation").style.display = "none";
	}
});
