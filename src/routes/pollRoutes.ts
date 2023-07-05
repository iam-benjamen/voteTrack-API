import authController from "../controller/authController";
import pollController from "../controller/pollController";
import userController from "../controller/userController";
import express from "express";

const pollsRouter = express.Router();

pollsRouter.post(
  "/create-poll",
  authController.protect,
  userController.isRestrictedTo("admin"),
  pollController.createPoll
);

pollsRouter.get(
  "/polls",
  authController.protect,
  userController.isRestrictedTo("admin"),
  pollController.getAllPolls
);

export default pollsRouter;
