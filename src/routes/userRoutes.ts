import authController from "../controller/authController";
import userController from "../controller/userController";
import express from "express";

const userRouter = express.Router();

userRouter.get(
  "/all-voters",
  authController.protect,
  userController.isRestrictedTo("super_admin"),
  userController.getAllVoters
);

userRouter.get(
  "/admin-voters",
  authController.protect,
  userController.isRestrictedTo("admin"),
  userController.getAdminVoters
);

userRouter.get(
  "/user-profile",
  authController.protect,
  userController.getUserProfile
);

userRouter.get(
  "/become-admin",
  authController.protect,
  userController.isRestrictedTo("regular_user"),
  userController.becomeAdmin
);

export default userRouter;
