import { addDocument } from "./apis/firebase/firebase.js";

export class Reservation {
	constructor(data) {
		// Planowany czas pobytu
		this.arrivalDate = data.arrivalDate;
		this.departureDate = data.departureDate;
		this.numberOfGuests = data.numberOfGuests;

		// Dodatkowe odpłatne atrakcje
		this.attractions = {
			bikeRental: data.bikeRental || false,
			kayakRental: data.kayakRental || false,
			campfire: data.campfire || false,
			pets: data.pets || false,
		};

		// Dane kontaktowe
		this.contact = {
			firstName: data.firstName,
			lastName: data.lastName,
			phone: data.phone,
			email: data.email,
		};
	}

	toPlainObject() {
		return {
			arrivalDate: this.arrivalDate,
			departureDate: this.departureDate,
			numberOfGuests: this.numberOfGuests,
			numberOfNights: this.calculateNumberOfNights(),
			attractions: {
				bikeRental: this.attractions.bikeRental,
				kayakRental: this.attractions.kayakRental,
				campfire: this.attractions.campfire,
				pets: this.attractions.pets,
			},
			contact: {
				firstName: this.contact.firstName,
				lastName: this.contact.lastName,
				phone: this.contact.phone,
				email: this.contact.email,
			},
			totalPrice: this.calculateTotalPrice(),
		};
	}

	calculateNumberOfNights() {
		if (this.arrivalDate && this.departureDate) {
			const arrival = new Date(this.arrivalDate);
			const departure = new Date(this.departureDate);
			const diffTime = departure - arrival;
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays > 0 ? diffDays : 0;
		}
		return 0;
	}

	calculateTotalPrice() {
		const basePricePerNight = 500;
		const pricePerAdditionalPerson = 100;
		const pricePerNight =
			basePricePerNight +
			pricePerAdditionalPerson * (this.numberOfGuests - 1);
		const numberOfNights = this.calculateNumberOfNights();
		const finalPrice = pricePerNight * numberOfNights;
		return finalPrice;
	}
	getFullName() {
		return `${this.contact.firstName} ${this.contact.lastName}`;
	}

	showSummary() {
		// Ukryj formularz
		const bookingForm = document.getElementById("bookingForm");
		bookingForm.style.display = "none";

		// Pokaż podsumowanie
		const summary = document.getElementById("reservationSummary");
		summary.style.display = "block";

		// Dane rezerwacji
		document.getElementById("summaryCheckIn").textContent =
			this.arrivalDate;
		document.getElementById("summaryCheckOut").textContent =
			this.departureDate;
		document.getElementById("summaryNights").textContent =
			this.calculateNumberOfNights();
		document.getElementById("summaryGuests").textContent =
			this.numberOfGuests;

		// Atrakcje
		const attractions = [];
		if (this.attractions.bikeRental)
			attractions.push("Wypożyczenie rowerów");
		if (this.attractions.kayakRental)
			attractions.push("Wypożyczenie kajaków");
		if (this.attractions.campfire) attractions.push("Ognisko z opieką");
		if (this.attractions.pets) attractions.push("Zwierzęta");
		document.getElementById("summaryAttractions").textContent =
			attractions.length > 0 ? attractions.join(", ") : "Brak";

		// Dane kontaktowe
		document.getElementById("summaryName").textContent = this.getFullName();
		document.getElementById("summaryEmail").textContent =
			this.contact.email;
		document.getElementById("summaryPhone").textContent =
			this.contact.phone;

		// Estymowana cena
		document.getElementById("summaryPrice").textContent =
			this.calculateTotalPrice() + " zł";
	}

	static getReservationIdFromURL() {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get("reservationId");
	}

	static async loadReservation(reservationId) {
		try {
			const { getDoc, doc } = await import(
				"https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"
			);
			const { db } = await import("./apis/firebase/firebase.js");

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
					email: data.contact.email,
				};

				const reservation = new Reservation(reservationData);
				reservation.showSummary();

				// Wypełnij link do rezerwacji
				const reservationLinkInput =
					document.getElementById("reservationLink");
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

	static initBookingForm() {
		const bookingForm = document.getElementById("bookingForm");

		if (bookingForm) {
			bookingForm.addEventListener("submit", async (event) => {
				event.preventDefault(); // Zapobiega przeładowaniu strony

				// Pobierz wartości z formularza
				const formData = new FormData(bookingForm);

				// Utwórz obiekt z wszystkimi danymi
				const reservationData = {
					// Planowany czas pobytu
					arrivalDate: formData.get("checkIn"),
					departureDate: formData.get("checkOut"),
					numberOfGuests: parseInt(formData.get("guests")),

					// Dodatkowe atrakcje
					bikeRental: formData.get("bikeRental") === "on",
					kayakRental: formData.get("kayakRental") === "on",
					campfire: formData.get("campfire") === "on",
					pets: formData.get("pets") === "on",

					// Dane kontaktowe
					firstName: formData.get("firstName"),
					lastName: formData.get("lastName"),
					phone: formData.get("phone"),
					email: formData.get("email"),
				};

				// Utwórz obiekt rezerwacji
				const reservation = new Reservation(reservationData);

				// Zapisz rezerwację do bazy i otrzymaj ID
				const docRef = await addDocument(
					reservation.toPlainObject(),
				);
				const reservationId = docRef.id;
				console.log("RESERVATION CREATED: " + reservationId);

				// Zaktualizuj URL z parametrem reservationId
				const newURL = `${window.location.pathname}?page=booking&reservationId=${reservationId}`;
				window.history.pushState(
					{ page: "booking", reservationId: reservationId },
					"",
					newURL,
				);

				// Załaduj rezerwację z bazy
				Reservation.loadReservation(reservationId);
			});
		}
	}
}
