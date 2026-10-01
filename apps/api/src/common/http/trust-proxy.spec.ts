import { parseTrustProxyHops } from "./trust-proxy";

describe("parseTrustProxyHops", () => {
  it.each([
    [undefined, 0],
    ["", 0],
    ["  ", 0],
    ["0", 0],
    ["1", 1],
    [" 2 ", 2],
  ])("reads %p as %p", (value, hops) => {
    expect(parseTrustProxyHops(value)).toBe(hops);
  });

  // Each of these would either trust every hop (letting a client write its
  // own IP) or mean something other than a count. Refusing to start is
  // better than guessing.
  it.each(["true", "loopback", "-1", "1.5", "one", "6", "99"])(
    "refuses %p",
    (value) => {
      expect(() => parseTrustProxyHops(value)).toThrow("TRUST_PROXY_HOPS");
    },
  );
});
