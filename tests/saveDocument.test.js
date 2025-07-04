import { describe, test, it, expect, vi } from "vitest";
import { saveDocument } from '../utils/saveDocument.js';
import { Document } from 'langchain/document';

describe('saveDocument()', () => {
  it('harus menyimpan dokumen dan mengembalikan ID', async () => {
    const mockDB = {
      prepare: vi.fn().mockReturnValue({
        run: vi.fn().mockReturnValue({ lastInsertRowid: 99 }),
      }),
    };

    const mockEmbedder = {
      embedQuery: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    };

    const doc = new Document({
      pageContent: "Ini isi dokumen.",
      metadata: { judul: "Judul Test" },
    });

    const result = await saveDocument(mockDB, doc, mockEmbedder);
    expect(result).toBe(99);
  });
});