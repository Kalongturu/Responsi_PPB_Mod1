export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Tanggal hari ini (YYYY-MM-DD) menurut WIB
export const todayJakarta = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

export const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

export const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const parseId = (value, label = "id") => {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1) {
    throw new HttpError(400, `${label} harus berupa bilangan bulat positif`);
  }
  return Number(value);
};

export const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

// Menerjemahkan error Supabase/Postgres menjadi respons HTTP yang tepat
export const sendError = (res, err) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  switch (err?.code) {
    case "PGRST116":
      return res.status(404).json({ error: "Data tidak ditemukan" });
    case "23505":
      return res.status(409).json({
        error: err.message?.includes("loans_one_active_per_book")
          ? "Buku ini sedang dipinjam dan belum dikembalikan"
          : "Data duplikat: nilai unik sudah digunakan",
      });
    case "23503":
      return res.status(409).json({
        error: "Anggota/buku tidak ditemukan, atau data ini masih dipakai oleh data lain",
      });
    case "23514":
      return res.status(400).json({
        error: "Data melanggar aturan validasi (periksa tanggal dan status)",
      });
    case "22P02":
      return res.status(400).json({ error: "Format data tidak valid" });
    default:
      console.error(err);
      return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};
