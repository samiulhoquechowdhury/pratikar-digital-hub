import { KNOWLEDGE_BASE_DIMENSIONS } from "./sources";
import { VoyageEmbedder } from "./voyage-embedder.service";

describe("VoyageEmbedder", () => {
  const originalEnv = process.env;

  // Env is read in field initialisers, so it has to be set before construction.
  const build = (env: Record<string, string> = {}) => {
    process.env = { ...originalEnv, VOYAGE_API_KEY: "pa-test", ...env };
    return new VoyageEmbedder();
  };

  const respond = (status: number, body: unknown) =>
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(body), { status }));

  const vector = (fill = 0.1): number[] =>
    new Array<number>(KNOWLEDGE_BASE_DIMENSIONS).fill(fill);

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("asks for document embeddings at the column's width", async () => {
    const fetchMock = respond(200, {
      data: [{ embedding: vector(), index: 0 }],
    });

    await build().embedDocuments(["hello"]);

    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init!.body as string)).toEqual({
      input: ["hello"],
      model: "voyage-4",
      input_type: "document",
      output_dimension: KNOWLEDGE_BASE_DIMENSIONS,
    });
    expect((init!.headers as Record<string, string>).Authorization).toBe(
      "Bearer pa-test",
    );
  });

  it("uses the model from the environment when set", async () => {
    const fetchMock = respond(200, { data: [{ embedding: vector() }] });

    await build({ VOYAGE_EMBEDDING_MODEL: "voyage-4-lite" }).embedDocuments([
      "x",
    ]);

    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string) as {
      model: string;
    };
    expect(body.model).toBe("voyage-4-lite");
  });

  it("returns embeddings in input order, whatever order they arrive in", async () => {
    respond(200, {
      data: [
        { embedding: vector(0.2), index: 1 },
        { embedding: vector(0.1), index: 0 },
      ],
    });

    const [first, second] = await build().embedDocuments(["a", "b"]);

    expect(first![0]).toBe(0.1);
    expect(second![0]).toBe(0.2);
  });

  // Thrown so the queue retries — a 429 during a full reindex is expected.
  it("throws on an error status", async () => {
    respond(429, { detail: "rate limited" });

    await expect(build().embedDocuments(["x"])).rejects.toThrow(
      "VOYAGE_ERROR_429",
    );
  });

  // Better to fail the job than write a vector the column rejects — or,
  // worse, one of a different model's shape into a column that happens to fit.
  it("rejects embeddings of the wrong width", async () => {
    respond(200, { data: [{ embedding: [0.1, 0.2] }] });

    await expect(build().embedDocuments(["x"])).rejects.toThrow(/2 dimensions/);
  });

  it("rejects a response with a missing embedding", async () => {
    respond(200, { data: [] });

    await expect(build().embedDocuments(["x"])).rejects.toThrow(
      "0 embeddings for 1 inputs",
    );
  });

  it("refuses to call out without a key", async () => {
    const fetchMock = jest.spyOn(global, "fetch");
    const embedder = build({ VOYAGE_API_KEY: "" });

    expect(embedder.isConfigured).toBe(false);
    await expect(embedder.embedDocuments(["x"])).rejects.toThrow(
      "VOYAGE_NOT_CONFIGURED",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
