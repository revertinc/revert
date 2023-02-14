import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
  },
  workspace: {
    type: String,
    required: true,
  },
});
const Account = mongoose.model("Account", accountSchema);

export { Account };
