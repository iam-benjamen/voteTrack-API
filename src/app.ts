import express, { Express, Request, Response } from "express";
import middleware from "./utils/middleware";
import userRouter from "./routes/userRoutes";

const app: Express = express();

// Middleware
app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.errorHandler);

//Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello world!");
});

app.use("/users", userRouter);

app.use(middleware.unknownEndpoint);

export default app;
