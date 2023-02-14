import express from "express";
import workflowRouter from "./workflow";
import cronRouter from "./cron";
import authRouter from "./auth";
import integrationsRouter from "./integrations";
import crmRouter from "./crm";
import nodeRouter from "./node";
import metadataRouter from "./metadata";

const router = express.Router();

router.get("/health-check", (_, response) => {
  response.send({
    status: "ok",
  });
});

router.get("/", (_, response) => {
  response.send({
    status: "nothing to see here.",
  });
});

export default router;
export {
  workflowRouter,
  cronRouter,
  authRouter,
  integrationsRouter,
  nodeRouter,
  crmRouter,
  metadataRouter,
};
