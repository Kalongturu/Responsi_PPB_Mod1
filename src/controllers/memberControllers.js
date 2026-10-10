import { MemberModel } from "../models/memberModels.js";
import { createCrudController } from "../utils/crud.js";

export const MemberController = createCrudController({
  model: MemberModel,
  label: "Anggota",
  fields: ["name", "email", "phone"],
  required: ["name"],
});
