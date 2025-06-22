import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// Static admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password123";

router.post("/", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Username atau password salah" });
  }
});

export default router ;