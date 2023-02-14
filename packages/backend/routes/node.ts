import express from "express";
import { WorkflowNode } from "../models/workflowNode";
import { executeNode } from "../services/workflow";

const nodeRouter = express.Router();

nodeRouter.post("/execute", async (req, res) => {
  // TODO: 1. Add logs here 2. Store execution results somewhere temporarily.
  const input = req.body.input;
  const nodeId = req.body.nodeId;
  const workspaceId = req.body.workspaceId;
  const node = await WorkflowNode.findOne({ id: nodeId });
  console.log("Interactive payload", req.body, node);
  const queryNames: string[] = Object.keys(input);
  const nodeResult = await executeNode(workspaceId, node, input, queryNames);
  res.send(nodeResult);
});

export default nodeRouter;
