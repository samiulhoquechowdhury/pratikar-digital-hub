// Access token lives in memory only (architecture.md Section 3: "Android:
// refresh token in encrypted storage, access token in memory" — same rule
// applies to web, just without a native keystore). Never persisted to
// localStorage/sessionStorage, so an XSS payload can't read it off disk and
// a page reload always starts from a clean slate (recovered via /auth/refresh
// against the httpOnly refresh-token cookie once that flow is wired).
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
