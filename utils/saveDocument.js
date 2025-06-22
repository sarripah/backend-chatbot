const { htmlToText } = require("html-to-text");

async function saveDocument(db, doc, embedder) {
  const combinedText = `${doc.metadata.judul}\n${htmlToText(doc.pageContent, {
    wordwrap: false,
  })}`;
  const embedding = await embedder.embedQuery(combinedText);
  const embeddingBuffer = Buffer.from(JSON.stringify(embedding));

  const insert = db.prepare(
    "INSERT INTO documents (judul, konten, embedding) VALUES (?, ?, ?)"
  );
  const info = insert.run(doc.metadata.judul, doc.pageContent, embeddingBuffer);

  return info.lastInsertRowid;
}

module.exports = {
  saveDocument,
};
