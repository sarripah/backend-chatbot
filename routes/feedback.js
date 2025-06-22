const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware"); // ⬅️ tambahkan ini

// GET semua feedback (admin only)
router.get("/", authenticateToken, (req, res) => {
  const stmt = req.db.prepare("SELECT * FROM feedback ORDER BY created_at DESC");
  const feedbacks = stmt.all();
  res.json(feedbacks);
});

// POST simpan feedback baru (public)
router.post("/", (req, res) => {
  const { nama, isi_feedback } = req.body;
  if (!nama || !isi_feedback) {
    return res.status(400).json({ error: "Nama dan isi feedback wajib diisi." });
  }

  const stmt = req.db.prepare("INSERT INTO feedback (nama, isi_feedback) VALUES (?, ?)");
  const result = stmt.run(nama, isi_feedback);

  res.status(201).json({
    message: "Feedback berhasil disimpan!",
    data: { id: result.lastInsertRowid, nama, isi_feedback }
  });
});

// GET feedback by ID (bebas dulu)
router.get("/:id", (req, res) => {
  const stmt = req.db.prepare("SELECT * FROM feedback WHERE id = ?");
  const feedback = stmt.get(req.params.id);

  if (!feedback) {
    return res.status(404).json({ message: "Feedback tidak ditemukan!" });
  }

  res.json(feedback);
});

// PUT update feedback (bebas dulu)
router.put("/:id", (req, res) => {
  const { nama, isi_feedback } = req.body;
  if (!nama || !isi_feedback) {
    return res.status(400).json({ error: "Nama dan isi feedback wajib diisi." });
  }

  const stmt = req.db.prepare("UPDATE feedback SET nama = ?, isi_feedback = ? WHERE id = ?");
  const result = stmt.run(nama, isi_feedback, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: "Feedback tidak ditemukan!" });
  }

  res.json({ message: "Feedback berhasil diperbarui!" });
});

// DELETE feedback (admin only)
router.delete("/:id", authenticateToken, (req, res) => {
  const stmt = req.db.prepare("DELETE FROM feedback WHERE id = ?");
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: "Feedback tidak ditemukan!" });
  }

  res.json({ message: "Feedback berhasil dihapus!" });
});

module.exports = router;
