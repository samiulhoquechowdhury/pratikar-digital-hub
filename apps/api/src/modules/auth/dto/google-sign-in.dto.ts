import { IsNotEmpty, IsString } from "class-validator";

export class GoogleSignInDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string; // the JWT credential from Google Identity Services
}
