import { Equals } from "class-validator";

/**
 * Erasing an account can't be undone, so the request has to say so in
 * words — the customer types DELETE. A stray click or a replayed request
 * without it does nothing.
 */
export class DeleteAccountDto {
  @Equals("DELETE")
  confirm!: string;
}
