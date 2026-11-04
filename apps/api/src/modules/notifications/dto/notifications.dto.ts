import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsIn,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class MarkReadDto {
  /** Leave out to mark everything read. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids?: string[];
}

class PushKeysDto {
  @IsString()
  @MaxLength(200)
  p256dh!: string;

  @IsString()
  @MaxLength(100)
  auth!: string;
}

/** A browser's PushSubscription, as its toJSON() gives it. */
export class PushSubscribeDto {
  // https only: a push service is never anything else, and accepting any
  // URL would turn the API into something that POSTs where it is told.
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(1000)
  endpoint!: string;

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}

export class PushUnsubscribeDto {
  @IsString()
  @MaxLength(1000)
  endpoint!: string;
}

/** A phone running the app, as Expo's push service identifies it. */
export class AppPushTokenDto {
  @Matches(/^Expo(nent)?PushToken\[[\w-]+\]$/)
  @MaxLength(200)
  token!: string;

  @IsIn(["android", "ios"])
  platform!: "android" | "ios";
}

export class AppPushForgetDto {
  @IsString()
  @MaxLength(200)
  token!: string;
}
