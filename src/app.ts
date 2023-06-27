import express, { Express, Request, Response } from "express";
import middleware from "./utils/middleware";
import authRouter from "./routes/authRoutes";

const app: Express = express();

app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world!");
});

app.use("/auth", authRouter);
app.use(middleware.unknownEndpoint);

export default app;
