const defaultApiBaseUrl = "http://127.0.0.1:8787";

export const apiBaseUrl =
	window.RUDERA_API_URL?.replace(/\/$/, "") ?? defaultApiBaseUrl;

export function buildApiUrl(path) {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${apiBaseUrl}${normalizedPath}`;
}