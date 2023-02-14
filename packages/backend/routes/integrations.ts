import express from "express";

const integrationsRouter = express.Router();

integrationsRouter.post("/slack/interactive", (req, res) => {
  // TODO: Add logic here
  console.log("Interactive payload", req.body);
  res.send({
    status: "ok",
  });
});

export default integrationsRouter;
