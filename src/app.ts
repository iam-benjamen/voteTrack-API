import express, { Express, Request, Response } from "express";
import pollController from "./controller/pollController";
import session from "express-session";
import cron from "node-cron";
import MongoStore from "connect-mongo";
import middleware from "./utils/middleware";
import authRouter from "./routes/authRoutes";
import userRouter from "./routes/userRoutes";
import pollsRouter from "./routes/pollRoutes";

const app: Express = express();

app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.errorHandler);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "MY_SECRET_KEY",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DB_URL,
      collectionName: "voteTrack-sessions",
    }),
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("voteTrack!");
});

// Schedule the function to run every minute
cron.schedule("* * * * *", pollController.updateActiveStatus);

app.use("/auth", authRouter);
app.use("/voter", userRouter);
app.use("/poll", pollsRouter);
app.use(middleware.unknownEndpoint);

export default app;
