import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
	getFirestore,
	collection,
	addDoc,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";


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

export { db };
