import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { ContentLibraryController } from "../../modules/content-library/content-library.controller";
import { DocumentsController } from "../../modules/documents/documents.controller";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  const SECRET = "test-secret";
  const jwt = new JwtService({ secret: SECRET });
  const guard = new JwtAuthGuard(jwt, new Reflector());

  const context = (
    handler: () => unknown,
    headers: Record<string, string> = {},
  ) => {
    const request: { headers: Record<string, string>; user?: unknown } = {
      headers,
    };
    return {
      ctx: {
        getHandler: () => handler,
        getClass: () => class {},
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext,
      request,
    };
  };

  const guarded = () => undefined;
  const open = () => undefined;
  Reflect.defineMetadata(IS_PUBLIC_KEY, true, open);

  it("lets a public handler through with no token", async () => {
    await expect(guard.canActivate(context(open).ctx)).resolves.toBe(true);
  });

  // A visitor with an expired token in their browser must still see the
  // catalogue rather than a 401.
  it("ignores a bad token on a public handler", async () => {
    const { ctx } = context(open, { authorization: "Bearer not-a-jwt" });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it("still refuses a guarded handler with no token", async () => {
    await expect(guard.canActivate(context(guarded).ctx)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("still attaches the user on a guarded handler", async () => {
    const token = jwt.sign({ sub: "u1", role: "CUSTOMER" });
    const { ctx, request } = context(guarded, {
      authorization: `Bearer ${token}`,
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual({ id: "u1", role: "CUSTOMER" });
  });
});

/**
 * Pins what visitors can reach. @Public() on the wrong handler would open a
 * staff route to the internet, so the list is spelled out rather than trusted.
 */
describe("public routes", () => {
  const publicHandlers = (controller: { prototype: object }) =>
    Object.getOwnPropertyNames(controller.prototype)
      .filter((name) => name !== "constructor")
      .filter((name) =>
        Reflect.getMetadata(
          IS_PUBLIC_KEY,
          (controller.prototype as Record<string, unknown>)[name] as object,
        ),
      )
      .sort();

  // The custom-draft price is shown before sign-in; it reveals a number.
  it("opens only the template catalogue and draft pricing on DocumentsController", () => {
    expect(publicHandlers(DocumentsController)).toEqual([
      "customPricing",
      "getPublishedTemplate",
      "listTemplates",
    ]);
  });

  // The excerpt is public like the product page it sits on; it serves only
  // watermarked page images of published items, never the file.
  it("opens only the library catalogue and its excerpts on ContentLibraryController", () => {
    expect(publicHandlers(ContentLibraryController)).toEqual([
      "getPreview",
      "getPublished",
      "list",
    ]);
  });
});
