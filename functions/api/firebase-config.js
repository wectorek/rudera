// Cloudflare Pages Function: GET /api/firebase-config
//
// Zwraca publiczną (nie-tajną, ale trzymaną poza repo) konfigurację
// Firebase Web SDK. Wartość FIREBASE_API_KEY ustaw w panelu Cloudflare
// Pages: Settings -> Environment variables -> Add variable
// (typ: Secret) -> nazwa: FIREBASE_API_KEY.
//
// Wymaga, aby katalog `functions/` znajdował się w korzeniu repozytorium
// podłączonego do projektu Cloudflare Pages (niezależnie od ustawionego
// "Build output directory", np. `src`).

export async function onRequestGet({ env }) {
	if (!env.FIREBASE_API_KEY) {
		return new Response(
			JSON.stringify({ error: "FIREBASE_API_KEY nie jest ustawiony w środowisku Cloudflare Pages." }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	return new Response(
		JSON.stringify({ apiKey: env.FIREBASE_API_KEY }),
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
				// Konfiguracja się praktycznie nie zmienia, ale nie chcemy
				// jej trzymać długo w cache pośredniczących proxy.
				"Cache-Control": "private, max-age=300",
			},
		},
	);
}
