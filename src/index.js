import express from "express";
import dotenv from "dotenv";
import memberRoutes from "./routes/memberRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API Peminjaman Buku Perpustakaan", endpoints: ["/api/members", "/api/books", "/api/loans"] });
});

app.use("/api/members", memberRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/loans", loanRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Body request bukan JSON yang valid" });
  }
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server" });
});

// Di Vercel, app diekspor sebagai handler; secara lokal dijalankan dengan listen()
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
