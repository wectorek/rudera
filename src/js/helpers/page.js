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
		console.log("[page] loadSubpageContent cache hit:", subpageId);
		return subpageCache[subpageId];
	}

	const url = `/pages/${subpageId}.html`;
	console.log("[page] loadSubpageContent fetch:", url);
	const response = await fetch(url);
	console.log("[page] loadSubpageContent status:", response.status, subpageId);
	if (!response.ok) {
		throw new Error(`Nie udało się załadować podstrony ${subpageId} (${response.status})`);
	}
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

function waitMs(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextFrame() {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function fadeOutHeroPanels() {
	const heroContentElement = document.getElementById("hero-content");
	const heroBookingElement = document.getElementById("hero-booking");
	const wasVisible =
		heroContentElement?.classList.contains("visible") ||
		heroBookingElement?.classList.contains("visible");

	heroContentElement?.classList.remove("visible");
	heroBookingElement?.classList.remove("visible");

	if (wasVisible) {
		await waitMs(280);
	}

	if (heroBookingElement) {
		heroBookingElement.innerHTML = "";
		heroBookingInitialized = false;
	}
}

async function fadeInHeroContent() {
	const heroContentElement = document.getElementById("hero-content");
	if (!heroContentElement) return;
	heroContentElement.classList.remove("visible");
	await nextFrame();
	await nextFrame();
	heroContentElement.classList.add("visible");
}

export async function showSubpage(
	subpage,
	currentButton,
	updateURL = true,
) {
	const newButton = subpage;
	const subpageId = newButton.id;
	const heroContentElement = document.getElementById("hero-content");
	const switchingTabs = currentButton && currentButton !== newButton;

	document.querySelectorAll("#navigation .navigation-button").forEach((btn) => {
		btn.classList.remove("current-button");
	});
	newButton.classList.add("current-button");
	updateUnderline(newButton);

	if (!switchingTabs && heroContentElement?.classList.contains("visible") && updateURL) {
		return newButton;
	}

	if (updateURL) {
		const newURL = `${window.location.pathname}?page=${subpageId}`;
		window.history.pushState({ page: subpageId }, "", newURL);
	}

	await fadeOutHeroPanels();

	if (subpageId === "booking") {
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
		await fadeInHeroContent();
	} else if (subpageId === "myReservation") {
		const response = await fetch("/pages/myReservation.html");
		heroContentElement.innerHTML = await response.text();
		initCopyButton();

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
		await fadeInHeroContent();
	} else {
		const content = await loadSubpageContent(subpageId);
		heroContentElement.innerHTML = content;
		await fadeInHeroContent();
	}

	return newButton;
}

export function initAvailabilityBar() {
	const btn = document.getElementById("checkAvailability");
	if (!btn) {
		console.warn("[availability] brak przycisku #checkAvailability — init pominięty");
		return;
	}
	console.log("[availability] initAvailabilityBar — listener podpięty");

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
		console.log("[availability] klik: Sprawdź dostępność");
		try {
			const checkIn = document.getElementById("quickCheckIn")?.value;
			const checkOut = document.getElementById("quickCheckOut")?.value;
			const adults = document.getElementById("quickAdults")?.value;
			const children = document.getElementById("quickChildren")?.value;
			console.log("[availability] dane z paska:", { checkIn, checkOut, adults, children });

			if (!checkIn || !checkOut || adults === "" || children === "") {
				console.warn("[availability] brakujące pola — przerwano");
				alert("Wypełnij wszystkie pola.");
				return;
			}

			if (!Reservation.isValidDateRange(checkIn, checkOut)) {
				console.warn("[availability] nieprawidłowy zakres dat");
				alert("Data wyjazdu musi być późniejsza niż data przyjazdu.");
				return;
			}

			const heroBookingElement = document.getElementById("hero-booking");
			if (!heroBookingElement) {
				console.error("[availability] brak elementu #hero-booking");
				return;
			}

			if (!heroBookingElement.innerHTML.trim()) {
				console.log("[availability] ładowanie booking.html do #hero-booking...");
				const html = await loadSubpageContent("booking");
				console.log("[availability] booking.html załadowany, długość HTML:", html?.length);
				heroBookingElement.innerHTML = html;
				heroBookingInitialized = false;
			} else {
				console.log("[availability] #hero-booking już ma zawartość");
			}

			if (!heroBookingInitialized) {
				console.log("[availability] initBookingForm...");
				Reservation.initBookingForm();
				heroBookingInitialized = true;
			}

			console.log("[availability] initReservationCalendar...");
			await initReservationCalendar();

			const checkInEl = document.getElementById("checkIn");
			const checkOutEl = document.getElementById("checkOut");
			const adultsEl = document.getElementById("adults");
			const childrenEl = document.getElementById("children");
			console.log("[availability] pola formularza:", {
				checkIn: !!checkInEl,
				checkOut: !!checkOutEl,
				adults: !!adultsEl,
				children: !!childrenEl,
			});

			if (!checkInEl || !checkOutEl || !adultsEl || !childrenEl) {
				console.error("[availability] brak pól formularza rezerwacji w DOM");
				return;
			}

			checkInEl.value = checkIn;
			checkOutEl.value = checkOut;
			adultsEl.value = adults;
			childrenEl.value = children;
			Reservation.syncCheckoutMinDate();

			console.log("[availability] sprawdzanie isDateRangeAvailable...", { checkIn, checkOut });
			const available = await isDateRangeAvailable(checkIn, checkOut);
			console.log("[availability] wynik dostępności:", available);

			Reservation.updateBookingPricePreview();

			const heroContentEl = document.getElementById("hero-content");
			if (heroContentEl) {
				heroContentEl.classList.remove("visible");
			}

			heroBookingElement.classList.add("visible");
			heroBookingElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
			console.log("[availability] formularz pokazany (#hero-booking.visible)");

			if (!available) {
				console.log("[availability] termin zajęty — pokazuję popup");
				Reservation.showOccupiedPopup(
					"Wybrany termin jest już zarezerwowany. Wybierz inne daty.",
				);
			}
		} catch (error) {
			console.error("[availability] błąd w handlerze Sprawdź dostępność:", error);
			alert("Wystąpił błąd podczas sprawdzania dostępności. Sprawdź konsolę.");
		}
	});
}
