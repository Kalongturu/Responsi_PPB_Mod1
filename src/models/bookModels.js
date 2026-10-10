import { createCrudModel } from "../utils/crud.js";

export const BookModel = createCrudModel("books", "id, title, author, isbn, created_at");
