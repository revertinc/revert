import express from "express";
import AuthService from "../services/auth";
const authRouter = express.Router();

authRouter.post("/clerk/webhook", async (req, res) => {
  if (req.body) {
    let webhookData = req.body.data;
    let webhookEventType = req.body.type;
    res
      .status(200)
      .send(
        await AuthService.createUserOnClerkUserCreation(
          webhookData,
          webhookEventType
        )
      );
  }
});
authRouter.post("/workspace", async (req, res) => {
  res.status(200).send(await AuthService.getWorkspaceForAccount(req.body.id));
});

authRouter.post("/oauth", async (req, res) => {
  res
    .status(200)
    .send(
      await AuthService.saveOAuthDataOnWorkspace(
        req.body.workspaceId,
        req.body.oAuthData
      )
    );
});

authRouter.get("/oauth/refresh", async (_, res) => {
  res.status(200).send(await AuthService.refreshOAuthTokens());
});

export default authRouter;
