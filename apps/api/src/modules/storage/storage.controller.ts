import { Controller, Get, NotFoundException, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";

import { StorageService } from "./storage.service";

// Dev-only stand-in for what a signed R2 URL serves in production — only ever
// hit when StorageService.getUrl() returned a localhost URL (i.e. no R2 env
// vars configured). Harmless in an environment where R2 *is* configured: keys
// won't exist on local disk there, so this just 404s and is never linked to.
@Controller("storage")
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get("*")
  async serve(@Req() req: Request, @Res() res: Response) {
    const key = req.path.replace(/^\/storage\//, "");
    try {
      const buffer = await this.storage.read(key);
      res.send(buffer);
    } catch {
      throw new NotFoundException("FILE_NOT_FOUND");
    }
  }
}
