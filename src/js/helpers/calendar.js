import { buildApiUrl } from "../apis/backend.js";

let cachedReservedSet = null;

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

export async function fetchReservedSet({ force = false } = {}) {
	if (cachedReservedSet && !force) return cachedReservedSet;

	try {
		const response = await fetch(buildApiUrl("/reserved-dates"));
		if (response.ok) {
			const dates = await response.json();
			cachedReservedSet = buildReservedSet(dates);
			return cachedReservedSet;
		}
		console.warn("Kalendarz: serwer zwrócił błąd", response.status);
	} catch (err) {
		console.warn("Kalendarz: nie można pobrać zarezerwowanych dat:", err.message);
	}

	cachedReservedSet = new Set();
	return cachedReservedSet;
}

export async function isDateRangeAvailable(arrivalDate, departureDate) {
	const reservedSet = await fetchReservedSet({ force: true });
	const start = new Date(arrivalDate);
	const end = new Date(departureDate);

	for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
		if (reservedSet.has(d.toISOString().split("T")[0])) {
			return false;
		}
	}
	return true;
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

export async function initReservationCalendar() {
	const reservedSet = await fetchReservedSet({ force: true });

	let currentYear = new Date().getFullYear();
	let currentMonth = new Date().getMonth();

	renderCalendar(reservedSet, currentYear, currentMonth);

	const prevBtn = document.getElementById("calPrev");
	const nextBtn = document.getElementById("calNext");
	if (prevBtn) {
		prevBtn.onclick = () => {
			currentMonth--;
			if (currentMonth < 0) { currentMonth = 11; currentYear--; }
			renderCalendar(reservedSet, currentYear, currentMonth);
		};
	}
	if (nextBtn) {
		nextBtn.onclick = () => {
			currentMonth++;
			if (currentMonth > 11) { currentMonth = 0; currentYear++; }
			renderCalendar(reservedSet, currentYear, currentMonth);
		};
	}
}
