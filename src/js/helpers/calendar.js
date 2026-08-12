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
	if (cachedReservedSet && !force) {
		console.log("[calendar] fetchReservedSet — cache hit, size:", cachedReservedSet.size);
		return cachedReservedSet;
	}

	const url = buildApiUrl("/reserved-dates");
	console.log("[calendar] fetchReservedSet — GET", url, { force });

	try {
		const response = await fetch(url);
		console.log("[calendar] /reserved-dates status:", response.status);
		if (response.ok) {
			const dates = await response.json();
			console.log("[calendar] /reserved-dates liczba przedziałów:", dates?.length, dates);
			cachedReservedSet = buildReservedSet(dates);
			console.log("[calendar] reservedSet size:", cachedReservedSet.size);
			return cachedReservedSet;
		}
		console.warn("[calendar] serwer zwrócił błąd", response.status);
	} catch (err) {
		console.warn("[calendar] nie można pobrać zarezerwowanych dat:", err);
	}

	cachedReservedSet = new Set();
	console.log("[calendar] fallback — pusty reservedSet");
	return cachedReservedSet;
}

export async function isDateRangeAvailable(arrivalDate, departureDate) {
	console.log("[calendar] isDateRangeAvailable:", { arrivalDate, departureDate });
	const reservedSet = await fetchReservedSet({ force: true });
	const start = new Date(arrivalDate);
	const end = new Date(departureDate);

	for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
		const day = d.toISOString().split("T")[0];
		if (reservedSet.has(day)) {
			console.log("[calendar] kolizja w dniu:", day);
			return false;
		}
	}
	console.log("[calendar] zakres wolny");
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
	console.log("[calendar] initReservationCalendar start");
	const reservedSet = await fetchReservedSet({ force: true });

	let currentYear = new Date().getFullYear();
	let currentMonth = new Date().getMonth();

	const grid = document.getElementById("calGrid");
	const label = document.getElementById("calMonthLabel");
	console.log("[calendar] elementy DOM:", { calGrid: !!grid, calMonthLabel: !!label });

	renderCalendar(reservedSet, currentYear, currentMonth);
	console.log("[calendar] initReservationCalendar done");

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
