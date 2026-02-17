import { initCopyButton } from "./helpers/copyButton.js";
import { initApp } from "./initApp.js";

// Inicjalizuj aplikację
initApp();

// Funkcjonalność kopiowania linku
document.addEventListener("DOMContentLoaded", () => {
	initCopyButton();
});
