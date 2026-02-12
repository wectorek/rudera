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
                pets: this.attractions.pets
            },
            contact: {
                firstName: this.contact.firstName,
                lastName: this.contact.lastName,
                phone: this.contact.phone,
                email: this.contact.email
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
		const bookingForm = document.getElementById('bookingForm');
		bookingForm.style.display = 'none';

		// Pokaż podsumowanie
		const summary = document.getElementById('reservationSummary');
		summary.style.display = 'block';

		// Dane rezerwacji
		document.getElementById('summaryCheckIn').textContent = this.arrivalDate;
		document.getElementById('summaryCheckOut').textContent = this.departureDate;
		document.getElementById('summaryNights').textContent = this.calculateNumberOfNights();
		document.getElementById('summaryGuests').textContent = this.numberOfGuests;

		// Atrakcje
		const attractions = [];
		if (this.attractions.bikeRental) attractions.push('Wypożyczenie rowerów');
		if (this.attractions.kayakRental) attractions.push('Wypożyczenie kajaków');
		if (this.attractions.campfire) attractions.push('Ognisko z opieką');
		if (this.attractions.pets) attractions.push('Zwierzęta');
		document.getElementById('summaryAttractions').textContent = 
			attractions.length > 0 ? attractions.join(', ') : 'Brak';

		// Dane kontaktowe
		document.getElementById('summaryName').textContent = this.getFullName();
		document.getElementById('summaryEmail').textContent = this.contact.email;
		document.getElementById('summaryPhone').textContent = this.contact.phone;

		// Estymowana cena
		document.getElementById('summaryPrice').textContent = this.calculateTotalPrice() + ' zł';
	}
}
