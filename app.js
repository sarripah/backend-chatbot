require("dotenv/config");
const express = require("express");
const cors = require("cors");
const path = require("path");

const { HuggingFaceTransformersEmbeddings } = require("@langchain/community/embeddings/hf_transformers");
const Database = require("better-sqlite3");

const documentsRoutes = require("./routes/documents");
const queryRoutes = require("./routes/query");
const feedbackRoutes = require("./routes/feedback");
const loginRoutes = require("./routes/login");

const DB_PATH = path.resolve(__dirname, "db", "chatbot.sqlite3");

const app = express();
app.use(cors());
app.use(express.json());

let db;
let embedder;

function initDb() {
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT,
      konten TEXT,
      embedding BLOB
    );
  `);

   db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      isi_feedback TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  return db;
}

async function initialize() {
  db = initDb();
  embedder = new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-MiniLM-L6-v2",
  });

  // Kirim ke route dengan akses global
  app.use((req, res, next) => {
    req.db = db;
    req.embedder = embedder;
    next();
  });

  app.use("/documents", documentsRoutes);
  app.use("/query", queryRoutes);
  app.use("/feedback", feedbackRoutes);
  app.use("/login", loginRoutes);
}

module.exports = {
  app,
  initialize,
};
