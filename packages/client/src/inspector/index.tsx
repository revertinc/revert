import React from "react";
import useStore from "../store";
import CodeInspector from "./code/index";
import CronInspector from "./cron";
import ApiInspector from "./api";
import WebhookInspector from "./webhook";
import SlackInspector from "./integrations/slack";
import PostgresInspector from "./integrations/postgres";
import GmailInspector from "./integrations/gmail";

const showInspector = (node) => {
  switch (node.type) {
    case "CRON":
      return <CronInspector />;
    case "CODE_JS":
      return <CodeInspector language="JS" />;
    case "API":
      return <ApiInspector />;
    case "WEBHOOK":
      return <WebhookInspector />;
    case "INTEGRATION_SLACK":
      return <SlackInspector />;
    case "INTEGRATION_POSTGRES":
      return <PostgresInspector />;
    case "INTEGRATION_GMAIL":
      return <GmailInspector />;
    default:
      return <>{node.id}</>;
  }
};

const Inspector = () => {
  const { selectedNodes } = useStore();
  return selectedNodes.length > 0 ? (
    <div id="inspector" key={selectedNodes[0].id}>
      {showInspector(selectedNodes[0])}
    </div>
  ) : null;
};

export default Inspector;
