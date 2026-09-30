/**
 * @jest-environment node
 *
 * Node, not jsdom: serverGet runs on the server, where fetch is Node's own.
 */
import { dataOf, serverGet } from "./serverApi";

/**
 * The three outcomes decide what a crawler is told: a real 404, the page, or
 * the page without data. Confusing "down" with "missing" would 404 the whole
 * catalogue during an API outage.
 */
describe("serverGet", () => {
  const respond = (status: number, body: unknown = {}) =>
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(body), { status }));

  afterEach(() => jest.restoreAllMocks());

  it("returns the data on success", async () => {
    respond(200, { id: "t1" });
    const result = await serverGet<{ id: string }>("/x");
    expect(dataOf(result)).toEqual({ id: "t1" });
  });

  it("reads a 404 as missing", async () => {
    respond(404);
    expect(await serverGet("/x")).toEqual({ status: "missing" });
  });

  it("reads a server error as unavailable, not missing", async () => {
    respond(503);
    expect(await serverGet("/x")).toEqual({ status: "unavailable" });
  });

  it("reads a network failure as unavailable", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    expect(await serverGet("/x")).toEqual({ status: "unavailable" });
  });
});
