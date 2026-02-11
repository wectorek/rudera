const reservation={
	name:"",	
	email:"",
	phone:"",
	checkIn:"",
	checkOut:"",
	guests:1,
	specialRequests:""
}
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
// Funkcja do pobierania parametru z URL
function getPageFromURL() {
	const urlParams = new URLSearchParams(window.location.search);
	const page = urlParams.get('page');
	// Sprawdź czy parametr page jest poprawny
	if (page && Object.values(subpages).includes(page)) {
		return page;
	}
	return subpages.foresterDescription; // Domyślna strona
}

let currentSubpage = getPageFromURL();
let currentButton = document.getElementById(currentSubpage);
if (currentButton) {
	currentButton.classList.add("current-button");
}
const areaDescriptionButton = document.getElementById(subpages.areaDescription);
const foresterDescriptionButton = document.getElementById(
	subpages.foresterDescription,
);

const bookingButton = document.getElementById(subpages.booking);
const contactButton = document.getElementById(subpages.contact);

function showSubpage(subpage, updateURL = true) {
	currentButton.classList.remove("current-button");
	currentButton = subpage;
	currentButton.classList.add("current-button");

	// Przesuń linię
	const underline = document.getElementById("underline");
	const rect = currentButton.getBoundingClientRect();
	const navRect = document
		.getElementById("navigation")
		.getBoundingClientRect();

	underline.style.left = rect.left - navRect.left + "px";
	underline.style.width = rect.width + "px";

	const subpageElement = document.getElementById("subpage");
	const supbageBookingElement = document.getElementById("supbageBooking");
	const subpageId = currentButton.id;

	// Aktualizuj URL
	if (updateURL) {
		const newURL = `${window.location.pathname}?page=${subpageId}`;
		window.history.pushState({ page: subpageId }, '', newURL);
	}

	// Jeśli kliknięto booking, pokaż div supbageBooking i ukryj subpage
	if (subpageId === "booking") {
		subpageElement.style.display = "none";
		supbageBookingElement.style.display = "block";
	} else {
		// Dla innych przycisków pokaż subpage i ukryj supbageBooking
		subpageElement.style.display = "block";
		supbageBookingElement.style.display = "none";
		subpageElement.innerHTML = subpageContent[subpageId];
	}
}
for (const button of [
	areaDescriptionButton,
	foresterDescriptionButton,
	bookingButton,
	contactButton,
]) {
	button.addEventListener("click", () => {
		showSubpage(button);
	});
}

// Inicjalizacja pozycji linii przy starcie
window.addEventListener("load", () => {
	showSubpage(currentButton, false); // false = nie aktualizuj URL przy inicjalizacji
});

// Obsługa przycisku "wstecz" i "dalej" w przeglądarce
window.addEventListener('popstate', (event) => {
	if (event.state && event.state.page) {
		const button = document.getElementById(event.state.page);
		if (button) {
			showSubpage(button, false);
		}
	} else {
		// Jeśli nie ma state, sprawdź URL
		const page = getPageFromURL();
		const button = document.getElementById(page);
		if (button) {
			showSubpage(button, false);
		}
	}
});
