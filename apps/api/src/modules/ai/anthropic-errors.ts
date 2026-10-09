import Anthropic from "@anthropic-ai/sdk";
import {
  InternalServerErrorException,
  type Logger,
  ServiceUnavailableException,
} from "@nestjs/common";

/**
 * What an Anthropic API failure becomes for our callers.
 *
 * Overload, rate limit and network trouble are temporary and say so; the
 * browser offers a retry. Anything else is our bug, logged in full and
 * returned without detail.
 */
export function toServiceError(error: unknown, logger: Logger): Error {
  if (
    error instanceof Anthropic.RateLimitError ||
    error instanceof Anthropic.InternalServerError ||
    error instanceof Anthropic.APIConnectionError
  ) {
    logger.warn(`Model unavailable: ${(error as Error).message}`);
    return new ServiceUnavailableException("AI_BUSY");
  }
  logger.error(
    `Model request failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  return new InternalServerErrorException("AI_ERROR");
}
