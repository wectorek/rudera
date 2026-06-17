import { Reservation } from "../reservation.js";
import { initCopyButton } from "./copyButton.js";

// ===== Kalendarz dostępności =====

function buildReservedSet(dates) {
	const set = new Set();
	for (const { arrivalDate, departureDate } of dates) {
		const start = new Date(arrivalDate);
		const end = new Date(departureDate);
		for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
			set.add(d.toISOString().split("T")[0]);
		}
	}
	return set;
}

function renderCalendar(reservedSet, year, month) {
	const grid = document.getElementById("calGrid");
	const label = document.getElementById("calMonthLabel");
	if (!grid || !label) return;

	const monthNames = [
		"Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
		"Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień",
	];
	label.textContent = `${monthNames[month]} ${year}`;
	grid.innerHTML = "";

	["Pn","Wt","Śr","Cz","Pt","So","Nd"].forEach((name) => {
		const cell = document.createElement("div");
		cell.className = "cal-day-name";
		cell.textContent = name;
		grid.appendChild(cell);
	});

	const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
	for (let i = 0; i < startOffset; i++) {
		const empty = document.createElement("div");
		empty.className = "cal-day cal-empty";
		grid.appendChild(empty);
	}

	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const today = new Date().toISOString().split("T")[0];

	for (let day = 1; day <= daysInMonth; day++) {
		const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		const cell = document.createElement("div");
		cell.className = "cal-day";
		cell.textContent = day;
		if (reservedSet.has(dateStr)) cell.classList.add("cal-reserved");
		if (dateStr === today) cell.classList.add("cal-today");
		grid.appendChild(cell);
	}
}

async function initReservationCalendar() {
	let reservedSet = new Set();

	try {
		const response = await fetch("http://localhost:3000/reserved-dates");
		if (response.ok) {
			const dates = await response.json();
			reservedSet = buildReservedSet(dates);
		} else {
			console.warn("Kalendarz: serwer zwrócił błąd", response.status);
		}
	} catch (err) {
		console.warn("Kalendarz: nie można pobrać zarezerwowanych dat:", err.message);
	}

	let currentYear = new Date().getFullYear();
	let currentMonth = new Date().getMonth();

	renderCalendar(reservedSet, currentYear, currentMonth);

	document.getElementById("calPrev")?.addEventListener("click", () => {
		currentMonth--;
		if (currentMonth < 0) { currentMonth = 11; currentYear--; }
		renderCalendar(reservedSet, currentYear, currentMonth);
	});
	document.getElementById("calNext")?.addEventListener("click", () => {
		currentMonth++;
		if (currentMonth > 11) { currentMonth = 0; currentYear++; }
		renderCalendar(reservedSet, currentYear, currentMonth);
	});
}

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
	const response = await fetch(`src/pages/${subpageId}.html`);
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
			bookingFormInitialized = true;
		}
	} else if (subpageId === "myReservation") {
		subpageElement.style.display = "none";
		supbageBookingElement.style.display = "block";

		// Świeża kopia — reset widoku
		const response = await fetch("src/pages/myReservation.html");
		supbageBookingElement.innerHTML = await response.text();
		initCopyButton();

		// Reset flag — booking musi załadować się od nowa po powrocie
		bookingContentLoaded = false;
		bookingFormInitialized = false;

		const { auth } = await import("../apis/firebase/firebase.js");
		const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js");
		const reservationId = new URLSearchParams(window.location.search).get("reservationId");
		if (reservationId) {
			Reservation.loadReservation(reservationId);
		} else {
			await new Promise((resolve) => {
				const unsubscribe = onAuthStateChanged(auth, (user) => {
					unsubscribe();
					if (user) {
						Reservation.loadMyReservations(user.uid);
					}
					resolve();
				});
			});
		}
		initReservationCalendar();
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

export function initAvailabilityBar() {
	const btn = document.getElementById("checkAvailability");
	if (!btn) return;

	btn.addEventListener("click", async () => {
		console.log("Sprawdzanie dostępności...");
		const checkIn = document.getElementById("quickCheckIn").value;
		const checkOut = document.getElementById("quickCheckOut").value;
		const guests = document.getElementById("quickGuests").value;

		if (!checkIn || !checkOut || !guests) {
			alert("Wypełnij wszystkie pola.");
			return;
		}

		// Załaduj formularz rezerwacji bezpośrednio
		const subpageElement = document.getElementById("subpage");
		const supbageBookingElement = document.getElementById("supbageBooking");
		subpageElement.style.display = "none";
		supbageBookingElement.style.display = "block";

		await loadBookingContent();
		if (!bookingFormInitialized) {
			Reservation.initBookingForm();
			bookingFormInitialized = true;
		}

		// Przepisz wartości i pokaż krok 2
		document.getElementById("checkIn").value = checkIn;
		document.getElementById("checkOut").value = checkOut;
		document.getElementById("guests").value = guests;
		document.getElementById("bookingStep2").style.display = "block";
	});
}
