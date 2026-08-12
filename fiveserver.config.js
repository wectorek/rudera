const fs = require("fs");
const path = require("path");

/**
 * Five Server nie uruchamia Cloudflare Pages Functions.
 * Ten middleware emuluje GET /api/firebase-config, czytając FIREBASE_API_KEY
 * z `.dev.vars` (ten sam plik co `wrangler pages dev`).
 */
function firebaseConfigMiddleware(req, res, next) {
	const urlPath = (req.url || "").split("?")[0];
	if (urlPath !== "/api/firebase-config") {
		next();
		return;
	}

	try {
		const varsPath = path.join(__dirname, ".dev.vars");
		const vars = fs.readFileSync(varsPath, "utf8");
		const match = vars.match(/^FIREBASE_API_KEY=(.*)$/m);
		const apiKey = match?.[1]?.trim();

		res.setHeader("Content-Type", "application/json");
		res.setHeader("Cache-Control", "private, max-age=300");

		if (!apiKey) {
			res.statusCode = 500;
			res.end(
				JSON.stringify({
					error: "FIREBASE_API_KEY nie jest ustawiony w .dev.vars",
				}),
			);
			return;
		}

		res.statusCode = 200;
		res.end(JSON.stringify({ apiKey }));
	} catch (err) {
		res.statusCode = 500;
		res.setHeader("Content-Type", "application/json");
		res.end(
			JSON.stringify({
				error: "Nie udało się odczytać .dev.vars (skopiuj z .dev.vars.example).",
			}),
		);
	}
}

module.exports = {
	port: 5501,
	root: "src",
	open: "index.html",
	middleware: [firebaseConfigMiddleware],
};
