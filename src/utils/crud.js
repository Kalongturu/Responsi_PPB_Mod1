import { supabase } from "../config/supabaseClient.js";
import { HttpError, parseId, pick, sendError } from "./helpers.js";

// Model CRUD generik untuk tabel sederhana (members, books)
export function createCrudModel(table, columns) {
  return {
    async getAll() {
      const { data, error } = await supabase.from(table).select(columns).order("id");
      if (error) throw error;
      return data;
    },

    async getById(id) {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(table)
        .insert([payload])
        .select(columns)
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .select(columns)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new HttpError(404, "Data tidak ditemukan");
      return data;
    },

    async remove(id) {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data.length) throw new HttpError(404, "Data tidak ditemukan");
    },
  };
}

// Controller CRUD generik: whitelist field, trim string, cek field wajib
export function createCrudController({ model, label, fields, required = [] }) {
  const clean = (body) => {
    const payload = pick(body ?? {}, fields);
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === "string") payload[key] = value.trim() || null;
    }
    return payload;
  };

  return {
    async getAll(req, res) {
      try {
        res.json(await model.getAll());
      } catch (err) {
        sendError(res, err);
      }
    },

    async getById(req, res) {
      try {
        res.json(await model.getById(parseId(req.params.id)));
      } catch (err) {
        sendError(res, err);
      }
    },

    async create(req, res) {
      try {
        const payload = clean(req.body);
        for (const key of required) {
          if (payload[key] == null) throw new HttpError(400, `${key} wajib diisi`);
        }
        res.status(201).json(await model.create(payload));
      } catch (err) {
        sendError(res, err);
      }
    },

    async update(req, res) {
      try {
        const id = parseId(req.params.id);
        const payload = clean(req.body);
        if (Object.keys(payload).length === 0) {
          throw new HttpError(400, "Tidak ada field yang diperbarui");
        }
        for (const key of required) {
          if (key in payload && payload[key] == null) {
            throw new HttpError(400, `${key} tidak boleh kosong`);
          }
        }
        res.json(await model.update(id, payload));
      } catch (err) {
        sendError(res, err);
      }
    },

    async remove(req, res) {
      try {
        await model.remove(parseId(req.params.id));
        res.json({ message: `${label} berhasil dihapus` });
      } catch (err) {
        sendError(res, err);
      }
    },
  };
}
