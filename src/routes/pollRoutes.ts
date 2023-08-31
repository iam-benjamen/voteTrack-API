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
  userController.isRestrictedTo("super_admin"),
  pollController.getAllPolls
);

pollsRouter.get(
  "/admin-polls",
  authController.protect,
  userController.isRestrictedTo("admin"),
  pollController.getAdminPolls
);

pollsRouter.patch(
  "/update/:pollId",
  authController.protect,
  userController.isRestrictedTo("admin"),
  pollController.updatePoll
);

pollsRouter.post(
  "/vote/:pollId",
  authController.protect,
  pollController.participateInPoll
);

pollsRouter.post(
  "/add-voters",
  authController.protect,
  userController.isRestrictedTo("admin"),
  pollController.addAllowedVoters
);

pollsRouter.post(
  "/delete-poll/:pollId",
  authController.protect,
  userController.isRestrictedTo("admin"),
  pollController.deletePoll
);

pollsRouter.get(
  "/poll-results/:pollId",
  authController.protect,
  userController.isRestrictedTo("admin"),
  pollController.computePollResults
);

export default pollsRouter;
