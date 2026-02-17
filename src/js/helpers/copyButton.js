export function initCopyButton() {
	const copyBtn = document.getElementById("copyLinkBtn");

	if (copyBtn) {
		copyBtn.addEventListener("click", async () => {
			const linkInput = document.getElementById("reservationLink");
			const feedback = document.getElementById("copyFeedback");

			if (linkInput) {
				try {
					// Kopiuj do schowka
					await navigator.clipboard.writeText(linkInput.value);

					// Pokaż feedback
					feedback.textContent = " Skopiowano!";
					feedback.style.color = "#4CAF50";

					// Usuń feedback po 2 sekundach
					setTimeout(() => {
						feedback.textContent = "";
					}, 2000);
				} catch (err) {
					console.error("Błąd podczas kopiowania:", err);
					feedback.textContent = " Błąd kopiowania";
					feedback.style.color = "#f44336";

					setTimeout(() => {
						feedback.textContent = "";
					}, 2000);
				}
			}
		});
	}
}
