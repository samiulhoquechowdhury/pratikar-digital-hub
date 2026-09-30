/**
 * How many proxies stand between the internet and this API — the value for
 * Express's "trust proxy".
 *
 * It decides what `req.ip` is, and `req.ip` is what every per-IP limit counts
 * by (the route throttles and the OTP per-IP cap).
 *
 *   unset / 0   trust nothing: req.ip is whoever connected. Right locally.
 *               Behind a proxy it is the proxy, so every visitor shares one
 *               address and one limit.
 *   N           trust the last N hops of X-Forwarded-For. Right when there
 *               are exactly N proxies.
 *
 * Too high is worse than too low. X-Forwarded-For is set by the client first
 * and appended to by each proxy; trusting more hops than exist lets a client
 * write its own "IP" and step around every limit. So this is a count read
 * from configuration and checked, never `true`, and a value that isn't a
 * small whole number stops the API from starting rather than being guessed
 * at.
 */
export function parseTrustProxyHops(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return 0;
  const trimmed = value.trim();
  const hops = Number(trimmed);
  if (!/^\d+$/.test(trimmed) || hops > 5) {
    throw new Error(
      `TRUST_PROXY_HOPS must be a whole number of proxies from 0 to 5, got "${value}"`,
    );
  }
  return hops;
}
