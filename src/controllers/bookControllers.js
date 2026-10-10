import { BookModel } from "../models/bookModels.js";
import { createCrudController } from "../utils/crud.js";

export const BookController = createCrudController({
  model: BookModel,
  label: "Buku",
  fields: ["title", "author", "isbn"],
  required: ["title", "author"],
});
