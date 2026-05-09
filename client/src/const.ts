export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The Railway build hosts its own login page at /login. Anywhere the original
// Manus build linked to an external OAuth portal, we point to this internal
// path instead.
export const getLoginUrl = () => "/login";
