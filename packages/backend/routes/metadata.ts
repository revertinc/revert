import createConnectionPool, { sql } from "@databases/pg";
import express from "express";
import config from "../config";

const metadataRouter = express.Router();

metadataRouter.get("/crms", async (req, res) => {
  const { "x-revert-token": token } = req.headers;

  if (!token) {
    res.status(401).send({
      error: "Api token unauthorized",
    });
    return;
  }
  const db = createConnectionPool(config.PGSQL_URL);
  try {
    const account = await db.query(
      sql`select * from accounts where token = ${token}`
    );
    if (!account || !account.length) {
      res.status(401).send({
        error: "Api token unauthorized",
      });

      return;
    }
    res.send({
      status: "ok",
      data: [
        {
          integrationId: "hubspot",
          name: "Hubspot",
          imageSrc:
            "https://res.cloudinary.com/dfcnic8wq/image/upload/v1673863171/Revert/Hubspot%20logo.png",
          status: "active",
        },
        {
          integrationId: "zohocrm",
          name: "Zoho CRM",
          imageSrc:
            "https://res.cloudinary.com/dfcnic8wq/image/upload/v1674053823/Revert/zoho-crm-logo_u9889x.jpg",
          status: "active",
        },
        {
          integrationId: "sfdc",
          name: "Salesforce",
          imageSrc:
            "https://res.cloudinary.com/dfcnic8wq/image/upload/c_fit,h_20,w_70/v1673887647/Revert/SFDC%20logo.png",
          status: "active",
        },
      ],
    });
  } catch (error) {
    console.error("Could not update db", error);
  } finally {
    await db.dispose();
  }
});

export default metadataRouter;
