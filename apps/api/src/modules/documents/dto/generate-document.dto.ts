import { IsNotEmpty, IsObject, IsString } from "class-validator";

export class GenerateDocumentDto {
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @IsObject()
  filledData!: Record<string, unknown>;
}
