import mongoose from "mongoose";
import { WorflowDeploymentStatus, WorkflowEnvironment } from "../types";

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    id: {
      type: String,
      required: true,
    },
    rootNodeId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "WorkflowNode",
    },
    nodes: {
      type: [{ type: mongoose.Types.ObjectId, ref: "WorkflowNode" }], // array of NodeIds
    },
    edges: {
      type: [{ type: Object }],
    },
    nodesUi: {
      type: [{ type: Object }],
    },
    executionOrder: [String], // Array of nodeIds.
    executionUrl: {
      type: String,
    },
    executionCronString: {
      type: String,
    },
    workspaceId: {
      type: String,
      required: true,
    },
    env: {
      type: String,
      default: WorkflowEnvironment.Prod,
      enum: WorkflowEnvironment,
    },
    deploymentStatus: {
      type: String,
      enum: WorflowDeploymentStatus,
      default: WorflowDeploymentStatus.Live,
    },
  },
  {
    timestamps: true,
  }
);
const Workflow = mongoose.model("Workflow", workflowSchema);

export { Workflow };
