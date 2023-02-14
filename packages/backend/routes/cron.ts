import express from "express";
import cronService from "../services/cron";

const cronRouter = express.Router();

// Get cron configuration
cronRouter.get("/", async (req, res) => {
  console.log(req.body, req.params);
  const cronConfig = await cronService.read(req.body.id);
  res.send({
    data: cronConfig,
  });
});

// Create cron configuration.
cronRouter.post("/", async (req, res) => {
  try {
    await cronService.create(req.body.config);
    res.send({
      message: "Cron created with config attached",
      config: req.body.config,
    });
  } catch (error) {
    res.send({
      message: "Could not create cron",
      error: error,
    });
  }
});

// Update cron configuration.
cronRouter.put("/", async (req, res) => {
  const cronConfig = await cronService.update(req.body.config);
  res.send({
    data: cronConfig,
  });
});

// Delete cron configuration.
cronRouter.delete("/", async (req, res) => {
  await cronService.delete(req.body.id);
  res.send({
    message: `Cron id ${req.body.id} deleted`,
  });
});

// Delete cron configuration.
cronRouter.delete("/key", async (req, res) => {
  await cronService.deleteByKey(req.body.key);
  res.send({
    message: `Cron key ${req.body.key} deleted`,
  });
});

export default cronRouter;
