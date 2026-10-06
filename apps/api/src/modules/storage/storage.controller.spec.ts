import { ForbiddenException } from "@nestjs/common";

import { StorageController } from "./storage.controller";

describe("StorageController.serve", () => {
  const build = (valid = true) => {
    const storage = {
      verifyDownloadUrl: jest.fn().mockReturnValue(valid),
      read: jest.fn().mockResolvedValue(Buffer.from("bytes")),
    };
    const headers: Record<string, string> = {};
    const res = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      send: jest.fn(),
    };
    return {
      controller: new StorageController(storage as never),
      res,
      headers,
    };
  };

  const serve = (controller: StorageController, res: unknown, key: string) =>
    controller.serve(
      { path: `/storage/${encodeURIComponent(key)}` } as never,
      res as never,
      "123",
      "sig",
    );

  it("shows a preview page inline, as an image", async () => {
    const { controller, res, headers } = build();

    await serve(controller, res, "library-previews/i-1/page-1.png");

    expect(headers["Content-Type"]).toBe("image/png");
    expect(headers["Content-Disposition"]).toBe(
      'inline; filename="page-1.png"',
    );
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  // Rendered inline, these could run script on the site's origin.
  it.each(["forms/page.html", "forms/logo.svg", "forms/Deed.docx"])(
    "makes %s a download, never inline",
    async (key) => {
      const { controller, res, headers } = build();

      await serve(controller, res, key);

      expect(headers["Content-Type"]).toBe("application/octet-stream");
      expect(headers["Content-Disposition"]).toMatch(/^attachment;/);
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    },
  );

  it("serves nothing without a valid signature", async () => {
    const { controller, res } = build(false);

    await expect(
      serve(controller, res, "forms/Deed.docx"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(res.send).not.toHaveBeenCalled();
  });
});
