import mongoose from "mongoose";
import { NODE_TYPE } from "../types";

const registeredAppSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: NODE_TYPE,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  module: {
    type: String,
    required: true,
  },
});
const RegisteredApp = mongoose.model("RegisteredApp", registeredAppSchema);

export { RegisteredApp };
