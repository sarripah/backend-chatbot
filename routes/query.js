import express from "express";
import { htmlToText } from "html-to-text";
import { ChatGroq } from "@langchain/groq";

const router = express.Router();

/**
 * Fungsi cosine similarity
 */
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

/**
 * Ubah buffer dari SQLite ke array
 */
function parseEmbeddingBuffer(buffer) {
  return JSON.parse(buffer.toString());
}

router.post("/", async (req, res) => {
  const { userQuery } = req.body;

  if (!userQuery) {
    return res.status(400).json({ error: "Parameter userQuery wajib diisi" });
  }

  try {
    // 1. Embedding query dari user
    const queryEmbedding = await req.embedder.embedQuery(htmlToText(userQuery));

    // 2. Ambil semua dokumen dari database
    const stmt = req.db.prepare("SELECT * FROM documents");
    const allDocs = stmt.all();

    // 3. Hitung similarity tiap dokumen
    const rankedDocs = allDocs
      .map((doc) => {
        const embeddingArray = parseEmbeddingBuffer(doc.embedding);
        const similarity = cosineSimilarity(queryEmbedding, embeddingArray);
        return { ...doc, similarity };
      })
      .filter(doc => doc.similarity >= 0.15) // threshold
      .sort((a, b) => b.similarity - a.similarity);

    // 4. Gabungkan konten dokumen yang relevan
    const context = rankedDocs
      .map((doc) => htmlToText(doc.konten, { wordwrap: false }))
      .join("\n");

    // 5. Siapkan dan panggil LLM Groq
    const llm = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.2,
    });

    const response = await llm.invoke([
      {
        role: "system",
        content: `
Kamu adalah asisten cerdas untuk Unit Layanan Terpadu (ULT) 
UPN "Veteran" Jakarta. Jawab pertanyaan berikut berdasarkan 
konteks dokumen yang diberikan di bawah ini:

${context}

- Jawab hanya jika jawabannya secara eksplisit ada dalam konteks di atas.
- Jangan menambahkan informasi tambahan di luar konteks.
- Jika tidak ada jawaban yang sesuai, jawab:

"Maaf tidak ada jawaban untuk pertanyaan tersebut, silakan hubungi admin ULT [Nomor WA]."
        `.trim(),
      },
      {
        role: "user",
        content: userQuery,
      },
    ]);

  res.json({ response: response.content });


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

export default router ;