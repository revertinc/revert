import express, { Request, Response } from "express";
import { WorkflowNode } from "../models/workflowNode";
import workflowService from "../services/workflow";

const workflowRouter = express.Router();

// Create a DAG workflow
workflowRouter.post("/dag", async (req: Request, res: Response) => {
  res.send(await workflowService.createOrUpdate(req.body));
});

// Trigger a DAG workflow
workflowRouter.post("/trigger/dag", async (req: Request, res: Response) => {
  const workflowId = req.body.workflowId;
  res.send(await workflowService.triggerDAG(workflowId));
});

// Trigger a DAG workflow with Path (POST)
workflowRouter.post("/trigger/:path", async (req: Request, res: Response) => {
  try {
    const path = req.params.path;
    const data = req.body;
    const requestHeaders = req.headers;
    const rootNode = await WorkflowNode.findOne({
      "data.webhook.path": path,
    });
    if (rootNode && rootNode.data?.webhook?.method === "POST") {
      res
        .set(rootNode.data?.webhook.headers)
        .status(200)
        .send(
          await workflowService.triggerWebhookWorkflow(
            requestHeaders,
            rootNode.data?.webhook!,
            rootNode,
            data
          )
        );
      return;
    }
    res.send({ message: "Error: Workflow not found" });
  } catch (error) {
    console.error("webhookError", error);
    res.send({ message: "Error: Workflow could not be triggered" });
  }
});

// Trigger a DAG workflow with Path (GET)
workflowRouter.get("/trigger/:path", async (req: Request, res: Response) => {
  try {
    const path = req.params.path;
    const data = req.query;
    const requestHeaders = req.headers;
    const rootNode = await WorkflowNode.findOne({
      "data.webhook.path": path,
    });
    if (rootNode && rootNode.data?.webhook?.method === "GET") {
      res
        .set(rootNode.data?.webhook.headers)
        .status(200)
        .send(
          await workflowService.triggerWebhookWorkflow(
            requestHeaders,
            rootNode.data?.webhook!,
            rootNode,
            data
          )
        );
      return;
    }
    res.send({ message: "Error: Workflow not found" });
  } catch (error) {
    console.error("webhookError", error);
    res.send({ message: "Error: Workflow could not be triggered" });
  }
});

// Read a workflow
workflowRouter.post("/get", async (req: Request, res: Response) => {
  const workflowId = req.body.id;
  res.send(await workflowService.read(workflowId));
});

// Read all workflow
workflowRouter.post("/all", async (req: Request, res: Response) => {
  const workspaceId = req.body.workspaceId;
  res.send(await workflowService.readAll(workspaceId));
});

// Delete a workflow
workflowRouter.delete("/", (_req: Request, res: Response) => {
  res.send("Workflow deleted");
});

// Update workflow deployment
workflowRouter.put("/status", async (req: Request, res: Response) => {
  const workflowId = req.body.id;
  const status = req.body.status;
  res.send(await workflowService.updateDeploymentStatus(workflowId, status));
});

// Fork a workflow
workflowRouter.post("/fork", async (req: Request, res: Response) => {
  const workflowId = req.body.id;
  const workspaceId = req.body.workspaceId;
  res.send(await workflowService.fork(workflowId, workspaceId));
});

export default workflowRouter;
