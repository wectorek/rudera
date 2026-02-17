import { getPageFromURL, showSubpage } from "./helpers/page.js";

export function initApp() {
	const subpages = {
		foresterDescription: "foresterDescription",
		areaDescription: "areaDescription",
		booking: "booking",
		contact: "contact",
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

	const bookingButton = document.getElementById(subpages.booking);
	const contactButton = document.getElementById(subpages.contact);

	for (const button of [
		areaDescriptionButton,
		foresterDescriptionButton,
		bookingButton,
		contactButton,
	]) {
		button.addEventListener("click", async () => {
			currentButton = await showSubpage(button, currentButton);
		});
	}

	// Inicjalizacja pozycji linii przy starcie
	window.addEventListener("load", async () => {
		currentButton = await showSubpage(
			currentButton,
			currentButton,
			false,
		); // false = nie aktualizuj URL przy inicjalizacji
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
