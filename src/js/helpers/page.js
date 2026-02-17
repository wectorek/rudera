import { Reservation } from "../reservation.js";
import { initCopyButton } from "./copyButton.js";

// Flaga do śledzenia czy formularz rezerwacji został zainicjalizowany
let bookingFormInitialized = false;
let bookingContentLoaded = false;

// Cache dla załadowanych podstron
const subpageCache = {};

// Funkcja do ładowania zawartości podstrony z pliku HTML
async function loadSubpageContent(subpageId) {
	// Jeśli już jest w cache, zwróć z cache
	if (subpageCache[subpageId]) {
		return subpageCache[subpageId];
	}

	// Załaduj z pliku w folderze pages
	const response = await fetch(`pages/${subpageId}.html`);
	const html = await response.text();
	
	// Zapisz w cache
	subpageCache[subpageId] = html;
	
	return html;
}

// Funkcja do ładowania zawartości formularza rezerwacji z booking.html
async function loadBookingContent() {
	if (bookingContentLoaded) return;

	const html = await loadSubpageContent("booking");
	document.getElementById("supbageBooking").innerHTML = html;
	bookingContentLoaded = true;
}

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

// Funkcja do przesuwania podkreślenia pod aktywny przycisk
export function updateUnderline(button) {
	const underline = document.getElementById("underline");
	const rect = button.getBoundingClientRect();
	const navRect = document
		.getElementById("navigation")
		.getBoundingClientRect();

	underline.style.left = rect.left - navRect.left + "px";
	underline.style.width = rect.width + "px";
}

export async function showSubpage(
	subpage,
	currentButton,
	updateURL = true,
) {
	currentButton.classList.remove("current-button");
	const newButton = subpage;
	newButton.classList.add("current-button");

	// Przesuń linię
	updateUnderline(newButton);

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

		// Załaduj zawartość formularza
		await loadBookingContent();

		// Inicjalizuj formularz rezerwacji przy pierwszym wejściu
		if (!bookingFormInitialized) {
			Reservation.initBookingForm();
			initCopyButton();
			bookingFormInitialized = true;
		}

		// Sprawdź czy jest reservationId w URL
		const reservationId = Reservation.getReservationIdFromURL();
		if (reservationId) {
			Reservation.loadReservation(reservationId);
		}
	} else {
		// Dla innych przycisków pokaż subpage i ukryj supbageBooking
		subpageElement.style.display = "block";
		supbageBookingElement.style.display = "none";
		
		// Załaduj zawartość podstrony z pliku HTML
		const content = await loadSubpageContent(subpageId);
		subpageElement.innerHTML = content;
	}

	return newButton;
}
