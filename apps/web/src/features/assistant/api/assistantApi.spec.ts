import { classifyChatError, parseSseChunk } from "./assistantApi";

/** apiClient's error message is the only signal the chat has to go on. */
describe("classifyChatError", () => {
  const apiError = (status: number, body: string) =>
    new Error(`API error ${status}: ${body}`);

  it("reads a missing model key as not configured", () => {
    expect(
      classifyChatError(
        apiError(503, '{"message":"AI_NOT_CONFIGURED","statusCode":503}'),
      ),
    ).toBe("not-configured");
  });

  it("reads any other 503 as busy", () => {
    expect(classifyChatError(apiError(503, '{"message":"AI_BUSY"}'))).toBe(
      "busy",
    );
  });

  it("reads 429 as asking too fast", () => {
    expect(classifyChatError(apiError(429, "ThrottlerException"))).toBe(
      "too-fast",
    );
  });

  it.each([
    [apiError(500, "{}")],
    [new Error("Failed to fetch")],
    ["not an error"],
  ])("reads anything else as failed (%p)", (error) => {
    expect(classifyChatError(error)).toBe("failed");
  });
});

describe("parseSseChunk", () => {
  it("reads complete events and keeps a partial one for the next chunk", () => {
    const { events, rest } = parseSseChunk(
      'data: {"type":"delta","text":"Hi"}\n\ndata: {"type":"del',
    );
    expect(events).toEqual([{ type: "delta", text: "Hi" }]);
    expect(rest).toBe('data: {"type":"del');
  });

  it("skips a block that isn't JSON", () => {
    expect(parseSseChunk("data: nope\n\n").events).toEqual([]);
  });
});
