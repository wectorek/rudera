import { auth } from "./apis/firebase/firebase.js";
import { buildApiUrl } from "./apis/backend.js";

// Cache pobranych rezerwacji — unika ponownego zapytania do Firebase
let loadedReservations = [];

const PRICE_PER_ADULT = 70;
const PRICE_PER_CHILD = 40;

const TEST_FIRST_NAMES = [
	"Anna", "Piotr", "Maria", "Tomasz", "Katarzyna", "Michał",
	"Agnieszka", "Jakub", "Magdalena", "Paweł", "Natalia", "Krzysztof",
];
const TEST_LAST_NAMES = [
	"Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kamiński",
	"Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski",
];

function pickRandom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

function addDays(dateStr, days) {
	const date = new Date(dateStr);
	date.setDate(date.getDate() + days);
	return date.toISOString().split("T")[0];
}

function formatGuestsText(adults, children) {
	const adultsWord = adults === 1 ? "dorosły" : "dorosłych";
	const childrenWord = children === 1 ? "dziecko" : "dzieci";
	return `${adults} ${adultsWord}, ${children} ${childrenWord}`;
}

function mapReservationData(data) {
	return {
		arrivalDate: data.arrivalDate,
		departureDate: data.departureDate,
		numberOfAdults: data.numberOfAdults ?? data.numberOfGuests ?? 0,
		numberOfChildren: data.numberOfChildren ?? 0,
		firstName: data.contact.firstName,
		lastName: data.contact.lastName,
		phone: data.contact.phone,
		email: data.contact.email,
		totalPrice: data.totalPrice,
	};
}

export class Reservation {
	constructor(data) {
		this.arrivalDate = data.arrivalDate;
		this.departureDate = data.departureDate;
		this.numberOfAdults = Number(data.numberOfAdults) || 0;
		this.numberOfChildren = Number(data.numberOfChildren) || 0;

		this.contact = {
			firstName: data.firstName,
			lastName: data.lastName,
			phone: data.phone,
			email: data.email,
		};

		this.userId = data.userId || null;
		this.storedTotalPrice =
			data.totalPrice != null ? Number(data.totalPrice) : null;
	}

	toPlainObject() {
		return {
			arrivalDate: this.arrivalDate,
			departureDate: this.departureDate,
			numberOfAdults: this.numberOfAdults,
			numberOfChildren: this.numberOfChildren,
			numberOfGuests: this.numberOfAdults + this.numberOfChildren,
			numberOfNights: this.calculateNumberOfNights(),
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
		const nights = this.calculateNumberOfNights();
		return nights * (PRICE_PER_ADULT * this.numberOfAdults + PRICE_PER_CHILD * this.numberOfChildren);
	}

	getFullName() {
		return `${this.contact.firstName} ${this.contact.lastName}`;
	}

	showSummary() {
		const bookingForm = document.getElementById("bookingForm");
		if (bookingForm) bookingForm.style.display = "none";

		const summary = document.getElementById("reservationSummary");
		summary.style.display = "block";

		document.getElementById("summaryCheckIn").textContent = this.arrivalDate;
		document.getElementById("summaryCheckOut").textContent = this.departureDate;
		document.getElementById("summaryNights").textContent = this.calculateNumberOfNights();
		document.getElementById("summaryAdults").textContent = this.numberOfAdults;
		document.getElementById("summaryChildren").textContent = this.numberOfChildren;

		document.getElementById("summaryName").textContent = this.getFullName();
		document.getElementById("summaryEmail").textContent = this.contact.email;
		document.getElementById("summaryPhone").textContent = this.contact.phone;

		document.getElementById("summaryPrice").textContent =
			(this.storedTotalPrice ?? this.calculateTotalPrice()) + " zł";
	}

	static getReservationIdFromURL() {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get("reservationId");
	}

	static isValidDateRange(checkIn, checkOut) {
		if (!checkIn || !checkOut) return false;
		return new Date(checkOut) > new Date(checkIn);
	}

	static syncCheckoutMinDate() {
		const checkInInput = document.getElementById("checkIn");
		const checkOutInput = document.getElementById("checkOut");
		if (!checkInInput || !checkOutInput || !checkInInput.value) return;

		const minCheckout = addDays(checkInInput.value, 1);
		checkOutInput.min = minCheckout;

		if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
			checkOutInput.value = minCheckout;
		}
	}

