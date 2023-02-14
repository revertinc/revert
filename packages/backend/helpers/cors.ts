import { Request, Response } from "express";

const corsMiddleware = () => (req: Request, res: Response, next: () => any) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://app.buildwithforest.com",
    "https://www.revert.dev",
    "https://revert.dev",
    "https://app.revert.dev",
    "*",
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "*");

  return next();
};

export default corsMiddleware;
