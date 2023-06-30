import { SessionData } from "express-session";

declare module "express-session" {
  interface SessionData {
    userId: { [key: string]: any };
    email: any; //not safe, review
  }
}
