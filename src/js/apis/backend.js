import { ENV } from "../env.js";

const localApiBaseUrl = "http://127.0.0.1:8787";
const productionApiBaseUrl = "https://rudera-backend.czekajwiktor013.workers.dev";

const defaultApiBaseUrl = ENV === "local" ? localApiBaseUrl : productionApiBaseUrl;

export const apiBaseUrl =
	window.RUDERA_API_URL?.replace(/\/$/, "") ?? defaultApiBaseUrl;

console.log("[api] apiBaseUrl:", apiBaseUrl, { env: ENV });

export function buildApiUrl(path) {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${apiBaseUrl}${normalizedPath}`;
}