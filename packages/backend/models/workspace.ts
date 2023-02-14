import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    account: {
      type: String,
      required: true,
    },
    oauth: [Object],
    skipWaitlist: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const Workspace = mongoose.model("Workspace", workspaceSchema);

export { Workspace };
