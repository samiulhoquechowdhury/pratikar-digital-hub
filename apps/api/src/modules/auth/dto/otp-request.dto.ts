import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class OtpRequestDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email or E.164 phone — channel-specific format validated in the service

  @IsIn(["email", "sms"])
  channel!: "email" | "sms";
}
