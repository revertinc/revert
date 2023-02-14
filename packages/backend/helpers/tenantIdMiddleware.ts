import createConnectionPool, { sql } from "@databases/pg";
import { Request, Response } from "express";
import config from "../config";

const revertTenantMiddleware =
  () => async (req: Request, res: Response, next: () => any) => {
    const { "x-revert-t-id": tenantId } = req.headers;
    const db = createConnectionPool(config.PGSQL_URL);
    try {
      const connection: any = await db.query(
        sql`select tp_access_token, tp_id, t_id from connections where t_id = ${tenantId}`
      );
      if (!connection || !connection.length) {
        return res.status(400).send({
          error: "Tenant not found",
        });
      }
      if (connection[0]) {
        res.locals.connection = connection[0];
      } else {
        return res.status(400).send({
          error: "Tenant not found",
        });
      }
    } catch (error) {
    } finally {
      await db.dispose();
    }

    return next();
  };

export default revertTenantMiddleware;
