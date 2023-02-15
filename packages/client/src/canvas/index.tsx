import { useState, useCallback, useMemo, useRef } from "react";
import ReactFlow, { ReactFlowProvider } from "react-flow-renderer";

import { Controls, Background } from "react-flow-renderer";
import CodeNode from "./nodes/code";
import CronNode from "./nodes/cron";
import SlackNode from "./nodes/integrations/slack";
import PostgresNode from "./nodes/integrations/postgres";
import GmailNode from "./nodes/integrations/gmail";
import Sidebar from "./Sidebar";
import "./index.css";
import { nanoid } from "nanoid";
import useStore, { useAppStore } from "../store";
import ApiNode from "./nodes/api";
import WebhookNode from "./nodes/webhook";
import React from "react";

const getId = (type) => type + "_" + nanoid();

function Flow() {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const workspaceId = useAppStore((state) => state.workspaceId);
  const currentWorkflowData = useAppStore((state) => state.currentWorkflowData);
  const isSameWorkspace = useMemo(() => {
    return (
      currentWorkflowData === undefined ||
      currentWorkflowData?.workspaceId === workspaceId
    );
  }, [workspaceId, currentWorkflowData]);

  const nodeTypes = useMemo(
    () => ({
      CODE_JS: CodeNode,
      CRON: CronNode,
      API: ApiNode,
      WEBHOOK: WebhookNode,
      INTEGRATION_SLACK: SlackNode,
      INTEGRATION_POSTGRES: PostgresNode,
      INTEGRATION_GMAIL: GmailNode,
    }),
    []
  );
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setSelection,
    setIsMoving,
  } = useStore();

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!isSameWorkspace) return;

      const reactFlowBounds =
        reactFlowWrapper?.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const label = event.dataTransfer.getData("application/reactflow/label");
      const data = event.dataTransfer.getData("application/reactflow/data");
      // check if the dropped element is valid
      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance?.project({
        x: event.clientX - reactFlowBounds!.left,
        y: event.clientY - reactFlowBounds!.top,
      });
      const newNode = {
        id: getId(type),
        type,
        position,
        data: {
          label: label,
          ...JSON.parse(data),
        },
      };

      setNodes(newNode);
    },
    [reactFlowInstance, setNodes, isSameWorkspace]
  );
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <>
      <Sidebar />
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          onSelectionChange={(params) =>
            setSelection(params.nodes, params.edges)
          }
          onNodeDrag={() => setIsMoving(true)}
          onNodeDragStop={() => setIsMoving(false)}
          onMoveEnd={() => setIsMoving(false)}
          onMove={() => setIsMoving(true)}
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={isSameWorkspace ? onNodesChange : undefined}
          onEdgesChange={isSameWorkspace ? onEdgesChange : undefined}
          onConnect={onConnect}
          defaultPosition={[600, 350]}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          selectNodesOnDrag={true}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </>
  );
}

function FlowWithProvider() {
  return (
    <div className="dndflow">
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </div>
  );
}
export default FlowWithProvider;
