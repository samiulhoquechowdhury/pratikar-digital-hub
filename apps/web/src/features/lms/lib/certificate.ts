import { siteOrigin } from "@/shared/lib/site";

/**
 * Where a certificate's QR code points.
 *
 * The QR encodes a full URL rather than a bare code, so scanning it with any
 * phone camera opens the verification page directly — nobody has to know to
 * type the code in somewhere. That means the origin has to be the real
 * deployed one: a QR printed with "localhost" in it is worthless the moment
 * the certificate leaves the machine that made it.
 */
export const verificationUrl = (code: string): string =>
  `${siteOrigin()}/verify/${encodeURIComponent(code)}`;
