import session from "express-session";
import MongoStore from "connect-mongo";

export default session({
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
});
