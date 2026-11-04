import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class OtpRequestDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email, or a phone as typed — normalised (and refused unless an Indian mobile) in AuthService

  @IsIn(["email", "sms"])
  channel!: "email" | "sms";
}
