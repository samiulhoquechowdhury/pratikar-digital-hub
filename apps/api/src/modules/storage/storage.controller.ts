import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";

import { StorageService } from "./storage.service";

// Serves paid content. There is deliberately no auth guard here: the caller is
// a browser following a download link, which carries no Authorization header.
// What stands in for authentication is the signature minted by
// StorageService.signUrl, handed out only after the calling module has checked
// the requester's entitlement (a PAID order, an unconsumed one-time document
// link, an unexpired enrolment).
//
// That makes the signature check below the last line of defence for every
// paywall in the product — an unsigned request must never be served, however
// harmless the key looks.
@Controller("storage")
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get("*")
  async serve(
    @Req() req: Request,
    @Res() res: Response,
    @Query("exp") exp?: string,
    @Query("sig") sig?: string,
  ) {
    const key = decodeURIComponent(req.path.replace(/^\/storage\//, ""));

    if (!exp || !sig || !this.storage.verifyDownloadUrl(key, exp, sig)) {
      // One error covers a bad signature, an expired link, and a key that was
      // never signed — telling them apart would confirm which objects exist.
      throw new ForbiddenException("INVALID_OR_EXPIRED_DOWNLOAD_LINK");
    }

    try {
      const buffer = await this.storage.read(key);
      // Force a download rather than letting the browser render the object
      // inline; inline HTML or SVG would otherwise execute on our origin.
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${key.split("/").pop() ?? "download"}"`,
      );
      res.send(buffer);
    } catch {
      throw new NotFoundException("FILE_NOT_FOUND");
    }
  }
}
