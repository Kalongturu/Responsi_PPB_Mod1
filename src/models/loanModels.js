import { supabase } from "../config/supabaseClient.js";
import { HttpError, todayJakarta } from "../utils/helpers.js";

const SELECT = `
  id, member_id, book_id, loan_date, due_date, return_date, status, notes, created_at,
  member:members ( id, name ),
  book:books ( id, title, author )
`;

// "Terlambat" tidak disimpan di DB: dihitung dari due_date agar selalu akurat
const withStatus = (row) => ({
  ...row,
  status:
    row.status === "Dipinjam" && row.due_date < todayJakarta() ? "Terlambat" : row.status,
});

export const LoanModel = {
  async getAll({ status, member_id, book_id } = {}) {
    const today = todayJakarta();
    let query = supabase
      .from("loans")
      .select(SELECT)
      .order("loan_date", { ascending: false })
      .order("id", { ascending: false });

    if (status === "Terlambat") query = query.eq("status", "Dipinjam").lt("due_date", today);
    if (status === "Dipinjam") query = query.eq("status", "Dipinjam").gte("due_date", today);
    if (status === "Dikembalikan") query = query.eq("status", "Dikembalikan");
    if (member_id) query = query.eq("member_id", member_id);
    if (book_id) query = query.eq("book_id", book_id);

    const { data, error } = await query;
    if (error) throw error;
    return data.map(withStatus);
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("loans")
      .select(SELECT)
      .eq("id", id)
      .single();
    if (error) throw error;
    return withStatus(data);
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("loans")
      .insert([payload])
      .select(SELECT)
      .single();
    if (error) throw error;
    return withStatus(data);
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from("loans")
      .update(payload)
      .eq("id", id)
      .select(SELECT)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "Data peminjaman tidak ditemukan");
    return withStatus(data);
  },

  async remove(id) {
    const { data, error } = await supabase
      .from("loans")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data.length) throw new HttpError(404, "Data peminjaman tidak ditemukan");
  },
};
