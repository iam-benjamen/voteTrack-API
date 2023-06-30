import express, { Express, Request, Response } from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import middleware from "./utils/middleware";
import authRouter from "./routes/authRoutes";

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
      maxAge: 0.1 * 60 * 60 * 1000,
    },
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world!");
});

app.use("/auth", authRouter);
app.use(middleware.unknownEndpoint);

export default app;
