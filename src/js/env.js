// Globalna zmienna określająca środowisko uruchomieniowe frontendu.
// Wykrywana na podstawie hostname, można nadpisać ręcznie przez
// window.RUDERA_ENV = "local" | "production" (np. w konsoli/devtools).

const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const ENV = window.RUDERA_ENV ?? (isLocalHost ? "local" : "production");

console.log(
	`[env] Wykryte środowisko: ${ENV.toUpperCase()} (hostname: ${window.location.hostname})`,
);
