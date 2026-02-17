import { getPageFromURL, showSubpage } from "./functions.js";

export function initApp() {
	const subpages = {
		foresterDescription: "foresterDescription",
		areaDescription: "areaDescription",
		booking: "booking",
		contact: "contact",
	};

	const subpageContent = {
		foresterDescription: `
		<h2>Opis Leśniczówki</h2>
		<p>Nasza urokliwa leśniczówka to idealne miejsce na wypoczynek z dala od miejskiego zgiełku. 
		Budynek został odnowiony z zachowaniem tradycyjnego charakteru, oferując jednocześnie wszystkie 
		nowoczesne udogodnienia.</p>
		<p>W leśniczówce znajdują się:</p>
		<ul>
			<li>3 przytulne sypialnie z wygodnymi łóżkami</li>
			<li>Przestronny salon z kominkiem</li>
			<li>W pełni wyposażona kuchnia</li>
			<li>Łazienka z prysznicem</li>
			<li>Taras z widokiem na las</li>
		</ul>
	`,
		areaDescription: `
		<h2>Opis Okolicy</h2>
		<p>Leśniczówka położona jest w sercu malowniczego lasu, z dala od głównych szlaków komunikacyjnych. 
		Okolica zachwyca różnorodnością flory i fauny.</p>
		<p>W okolicy można:</p>
		<ul>
			<li>Odbywać długie spacery leśnymi duktami</li>
			<li>Obserwować dzikie zwierzęta w ich naturalnym środowisku</li>
			<li>Zbierać grzyby i jagody (w sezonie)</li>
			<li>Wypoczywać nad pobliskim jeziorem (2 km)</li>
			<li>Jeździć na rowerze malowniczymi trasami</li>
		</ul>
	`,
		booking: `
		<h2>Rezerwacja</h2>
		<p>Zapraszamy do rezerwacji pobytu w naszej leśniczówce. Cena wynosi 300 zł za dobę.</p>
		<p><strong>Zasady rezerwacji:</strong></p>
		<ul>
			<li>Minimalna długość pobytu: 2 doby</li>
			<li>Check-in: od 15:00</li>
			<li>Check-out: do 11:00</li>
			<li>Zadatek: 30% wartości rezerwacji</li>
			<li>Akceptujemy zwierzęta (dodatkowa opłata 50 zł/doba)</li>
		</ul>
		<p>Aby zarezerwować termin, prosimy o kontakt mailowy lub telefoniczny.</p>
	`,
		contact: `
		<h2>Kontakt</h2>
		<p>Zapraszamy do kontaktu - chętnie odpowiemy na wszystkie pytania!</p>
		<p><strong>Dane kontaktowe:</strong></p>
		<ul>
			<li>Telefon: +48 123 456 789</li>
			<li>Email: kontakt@lesniczowka-rudera.pl</li>
			<li>Adres: Leśna Polana 1, 00-000 Głęboki Las</li>
		</ul>
		<p>Odpisujemy na wiadomości w ciągu 24 godzin.</p>
	`,
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
		button.addEventListener("click", () => {
			currentButton = showSubpage(button, subpageContent, currentButton);
		});
	}

	// Inicjalizacja pozycji linii przy starcie
	window.addEventListener("load", () => {
		currentButton = showSubpage(
			currentButton,
			subpageContent,
			currentButton,
			false,
		); // false = nie aktualizuj URL przy inicjalizacji
	});

	// Obsługa przycisku "wstecz" i "dalej" w przeglądarce
	window.addEventListener("popstate", (event) => {
		if (event.state && event.state.page) {
			const button = document.getElementById(event.state.page);
			if (button) {
				currentButton = showSubpage(
					button,
					subpageContent,
					currentButton,
					false,
				);
			}
		} else {
			// Jeśli nie ma state, sprawdź URL
			const page = getPageFromURL(subpages);
			const button = document.getElementById(page);
			if (button) {
				currentButton = showSubpage(
					button,
					subpageContent,
					currentButton,
					false,
				);
			}
		}
	});
}
