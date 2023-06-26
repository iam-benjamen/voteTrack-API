import express, { Express, Request, Response } from "express";
import middleware from "./utils/middleware";

const app: Express = express();

//Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello world!");
});

// Middleware
app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;
