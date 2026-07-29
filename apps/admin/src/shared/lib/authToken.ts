// Access token lives in memory only — same rule as apps/web (see
// architecture.md Section 3). Never persisted, so an XSS payload can't read it
// off disk and a reload starts clean, recovered via /auth/refresh against the
// httpOnly refresh-token cookie once that flow is wired.
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
