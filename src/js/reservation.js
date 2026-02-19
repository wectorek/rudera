import { addDocument } from "./apis/firebase/firebase.js";
import { auth } from "./apis/firebase/firebase.js";

// Cache pobranych rezerwacji — unika ponownego zapytania do Firebase
let loadedReservations = [];

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

		// Identyfikator użytkownika
		this.userId = data.userId || null;
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
			createdAt: new Date().toISOString(),
			...(this.userId && { userId: this.userId }),
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
		if (bookingForm) bookingForm.style.display = "none";

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
					const reservationUrl = `${window.location.origin}${window.location.pathname}?page=myReservation&reservationId=${reservationId}`;
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

	static async loadMyReservation(userId) {
		try {
			const { query, where, getDocs, collection } = await import(
				"https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"
			);
			const { db } = await import("./apis/firebase/firebase.js");

			const q = query(
				collection(db, "reservations"),
				where("userId", "==", userId),
			);

			const snapshot = await getDocs(q);

			if (snapshot.empty) {
				alert("Nie masz żadnej rezerwacji.");
				return;
			}

			// Sortuj po stronie klienta — najnowsza rezerwacja pierwsza
			const sorted = snapshot.docs.sort((a, b) => {
				const aDate = a.data().createdAt ?? "";
				const bDate = b.data().createdAt ?? "";
				return bDate.localeCompare(aDate);
			});

			const docSnap = sorted[0];
			const data = docSnap.data();

			const reservation = new Reservation({
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
			});

			reservation.showSummary();

			const reservationLinkInput = document.getElementById("reservationLink");
			if (reservationLinkInput) {
				reservationLinkInput.value = `${window.location.origin}${window.location.pathname}?page=myReservation&reservationId=${docSnap.id}`;
			}
		} catch (error) {
			console.error("Błąd podczas pobierania rezerwacji:", error);
			alert("Wystąpił błąd podczas pobierania danych rezerwacji");
		}
	}

	static async loadMyReservations(userId) {
		try {
			const { query, where, getDocs, collection } = await import(
				"https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"
			);
			const { db } = await import("./apis/firebase/firebase.js");

			const q = query(
				collection(db, "reservations"),
				where("userId", "==", userId),
			);

			const snapshot = await getDocs(q);

			const listContainer = document.getElementById("reservationListItems");
			const noReservations = document.getElementById("noReservations");

			if (snapshot.empty) {
				noReservations.style.display = "block";
				listContainer.style.display = "none";
				return;
			}

			// Sortuj po stronie klienta — najnowsza rezerwacja pierwsza
			const sorted = snapshot.docs.sort((a, b) => {
				const aDate = a.data().createdAt ?? "";
				const bDate = b.data().createdAt ?? "";
				return bDate.localeCompare(aDate);
			});

			// Zapisz dane do cache
			loadedReservations = sorted.map((docSnap) => ({
				docId: docSnap.id,
				data: docSnap.data(),
			}));

			// Pobierz szablon
			const template = document.getElementById("reservationListItemTemplate");

			sorted.forEach((docSnap, index) => {
				const data = docSnap.data();

				// Klonuj szablon
				const clone = template.content.cloneNode(true);
				const li = clone.querySelector(".reservation-list-item");

				li.dataset.reservationIndex = index;

				const fullName = `${data.contact.firstName} ${data.contact.lastName}`;
				const nights = data.numberOfNights ?? 0;
				const datesText = `${data.arrivalDate} → ${data.departureDate} (${nights} ${nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"})`;
				const guestsText = `${data.numberOfGuests} ${data.numberOfGuests === 1 ? "osoba" : data.numberOfGuests < 5 ? "osoby" : "osób"}`;
				const createdText = data.createdAt
					? new Date(data.createdAt).toLocaleDateString("pl-PL")
					: "";

				clone.querySelector(".list-item-name").textContent = fullName;
				clone.querySelector(".list-item-price").textContent = data.totalPrice + " zł";
				clone.querySelector(".list-item-dates").textContent = datesText;
				clone.querySelector(".list-item-guests").textContent = guestsText;
				clone.querySelector(".list-item-created").textContent = createdText
					? `Dodano: ${createdText}`
					: "";

				listContainer.appendChild(clone);
			});

			// Event delegation — jeden listener na całej liście
			listContainer.addEventListener("click", (e) => {
				const item = e.target.closest(".reservation-list-item");
				if (!item) return;

				const index = parseInt(item.dataset.reservationIndex, 10);
				const cached = loadedReservations[index];
				if (!cached) return;

				const { data, docId } = cached;

				const reservation = new Reservation({
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
				});

				reservation.showSummary();

				const reservationLinkInput = document.getElementById("reservationLink");
				if (reservationLinkInput) {
					reservationLinkInput.value = `${window.location.origin}${window.location.pathname}?page=myReservation&reservationId=${docId}`;
				}

				// Przełącz widoki
				document.getElementById("reservationList").style.display = "none";
				document.getElementById("backToList").style.display = "inline-block";
			});

			// Obsługa przycisku "Wróć do listy"
			const backBtn = document.getElementById("backToList");
			if (backBtn) {
				backBtn.addEventListener("click", () => {
					document.getElementById("reservationSummary").style.display = "none";
					document.getElementById("reservationList").style.display = "block";
				});
			}
		} catch (error) {
			console.error("Błąd podczas pobierania rezerwacji:", error);
			alert("Wystąpił błąd podczas pobierania danych rezerwacji");
		}
	}

	static fillTestData() {
		const today = new Date();
		const arrival = new Date(today);
		arrival.setDate(today.getDate() + 7);
		const departure = new Date(today);
		departure.setDate(today.getDate() + 10);

		const fmt = (d) => d.toISOString().split("T")[0];

		document.getElementById("checkIn").value = fmt(arrival);
		document.getElementById("checkOut").value = fmt(departure);
		document.getElementById("guests").value = 2;
		document.getElementById("bikeRental").checked = true;
		document.getElementById("campfire").checked = true;
		document.getElementById("kayakRental").checked = false;
		document.getElementById("pets").checked = false;
		document.getElementById("firstName").value = "Jan";
		document.getElementById("lastName").value = "Kowalski";
		document.getElementById("phone").value = "600123456";
		document.getElementById("email").value = "jan.kowalski@example.com";
	}

	static initBookingForm() {
		const bookingForm = document.getElementById("bookingForm");

		if (bookingForm) {
			const fillBtn = document.getElementById("fillTestData");
			if (fillBtn) {
				fillBtn.addEventListener("click", () => Reservation.fillTestData());
			}
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

					// ID zalogowanego użytkownika
					userId: auth.currentUser?.uid || null,
				};

				// Utwórz obiekt rezerwacji
				const reservation = new Reservation(reservationData);

				// Dodaj ID użytkownika jeśli zalogowany
				const plainObj = reservation.toPlainObject();
				const currentUser = auth.currentUser;
				if (currentUser) {
					plainObj.userId = currentUser.uid;
				}

				// Zapisz rezerwację do bazy i otrzymaj ID
				const docRef = await addDocument(plainObj);
				const reservationId = docRef.id;
				console.log("RESERVATION CREATED: " + reservationId);

				bookingForm.reset();
				document.getElementById("myReservation").click();
			});
		}
	}
}
