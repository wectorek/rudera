import { getPageFromURL, showSubpage, initAvailabilityBar } from "../js/helpers/page.js";

export function initApp() {
	const subpages = {
		foresterDescription: "foresterDescription",
		areaDescription: "areaDescription",
		contact: "contact",
		myReservation: "myReservation",
	};

	let currentSubpage = getPageFromURL(subpages);
	let currentButton = document.getElementById(currentSubpage);
	if (currentButton) {
		currentButton.classList.add("current-button");
	}
	const areaDescriptionButton = document.getElementById(
		subpages.areaDescription,
	);
	const foresterDescriptionButton = document.getElementById(
		subpages.foresterDescription,
	);

	const contactButton = document.getElementById(subpages.contact);
	const myReservationButton = document.getElementById(subpages.myReservation);

	// Hamburger menu
	const hamburgerBtn = document.getElementById("hamburger-btn");
	const navbar = document.getElementById("navbar");

	function closeMenu() {
		navbar.classList.remove("menu-open");
		if (hamburgerBtn) {
			hamburgerBtn.setAttribute("aria-expanded", "false");
			hamburgerBtn.querySelector("i").className = "fas fa-bars";
		}
	}

	if (hamburgerBtn) {
		hamburgerBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			const isOpen = navbar.classList.toggle("menu-open");
			hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
			hamburgerBtn.querySelector("i").className = isOpen ? "fas fa-times" : "fas fa-bars";
		});

		document.addEventListener("click", (e) => {
			if (!navbar.contains(e.target)) {
				closeMenu();
			}
		});
	}

	for (const button of [
		areaDescriptionButton,
		foresterDescriptionButton,
		contactButton,
		myReservationButton,
	]) {
		button.addEventListener("click", async () => {
			closeMenu();
			currentButton = await showSubpage(button, currentButton);
		});
	}

	// Inicjalizacja pozycji linii przy starcie
	window.addEventListener("load", async () => {
		console.log("[initApp] window.load — start");
		try {
			currentButton = await showSubpage(
				currentButton,
				currentButton,
				false,
			); // false = nie aktualizuj URL przy inicjalizacji
			console.log("[initApp] showSubpage done, initAvailabilityBar...");
			initAvailabilityBar();
			console.log("[initApp] window.load — done");
		} catch (error) {
			console.error("[initApp] błąd przy starcie:", error);
		}
	});

	// Obsługa przycisku "wstecz" i "dalej" w przeglądarce
	window.addEventListener("popstate", async (event) => {
		if (event.state && event.state.page) {
			const button = document.getElementById(event.state.page);
			if (button) {
				currentButton = await showSubpage(
					button,
					currentButton,
					false,
				);
			}
		} else {
			// Jeśli nie ma state, sprawdź URL
			const page = getPageFromURL(subpages);
			const button = document.getElementById(page);
			if (button) {
				currentButton = await showSubpage(
					button,
					currentButton,
					false,
				);
			}
		}
	});
}
