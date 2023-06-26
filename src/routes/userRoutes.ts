import authController from "../controller/authController";
import express from "express";

const userRouter = express.Router();

userRouter.post("/signup", authController.register);
userRouter.post("/login", authController.login);

export default userRouter;
