import {
	getDoc,
	doc,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { db } from "./firebase.js";
import { Reservation } from "./reservation.js";

// Flaga do śledzenia czy formularz rezerwacji został zainicjalizowany
let bookingFormInitialized = false;

// Funkcja do pobierania parametru z URL
export function getPageFromURL(subpages) {
	const urlParams = new URLSearchParams(window.location.search);
	const page = urlParams.get("page");
	// Sprawdź czy parametr page jest poprawny
	if (page && Object.values(subpages).includes(page)) {
		return page;
	}
	return subpages.foresterDescription; // Domyślna strona
}

// Funkcja do pobierania reservationId z URL
export function getReservationIdFromURL() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get("reservationId");
}

export function showSubpage(
	subpage,
	subpageContent,
	currentButton,
	updateURL = true,
) {
	currentButton.classList.remove("current-button");
	const newButton = subpage;
	newButton.classList.add("current-button");

	// Przesuń linię
	const underline = document.getElementById("underline");
	const rect = newButton.getBoundingClientRect();
	const navRect = document
		.getElementById("navigation")
		.getBoundingClientRect();

	underline.style.left = rect.left - navRect.left + "px";
	underline.style.width = rect.width + "px";

	const subpageElement = document.getElementById("subpage");
	const supbageBookingElement = document.getElementById("supbageBooking");
	const subpageId = newButton.id;

	// Aktualizuj URL
	if (updateURL) {
		const newURL = `${window.location.pathname}?page=${subpageId}`;
		window.history.pushState({ page: subpageId }, "", newURL);
	}

	// Jeśli kliknięto booking, pokaż div supbageBooking i ukryj subpage
	if (subpageId === "booking") {
		subpageElement.style.display = "none";
		supbageBookingElement.style.display = "block";

		// Inicjalizuj formularz rezerwacji przy pierwszym wejściu
		if (!bookingFormInitialized) {
			Reservation.initBookingForm();
			bookingFormInitialized = true;
		}

		// Sprawdź czy jest reservationId w URL
		const reservationId = getReservationIdFromURL();
		if (reservationId) {
			loadReservation(reservationId);
		}
	} else {
		// Dla innych przycisków pokaż subpage i ukryj supbageBooking
		subpageElement.style.display = "block";
		supbageBookingElement.style.display = "none";
		subpageElement.innerHTML = subpageContent[subpageId];
	}

	return newButton;
}

// Funkcja do ładowania rezerwacji z bazy danych
export async function loadReservation(reservationId) {
	try {
		const reservationRef = doc(db, "reservations", reservationId);
		const reservationSnap = await getDoc(reservationRef);

		if (reservationSnap.exists()) {
			const data = reservationSnap.data();
			console.log("Dane rezerwacji:", data);

			// Utwórz obiekt rezerwacji z pobranych danych
			const reservationData = {
				arrivalDate: data.arrivalDate,
				departureDate: data.departureDate,
				numberOfGuests: data.numberOfGuests,
				bikeRental: data.attractions.bikeRental,
				kayakRental: data.attractions.kayakRental,
				campfire: data.attractions.campfire,
				pets: data.attractions.pets,
				firstName: data.contact.firstName,
				lastName: data.contact.lastName,
				phone: data.contact.phone,
				email: data.contact.email,
			};

			const reservation = new Reservation(reservationData);
			reservation.showSummary();

			// Wypełnij link do rezerwacji
			const reservationLinkInput =
				document.getElementById("reservationLink");
			if (reservationLinkInput) {
				const reservationUrl = `${window.location.origin}${window.location.pathname}?page=booking&reservationId=${reservationId}`;
				reservationLinkInput.value = reservationUrl;
			}
		} else {
			console.error("Rezerwacja nie istnieje");
			alert("Nie znaleziono rezerwacji o podanym ID");
		}
	} catch (error) {
		console.error("Błąd podczas pobierania rezerwacji:", error);
		alert("Wystąpił błąd podczas pobierania danych rezerwacji");
	}
}
