import type { Job } from "bullmq";

import { convertToPdf } from "../../common/office/convert-to-pdf";
import { renderPreviewPages } from "../../common/office/preview";
import type { PrismaService } from "../../prisma/prisma.service";

import {
  LIBRARY_PREVIEW_PAGES,
  LibraryPreviewProcessor,
  type LibraryPreviewJob,
} from "./library-preview.processor";

jest.mock("../../common/office/convert-to-pdf", () => ({
  ...jest.requireActual<object>("../../common/office/convert-to-pdf"),
  convertToPdf: jest.fn(),
}));
jest.mock("../../common/office/preview", () => ({
  ...jest.requireActual<object>("../../common/office/preview"),
  renderPreviewPages: jest.fn(),
}));

const mockedConvert = jest.mocked(convertToPdf);
const mockedRender = jest.mocked(renderPreviewPages);

describe("LibraryPreviewProcessor", () => {
  const job = { data: { itemId: "i-1" } } as Job<LibraryPreviewJob>;

  const build = (item: unknown) => {
    const prisma = {
      contentLibraryItem: {
        findUnique: jest.fn().mockResolvedValue(item),
        update: jest.fn(),
      },
    };
    const storage = {
      read: jest.fn().mockResolvedValue(Buffer.from("file")),
      upload: jest.fn(),
    };
    const processor = new LibraryPreviewProcessor(
      prisma as unknown as PrismaService,
      storage as never,
    );
    return { processor, prisma, storage };
  };

  const ITEM = {
    id: "i-1",
    fileUrl: "froms/Sale Deed.docx",
    previewOfFile: null,
    previewPageCount: 0,
  };

  beforeEach(() => {
    mockedConvert.mockResolvedValue(Buffer.from("pdf"));
    mockedRender.mockResolvedValue([Buffer.from("p1"), Buffer.from("p2")]);
  });
  afterEach(() => jest.clearAllMocks());

  it("renders the first pages, stores them, and records which file they show", async () => {
    const { processor, prisma, storage } = build(ITEM);

    await expect(processor.process(job)).resolves.toBe("rendered");

    expect(mockedConvert).toHaveBeenCalledWith(Buffer.from("file"), ".docx");
    expect(mockedRender).toHaveBeenCalledWith(
      Buffer.from("pdf"),
      LIBRARY_PREVIEW_PAGES,
    );
    expect(storage.upload.mock.calls.map(([key]) => key as string)).toEqual([
      "library-previews/i-1/page-1.png",
      "library-previews/i-1/page-2.png",
    ]);
    expect(prisma.contentLibraryItem.update).toHaveBeenCalledWith({
      where: { id: "i-1" },
      data: { previewOfFile: "froms/Sale Deed.docx", previewPageCount: 2 },
    });
  });

  it("does nothing when the excerpt is already of this file", async () => {
    const { processor, storage } = build({
      ...ITEM,
      previewOfFile: ITEM.fileUrl,
      previewPageCount: 2,
    });

    await expect(processor.process(job)).resolves.toBe("current");
    expect(storage.read).not.toHaveBeenCalled();
  });

  // The same broken file fails the same way every time.
  it("records 'no preview' for a file that can't be converted, rather than retrying", async () => {
    mockedConvert.mockRejectedValue(
      new Error("source file could not be loaded"),
    );
    const { processor, prisma } = build(ITEM);

    await expect(processor.process(job)).resolves.toBe("unrenderable");
    expect(prisma.contentLibraryItem.update).toHaveBeenCalledWith({
      where: { id: "i-1" },
      data: { previewOfFile: "froms/Sale Deed.docx", previewPageCount: 0 },
    });
  });

  it("lets a storage failure throw, so the queue retries it", async () => {
    const { processor, storage } = build(ITEM);
    storage.read.mockRejectedValue(new Error("R2 unreachable"));

    await expect(processor.process(job)).rejects.toThrow("R2 unreachable");
  });
});