	static updateBookingPricePreview() {
		const priceEl = document.getElementById("bookingPriceValue");
		if (!priceEl) return;

		const checkIn = document.getElementById("checkIn")?.value;
		const checkOut = document.getElementById("checkOut")?.value;
		const adults = parseInt(document.getElementById("adults")?.value, 10) || 0;
		const children = parseInt(document.getElementById("children")?.value, 10) || 0;

		if (!Reservation.isValidDateRange(checkIn, checkOut)) {
			priceEl.textContent = "0 zł";
			return;
		}

		const reservation = new Reservation({
			arrivalDate: checkIn,
			departureDate: checkOut,
			numberOfAdults: adults,
			numberOfChildren: children,
			firstName: "",
			lastName: "",
			phone: "",
			email: "",
		});
		priceEl.textContent = reservation.calculateTotalPrice() + " zł";
	}

	static async loadReservation(reservationId) {
		try {
			const { getDoc, doc } =
				await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
			const { db } = await import("./apis/firebase/firebase.js");

			const reservationRef = doc(db, "reservations", reservationId);
			const reservationSnap = await getDoc(reservationRef);

			if (reservationSnap.exists()) {
				const data = reservationSnap.data();
				console.log("Dane rezerwacji:", data);

				const reservation = new Reservation(mapReservationData(data));
				reservation.showSummary();

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
			const { query, where, getDocs, collection } =
				await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
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

			const sorted = snapshot.docs.sort((a, b) => {
				const aDate = a.data().createdAt ?? "";
				const bDate = b.data().createdAt ?? "";
				return bDate.localeCompare(aDate);
			});

			const docSnap = sorted[0];
			const reservation = new Reservation(mapReservationData(docSnap.data()));
			reservation.showSummary();

			const reservationLinkInput =
				document.getElementById("reservationLink");
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
			const { query, where, getDocs, collection } =
				await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
			const { db } = await import("./apis/firebase/firebase.js");

			const q = query(
				collection(db, "reservations"),
				where("userId", "==", userId),
			);

			const snapshot = await getDocs(q);

			const listContainer = document.getElementById(
				"reservationListItems",
			);
			const noReservations = document.getElementById("noReservations");

			if (snapshot.empty) {
				noReservations.style.display = "block";
				listContainer.style.display = "none";
				return;
			}

			const sorted = snapshot.docs.sort((a, b) => {
				const aDate = a.data().createdAt ?? "";
				const bDate = b.data().createdAt ?? "";
				return bDate.localeCompare(aDate);
			});

			loadedReservations = sorted.map((docSnap) => ({
				docId: docSnap.id,
				data: docSnap.data(),
			}));

			const template = document.getElementById(
				"reservationListItemTemplate",
			);

			sorted.forEach((docSnap, index) => {
				const data = docSnap.data();
				const clone = template.content.cloneNode(true);
				const li = clone.querySelector(".reservation-list-item");

				li.dataset.reservationIndex = index;

				const fullName = `${data.contact.firstName} ${data.contact.lastName}`;
				const nights = data.numberOfNights ?? 0;
				const datesText = `${data.arrivalDate} → ${data.departureDate} (${nights} ${nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"})`;
				const adults = data.numberOfAdults ?? data.numberOfGuests ?? 0;
				const children = data.numberOfChildren ?? 0;
				const guestsText = formatGuestsText(adults, children);
				const createdText = data.createdAt
					? new Date(data.createdAt).toLocaleDateString("pl-PL")
					: "";

				clone.querySelector(".list-item-name").textContent = fullName;
				clone.querySelector(".list-item-price").textContent =
					data.totalPrice + " zł";
				clone.querySelector(".list-item-dates").textContent = datesText;
				clone.querySelector(".list-item-guests").textContent = guestsText;
				clone.querySelector(".list-item-created").textContent =
					createdText ? `Dodano: ${createdText}` : "";

				listContainer.appendChild(clone);
			});

			listContainer.addEventListener("click", (e) => {
				const item = e.target.closest(".reservation-list-item");
				if (!item) return;

				const index = parseInt(item.dataset.reservationIndex, 10);
				const cached = loadedReservations[index];
				if (!cached) return;

				const { data, docId } = cached;
				const reservation = new Reservation(mapReservationData(data));
				reservation.showSummary();

				const reservationLinkInput =
					document.getElementById("reservationLink");
				if (reservationLinkInput) {
					reservationLinkInput.value = `${window.location.origin}${window.location.pathname}?page=myReservation&reservationId=${docId}`;
				}

				document.getElementById("reservationList").style.display = "none";
				document.getElementById("backToList").style.display = "inline-block";
			});

			const backBtn = document.getElementById("backToList");
			if (backBtn) {
				backBtn.addEventListener("click", () => {
					document.getElementById("reservationSummary").style.display =
						"none";
					document.getElementById("reservationList").style.display =
						"block";
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
		document.getElementById("adults").value = 2;
		document.getElementById("children").value = 1;

		Reservation.syncCheckoutMinDate();

		document.getElementById("firstName").value = pickRandom(TEST_FIRST_NAMES);
		document.getElementById("lastName").value = pickRandom(TEST_LAST_NAMES);
		document.getElementById("phone").value = "600123456";
		document.getElementById("email").value = "wectorek9@gmail.com";
		Reservation.updateBookingPricePreview();
	}

	static showOccupiedPopup(message) {
		const modals = [...document.querySelectorAll("#occupiedModal")];
		const modal = modals[0];
		if (!modal) {
			alert(message || "Wybrany termin jest już zajęty. Wybierz inne daty.");
			return;
		}
		modals.slice(1).forEach((extra) => extra.remove());

		const messageEl = modal.querySelector("#occupiedModalMessage");
		if (messageEl && message) {
			messageEl.textContent = message;
		}

		if (modal.parentElement !== document.body) {
			document.body.appendChild(modal);
		}

		modal.style.display = "flex";

		const close = () => {
			modal.style.display = "none";
		};

		modal.querySelector("#occupiedModalClose").onclick = close;
		modal.querySelector("#occupiedModalBackdrop").onclick = close;
	}

	static initBookingForm() {
		const bookingForm = document.getElementById("bookingForm");
		console.log("[booking] initBookingForm, form found:", !!bookingForm);

		if (bookingForm) {
			const fillBtn = document.getElementById("fillTestData");
			if (fillBtn) {
				fillBtn.addEventListener("click", () =>
					Reservation.fillTestData(),
				);
			}

			const checkInInput = document.getElementById("checkIn");
			const checkOutInput = document.getElementById("checkOut");
			const adultsInput = document.getElementById("adults");
			const childrenInput = document.getElementById("children");

			checkInInput?.addEventListener("change", () => {
				Reservation.syncCheckoutMinDate();
				Reservation.updateBookingPricePreview();
			});
			checkOutInput?.addEventListener("change", () => {
				Reservation.updateBookingPricePreview();
			});
			adultsInput?.addEventListener("input", () => {
				Reservation.updateBookingPricePreview();
			});
			childrenInput?.addEventListener("input", () => {
				Reservation.updateBookingPricePreview();
			});

			Reservation.syncCheckoutMinDate();
			Reservation.updateBookingPricePreview();

			bookingForm.addEventListener("submit", async (event) => {
				event.preventDefault();
				console.log("[booking] submit formularza rezerwacji");

				try {
					const formData = new FormData(bookingForm);
					const arrivalDate = formData.get("checkIn");
					const departureDate = formData.get("checkOut");
					console.log("[booking] daty:", { arrivalDate, departureDate });

					if (!Reservation.isValidDateRange(arrivalDate, departureDate)) {
						console.warn("[booking] nieprawidłowy zakres dat");
						alert("Data wyjazdu musi być późniejsza niż data przyjazdu.");
						return;
					}

					const reservationData = {
						arrivalDate,
						departureDate,
						numberOfAdults: parseInt(formData.get("adults"), 10),
						numberOfChildren: parseInt(formData.get("children"), 10),
						firstName: formData.get("firstName"),
						lastName: formData.get("lastName"),
						phone: formData.get("phone"),
						email: formData.get("email"),
						userId: auth.currentUser?.uid || null,
					};
					console.log("[booking] reservationData:", reservationData);

					const reservation = new Reservation(reservationData);
					const plainObj = reservation.toPlainObject();
					const currentUser = auth.currentUser;
					if (currentUser) {
						plainObj.userId = currentUser.uid;
					}

					const url = buildApiUrl("/make-reservation");
					console.log("[booking] POST", url, plainObj);
					const response = await fetch(url, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(plainObj),
					});
					console.log("[booking] /make-reservation status:", response.status);

					if (response.status === 409) {
						const { error } = await response.json();
						console.warn("[booking] konflikt 409:", error);
						Reservation.showOccupiedPopup(
							error || "Wybrany termin jest już zajęty. Wybierz inne daty.",
						);
						return;
					}

					if (response.status === 400) {
						const { error } = await response.json();
						console.warn("[booking] błąd walidacji 400:", error);
						alert(error || "Nieprawidłowe dane rezerwacji.");
						return;
					}

					if (!response.ok) {
						const bodyText = await response.text().catch(() => "");
						console.error("[booking] błąd HTTP", response.status, bodyText);
						alert("Wystąpił błąd podczas tworzenia rezerwacji. Spróbuj ponownie.");
						return;
					}

					const { reservationId } = await response.json();
					console.log("[booking] RESERVATION CREATED:", reservationId);

					bookingForm.reset();
					document.getElementById("myReservation").click();
				} catch (error) {
					console.error("[booking] błąd podczas tworzenia rezerwacji:", error);
					alert("Wystąpił błąd podczas tworzenia rezerwacji. Sprawdź konsolę.");
				}
			});
		} else {
			console.error("[booking] initBookingForm — brak #bookingForm w DOM");
		}
	}
}
