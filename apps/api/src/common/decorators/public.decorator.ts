import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Lets a visitor reach one handler on a controller whose class is guarded.
 *
 * For read-only catalogue routes only — the listing and detail pages someone
 * reads before deciding to sign up. Opting a single handler out is safer than
 * moving the class guard onto every other method: forgetting @Public() on a
 * catalogue route costs a sign-in prompt, whereas forgetting a method guard
 * would open an admin route.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
