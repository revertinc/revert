import toast from "react-hot-toast";

import { BASE_API_URL } from "../constants";
import { useAppStore, useNodeExecutionStore } from "../store";

export const deployWorkflow = ({
  workflowName,
  workspaceId,
  workflowId,
  nodes,
  edges,
  env,
  deploymentStatus,
  successMessage,
}) => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const body = JSON.stringify({
    name: workflowName,
    workspaceId: workspaceId,
    workflowId: workflowId,
    nodes: nodes,
    edges: edges,
    env: env,
    deploymentStatus: deploymentStatus,
  });
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: body,
  };
  fetch(`${BASE_API_URL}/workflow/dag`, requestOptions)
    .then((response) => response.text())
    .then((result) => {
      console.log(result);
      toast.success(successMessage);
    })
    .catch((error) => {
      console.log("error", error);
      toast.error("Oops something went wrong");
    });
};

export const updateDeploymentStatus = (workflowId: string, status: string) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const body = JSON.stringify({
    id: workflowId,
    status: status,
  });
  const requestOptions = {
    method: "PUT",
    headers: headers,
    body: body,
  };
  fetch(`${BASE_API_URL}/workflow/status`, requestOptions)
    .then((response) => response.text())
    .then((result) => {
      console.log(result);
      toast.success("Workflow " + status + " !");
    })
    .catch((error) => {
      console.log("error", error);
      toast.error("Workflow deployment could not be updated!");
    });
};

export const executeNode = (nodeId: string, nodeName: string) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const workspaceId = useAppStore.getState().workspaceId;
  const body = JSON.stringify({
    workspaceId: workspaceId,
    nodeId: nodeId,
    input: {},
  });
  const requestOptions = {
    method: "POST",
    headers: headers,
    body: body,
  };
  useNodeExecutionStore.getState().setSeen(nodeId, true);
  fetch(`${BASE_API_URL}/node/execute`, requestOptions)
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      toast.success(nodeName + " ran successfully!", {
        position: "bottom-center",
      });
      useNodeExecutionStore.getState().setData(nodeId, result);
      useNodeExecutionStore.getState().setSeen(nodeId, false);
    })
    .catch((error) => {
      console.log("error", error);
      toast.error(nodeName + " ran failed!", { position: "bottom-center" });
      useNodeExecutionStore.getState().setData(nodeId, error);
    });
};
