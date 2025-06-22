import express from "express";
import cors from "cors";
import path from "path";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import Database from "better-sqlite3";
import documentsRoutes from "./routes/documents.js";
import queryRoutes from "./routes/query.js";
import feedbackRoutes from "./routes/feedback.js";
import loginRoutes from "./routes/login.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, "db", "chatbot.sqlite3");

const app = express();
app.use(cors({
  origin: 'https://frontend-chatbot-ten.vercel.app', // ganti dengan domain frontend
  credentials: true,
}));
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

export { app, initialize };
