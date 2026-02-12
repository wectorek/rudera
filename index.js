import { Reservation } from './reservation.js';
import { addDocument, db } from './firebase.js';
import {
	getDoc, doc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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

// Funkcja do pobierania reservationId z URL
function getReservationIdFromURL() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('reservationId');
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
		
		// Sprawdź czy jest reservationId w URL
		const reservationId = getReservationIdFromURL();
		if (reservationId) {
			loadReservation(reservationId);
		}
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

// Funkcja do ładowania rezerwacji z bazy danych
async function loadReservation(reservationId) {
	try {
		const reservationRef = doc(db, "reservations", reservationId);
		const reservationSnap = await getDoc(reservationRef);
		
		if (reservationSnap.exists()) {
			const data = reservationSnap.data();
			console.log("Dane rezerwacji:", data);
			
			// Utwórz obiekt rezerwacji z pobranych danych
			const reservationData = {
				arrivalDate: data.arrivalDate,
				departureDate: data.departureDate,
				numberOfGuests: data.numberOfGuests,
				bikeRental: data.attractions.bikeRental,
				kayakRental: data.attractions.kayakRental,
				campfire: data.attractions.campfire,
				pets: data.attractions.pets,
				firstName: data.contact.firstName,
				lastName: data.contact.lastName,
				phone: data.contact.phone,
				email: data.contact.email
			};
			
			const reservation = new Reservation(reservationData);
			reservation.showSummary();
			
			// Wypełnij link do rezerwacji
			const reservationLinkInput = document.getElementById('reservationLink');
			if (reservationLinkInput) {
				const reservationUrl = `${window.location.origin}${window.location.pathname}?page=booking&reservationId=${reservationId}`;
				reservationLinkInput.value = reservationUrl;
			}
		} else {
			console.error("Rezerwacja nie istnieje");
			alert("Nie znaleziono rezerwacji o podanym ID");
		}
	} catch (error) {
		console.error("Błąd podczas pobierania rezerwacji:", error);
		alert("Wystąpił błąd podczas pobierania danych rezerwacji");
	}
}

// Obsługa formularza rezerwacji
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Zapobiega przeładowaniu strony
            
            // Pobierz wartości z formularza
            const formData = new FormData(bookingForm);
            
            // Utwórz obiekt z wszystkimi danymi
            const reservationData = {
                // Planowany czas pobytu
                arrivalDate: formData.get('checkIn'),
                departureDate: formData.get('checkOut'),
                numberOfGuests: parseInt(formData.get('guests')),
                
                // Dodatkowe atrakcje
                bikeRental: formData.get('bikeRental') === 'on',
                kayakRental: formData.get('kayakRental') === 'on',
                campfire: formData.get('campfire') === 'on',
                pets: formData.get('pets') === 'on',
                
                // Dane kontaktowe
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                phone: formData.get('phone'),
                email: formData.get('email')
            };
            
            // Utwórz obiekt rezerwacji
            const reservation = new Reservation(reservationData);
            
            // Zapisz rezerwację do bazy i otrzymaj ID
            const docRef = await addDocument(reservation.toPlainObject());
            const reservationId = docRef.id;
            
            // Zaktualizuj URL z parametrem reservationId
            const newURL = `${window.location.pathname}?page=booking&reservationId=${reservationId}`;
            window.history.pushState({ page: 'booking', reservationId: reservationId }, '', newURL);
            
            // Załaduj rezerwację z bazy
            loadReservation(reservationId);
        });
    }
});

// Funkcjonalność kopiowania linku
document.addEventListener('DOMContentLoaded', () => {
    const copyBtn = document.getElementById('copyLinkBtn');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const linkInput = document.getElementById('reservationLink');
            const feedback = document.getElementById('copyFeedback');
            
            if (linkInput) {
                try {
                    // Kopiuj do schowka
                    await navigator.clipboard.writeText(linkInput.value);
                    
                    // Pokaż feedback
                    feedback.textContent = ' Skopiowano!';
                    feedback.style.color = '#4CAF50';
                    
                    // Usuń feedback po 2 sekundach
                    setTimeout(() => {
                        feedback.textContent = '';
                    }, 2000);
                } catch (err) {
                    console.error('Błąd podczas kopiowania:', err);
                    feedback.textContent = ' Błąd kopiowania';
                    feedback.style.color = '#f44336';
                    
                    setTimeout(() => {
                        feedback.textContent = '';
                    }, 2000);
                }
            }
        });
    }
});
