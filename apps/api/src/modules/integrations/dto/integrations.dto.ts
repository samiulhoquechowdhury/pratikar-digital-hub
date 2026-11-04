import { IsOptional, IsString, MaxLength } from "class-validator";

export class SetIntegrationDto {
  @IsString()
  @MaxLength(4000)
  value!: string;
}

export class TestIntegrationDto {
  /** MSG91 only: the number the test SMS goes to. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
