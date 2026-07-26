import { IsIn, IsNotEmpty, IsString, Length } from "class-validator";

export class OtpVerifyDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsIn(["email", "sms"])
  channel!: "email" | "sms";

  @IsString()
  @Length(6, 6)
  otp!: string;
}
