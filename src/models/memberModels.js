import { createCrudModel } from "../utils/crud.js";

export const MemberModel = createCrudModel("members", "id, name, email, phone, created_at");
