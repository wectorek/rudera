const localApiBaseUrl = "http://127.0.0.1:8787";
const productionApiBaseUrl = "https://rudera-backend.czekajwiktor013.workers.dev";

const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const defaultApiBaseUrl = isLocalHost ? localApiBaseUrl : productionApiBaseUrl;

export const apiBaseUrl =
	window.RUDERA_API_URL?.replace(/\/$/, "") ?? defaultApiBaseUrl;

console.log("[api] apiBaseUrl:", apiBaseUrl, { isLocalHost, hostname: window.location.hostname });

export function buildApiUrl(path) {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${apiBaseUrl}${normalizedPath}`;
}