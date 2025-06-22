import express from "express";
import { Document } from "langchain/document";
import { htmlToText } from "html-to-text";
import { saveDocument } from "../utils/saveDocument.js";
import authenticateToken from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔍 Ambil semua dokumen (hanya untuk admin)
router.get("/", authenticateToken, (req, res) => {
  const stmt = req.db.prepare("SELECT id, judul, konten FROM documents");
  const rows = stmt.all();
  res.json(rows);
});

// ➕ Tambah dokumen baru (hanya untuk admin)
router.post("/", authenticateToken, async (req, res) => {
  const { judul, konten } = req.body;
  const db = req.db;
  const embedder = req.embedder;

  if (!judul || !konten) {
    return res.status(400).json({ error: "'judul' dan 'konten' wajib diisi." });
  }

  try {
    const doc = new Document({
      pageContent: konten,
      metadata: { judul },
    });

    const insertedId = await saveDocument(db, doc, embedder);
    res.status(201).json({
      message: "Dokumen berhasil disimpan",
      id: insertedId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan dokumen" });
  }
});

// ✏️ Update dokumen (hanya untuk admin)
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { judul, konten } = req.body;
  const db = req.db;
  const embedder = req.embedder;

  if (!judul || !konten) {
    return res.status(400).json({ error: "'judul' dan 'konten' wajib diisi." });
  }

  try {
    const cleanText = htmlToText(konten, { wordwrap: false });
    const embedding = await embedder.embedQuery(cleanText);
    const embeddingBuffer = Buffer.from(JSON.stringify(embedding));

    const stmt = db.prepare(
      "UPDATE documents SET judul = ?, konten = ?, embedding = ? WHERE id = ?"
    );
    const result = stmt.run(judul, konten, embeddingBuffer, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan." });
    }

    res.json({ message: "Dokumen berhasil diperbarui" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui dokumen" });
  }
});

// ❌ Hapus dokumen (hanya untuk admin)
router.delete("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = req.db;

  try {
    const stmt = db.prepare("DELETE FROM documents WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan." });
    }

    res.json({ message: "Dokumen berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus dokumen" });
  }
});

export default router ;
