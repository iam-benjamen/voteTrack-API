import authController from "../controller/authController";
import express from "express";

const authRouter = express.Router();

authRouter.post(
  "/signup",
  authController.register,
  authController.sendConfirmationEmail
);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/confirm-email/:token", authController.confirmEmail);

export default authRouter;
