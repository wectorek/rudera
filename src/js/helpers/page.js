import { Reservation } from "../reservation.js";
import { initCopyButton } from "./copyButton.js";
import {
	initReservationCalendar,
	isDateRangeAvailable,
} from "./calendar.js";

function addDaysIso(dateStr, days) {
	const date = new Date(dateStr);
	date.setDate(date.getDate() + days);
	return date.toISOString().split("T")[0];
}
// Flaga do śledzenia czy formularz rezerwacji został zainicjalizowany
let bookingFormInitialized = false;
let bookingContentLoaded = false;
let heroBookingInitialized = false;

// Cache dla załadowanych podstron
const subpageCache = {};

// Funkcja do ładowania zawartości podstrony z pliku HTML
async function loadSubpageContent(subpageId) {
	// Jeśli już jest w cache, zwróć z cache
	if (subpageCache[subpageId]) {
		return subpageCache[subpageId];
	}

	// Załaduj z pliku w folderze pages
	const response = await fetch(`/pages/${subpageId}.html`);
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
	if (currentButton) currentButton.classList.remove("current-button");
	const newButton = subpage;
	newButton.classList.add("current-button");

	// Przesuń linię
	updateUnderline(newButton);

	const subpageId = newButton.id;
	const heroContentElement = document.getElementById("hero-content");

	// Ukryj hero-booking przy nawigacji do innej podstrony
	const heroBookingElement = document.getElementById("hero-booking");
	if (heroBookingElement) {
		heroBookingElement.classList.remove("visible");
		heroBookingElement.innerHTML = "";
		heroBookingInitialized = false;
	}

	// Aktualizuj URL
	if (updateURL) {
		const newURL = `${window.location.pathname}?page=${subpageId}`;
		window.history.pushState({ page: subpageId }, "", newURL);
	}

	if (subpageId === "booking") {
		// Załaduj formularz rezerwacji do hero-content
		if (!heroContentElement.querySelector("#bookingForm")) {
			const html = await loadSubpageContent("booking");
			heroContentElement.innerHTML = html;
			bookingFormInitialized = false;
		}
		if (!bookingFormInitialized) {
			Reservation.initBookingForm();
			bookingFormInitialized = true;
		}
		await initReservationCalendar();
		heroContentElement.classList.add("visible");
	} else if (subpageId === "myReservation") {
		// Świeża kopia — reset widoku
		const response = await fetch("/pages/myReservation.html");
		heroContentElement.innerHTML = await response.text();
		initCopyButton();
		heroContentElement.classList.add("visible");

		// Reset flag — booking musi załadować się od nowa po powrocie
		bookingContentLoaded = false;
		bookingFormInitialized = false;

		const { auth } = await import("../apis/firebase/firebase.js");
		const { isAdmin } = await import("../apis/firebase/firebase.js");
		const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js");
		const reservationId = new URLSearchParams(window.location.search).get("reservationId");
		if (reservationId) {
			Reservation.loadReservation(reservationId);
		} else {
			await new Promise((resolve) => {
				const unsubscribe = onAuthStateChanged(auth, (user) => {
					unsubscribe();
					if (user) {
						if (isAdmin(user)) {
							Reservation.loadAllReservations();
						} else {
							Reservation.loadMyReservations(user.uid);
						}
					}
					resolve();
				});
			});
		}
		initReservationCalendar();
	} else {
		// Zwykłe podstrony
		const content = await loadSubpageContent(subpageId);
		heroContentElement.innerHTML = content;
		heroContentElement.classList.add("visible");
	}

	return newButton;
}

export function initAvailabilityBar() {
	const btn = document.getElementById("checkAvailability");
	if (!btn) return;

	const quickCheckIn = document.getElementById("quickCheckIn");
	const quickCheckOut = document.getElementById("quickCheckOut");

	quickCheckIn?.addEventListener("change", () => {
		if (!quickCheckIn.value || !quickCheckOut) return;
		const minCheckout = addDaysIso(quickCheckIn.value, 1);
		quickCheckOut.min = minCheckout;
		if (quickCheckOut.value && quickCheckOut.value <= quickCheckIn.value) {
			quickCheckOut.value = minCheckout;
		}
	});

	btn.addEventListener("click", async () => {
		console.log("Sprawdzanie dostępności...");
		const checkIn = document.getElementById("quickCheckIn").value;
		const checkOut = document.getElementById("quickCheckOut").value;
		const adults = document.getElementById("quickAdults").value;
		const children = document.getElementById("quickChildren").value;

		if (!checkIn || !checkOut || adults === "" || children === "") {
			alert("Wypełnij wszystkie pola.");
			return;
		}

		if (!Reservation.isValidDateRange(checkIn, checkOut)) {
			alert("Data wyjazdu musi być późniejsza niż data przyjazdu.");
			return;
		}

		const heroBookingElement = document.getElementById("hero-booking");

		if (!heroBookingElement.innerHTML.trim()) {
			const html = await loadSubpageContent("booking");
			heroBookingElement.innerHTML = html;
			heroBookingInitialized = false;
		}

		if (!heroBookingInitialized) {
			Reservation.initBookingForm();
			heroBookingInitialized = true;
		}

		await initReservationCalendar();

		document.getElementById("checkIn").value = checkIn;
		document.getElementById("checkOut").value = checkOut;
		document.getElementById("adults").value = adults;
		document.getElementById("children").value = children;
		Reservation.syncCheckoutMinDate();

		const available = await isDateRangeAvailable(checkIn, checkOut);
		Reservation.updateBookingPricePreview();

		const heroContentEl = document.getElementById("hero-content");
		if (heroContentEl) {
			heroContentEl.classList.remove("visible");
		}

		heroBookingElement.classList.add("visible");
		heroBookingElement.scrollIntoView({ behavior: "smooth", block: "nearest" });

		if (!available) {
			Reservation.showOccupiedPopup(
				"Wybrany termin jest już zarezerwowany. Wybierz inne daty.",
			);
		}
	});
}
