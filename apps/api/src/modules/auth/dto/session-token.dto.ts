import { IsBoolean, IsOptional, IsString } from "class-validator";

/**
 * The body of /auth/refresh and /auth/logout. The website sends neither
 * token field — its refresh token is the httpOnly cookie — so both are
 * optional; the Android app, which has no cookie jar, sends the token here.
 */
export class SessionTokenDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsBoolean()
  allDevices?: boolean;
}
