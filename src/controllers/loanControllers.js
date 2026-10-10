import { LoanModel } from "../models/loanModels.js";
import {
  HttpError,
  addDays,
  isValidDate,
  parseId,
  sendError,
  todayJakarta,
} from "../utils/helpers.js";

const LOAN_DURATION_DAYS = 7; // lama pinjam default bila due_date tidak dikirim

const STATUS_FILTERS = {
  dipinjam: "Dipinjam",
  dikembalikan: "Dikembalikan",
  terlambat: "Terlambat",
};

const assertDate = (value, label) => {
  if (!isValidDate(value)) {
    throw new HttpError(400, `${label} harus berformat YYYY-MM-DD yang valid`);
  }
};

const cleanNotes = (value) =>
  typeof value === "string" ? value.trim() || null : null;

function buildCreatePayload(body) {
  const b = body ?? {};
  const member_id = parseId(b.member_id, "member_id");
  const book_id = parseId(b.book_id, "book_id");

  const loan_date = b.loan_date ?? todayJakarta();
  assertDate(loan_date, "loan_date");

  const due_date = b.due_date ?? addDays(loan_date, LOAN_DURATION_DAYS);
  assertDate(due_date, "due_date");
  if (due_date < loan_date) {
    throw new HttpError(400, "due_date tidak boleh lebih awal dari loan_date");
  }

  return { member_id, book_id, loan_date, due_date, status: "Dipinjam", notes: cleanNotes(b.notes) };
}

function buildUpdatePayload(body) {
  const b = body ?? {};
  const p = {};

  if (b.member_id !== undefined) p.member_id = parseId(b.member_id, "member_id");
  if (b.book_id !== undefined) p.book_id = parseId(b.book_id, "book_id");
  for (const key of ["loan_date", "due_date"]) {
    if (b[key] !== undefined) {
      assertDate(b[key], key);
      p[key] = b[key];
    }
  }
  if (p.loan_date && p.due_date && p.due_date < p.loan_date) {
    throw new HttpError(400, "due_date tidak boleh lebih awal dari loan_date");
  }
  if (b.notes !== undefined) p.notes = cleanNotes(b.notes);

  if (b.status !== undefined) {
    if (b.status === "Terlambat") {
      throw new HttpError(
        400,
        "Status Terlambat dihitung otomatis dari due_date. Gunakan Dipinjam atau Dikembalikan"
      );
    }
    if (!["Dipinjam", "Dikembalikan"].includes(b.status)) {
      throw new HttpError(400, "status harus Dipinjam atau Dikembalikan");
    }
    p.status = b.status;
  }

  // Mengisi return_date dianggap sebagai pengembalian buku
  if (b.return_date != null) {
    assertDate(b.return_date, "return_date");
    if (p.status === "Dipinjam") {
      throw new HttpError(400, "return_date tidak boleh diisi untuk status Dipinjam");
    }
    p.status = "Dikembalikan";
    p.return_date = b.return_date;
  }
  if (p.status === "Dikembalikan") p.return_date ??= todayJakarta();
  if (p.status === "Dipinjam") p.return_date = null;

  if (Object.keys(p).length === 0) {
    throw new HttpError(400, "Tidak ada field yang diperbarui");
  }
  return p;
}

export const LoanController = {
  async getAll(req, res) {
    try {
      const { status, member_id, book_id } = req.query;
      const filters = {};

      if (status !== undefined) {
        const normalized = STATUS_FILTERS[String(status).toLowerCase()];
        if (!normalized) {
          throw new HttpError(
            400,
            "status harus salah satu dari: Dipinjam, Dikembalikan, Terlambat"
          );
        }
        filters.status = normalized;
      }
      if (member_id !== undefined) filters.member_id = parseId(member_id, "member_id");
      if (book_id !== undefined) filters.book_id = parseId(book_id, "book_id");

      res.json(await LoanModel.getAll(filters));
    } catch (err) {
      sendError(res, err);
    }
  },

  async getById(req, res) {
    try {
      res.json(await LoanModel.getById(parseId(req.params.id)));
    } catch (err) {
      sendError(res, err);
    }
  },

  async create(req, res) {
    try {
      res.status(201).json(await LoanModel.create(buildCreatePayload(req.body)));
    } catch (err) {
      sendError(res, err);
    }
  },

  async update(req, res) {
    try {
      const id = parseId(req.params.id);
      res.json(await LoanModel.update(id, buildUpdatePayload(req.body)));
    } catch (err) {
      sendError(res, err);
    }
  },

  async remove(req, res) {
    try {
      await LoanModel.remove(parseId(req.params.id));
      res.json({ message: "Data peminjaman berhasil dihapus" });
    } catch (err) {
      sendError(res, err);
    }
  },
};
