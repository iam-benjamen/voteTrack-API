import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asynchandler";
import { UserModel } from "../models/user";

const isRestrictedTo = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user.role.includes(role)) {
      return res.status(403).json({
        status: false,
        message:
          "Access denied. You do not have permission to perform this action.",
      });
    }
    next();
  };
};

const getAllVoters = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let users;

      if (req.user.role.includes("super_admin")) {
        users = await UserModel.find();
      } else {
        return res.status(403).json({
          status: false,
          message: "Forbidden",
        });
      }

      return res.status(200).json({
        status: true,
        data: users,
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch voters" });
    }
  }
);

const getAdminVoters = asyncHandler(async (req: Request, res: Response) => {
  try {
    let users;

    if (req.user.role.includes("admin")) {
      users = await UserModel.find({ assignedAdmin: req.user._id });
    } else {
      return res.status(403).json({
        status: false,
        message: "Forbidden",
      });
    }

    return res.status(200).json({
      status: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch voters" });
  }
});

const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const user = await UserModel.findById(userId).select(
      "-confirmationToken -isEmailConfirmed -_id -assignedAdmin"
    );

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});


export default {
  isRestrictedTo,
  getAllVoters,
  getAdminVoters,
  getUserProfile,
};
