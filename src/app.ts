import express, { Express, NextFunction, Request, Response } from "express";
import pollController from "./controller/pollController";
import session from "./utils/session";
import cron from "node-cron";
import middleware from "./utils/middleware";
import authRouter from "./routes/authRoutes";
import userRouter from "./routes/userRoutes";
import pollsRouter from "./routes/pollRoutes";
import authController from "./controller/authController";
import { measureElapsedTime } from "./utils/performance";

const app: Express = express();

app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.errorHandler);
app.use(authController.validateXAppKey);
app.use(session);
app.use(measureElapsedTime);


app.get("/", (req: Request, res: Response) => {
  res.send("voteTrack!");
});

// Schedule the function to run every minute
// cron.schedule("* * * * *", pollController.updateActiveStatus);

app.use("/auth", authRouter);
app.use("/voter", userRouter);
app.use("/poll", pollsRouter);
app.use(middleware.unknownEndpoint);

export default app;
