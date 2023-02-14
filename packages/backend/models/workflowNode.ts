import mongoose from "mongoose";
import { NODE_TYPE, NODE_KIND_ENUM } from "../types";

const workflowNodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: NODE_TYPE,
    required: true,
  },
  kind: {
    type: String,
    enum: NODE_KIND_ENUM,
  },
  data: {
    functionName: {
      type: String,
    },
    webhook: {
      path: {
        type: String,
      },
      method: {
        type: String,
      },
      authData: {
        type: Object,
      },
      headers: {
        type: Object,
      },
      response: {
        type: Object,
      },
    },
    cronString: {
      type: String,
    },
    timeZone: {
      type: String,
    },
    code: {
      type: String,
    },
    label: {
      type: String,
      required: true,
    },
    request: {
      type: Object,
    },
    integration: {
      type: Object,
    },
    inputNodeIds: {
      type: [String], // Actual nodeIds
    },
    outputNodeIds: {
      type: [String], // Actual nodeIds
    },
    conditions: {
      type: [String], // Expressions that return to a boolean type
    },
  },
  neighbors: {
    type: [String], // array of NodeIds
  },
});

const WorkflowNode = mongoose.model("WorkflowNode", workflowNodeSchema);

export { WorkflowNode };
