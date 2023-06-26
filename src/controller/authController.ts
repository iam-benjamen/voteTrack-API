import { NextFunction, Request, Response } from "express";
import { UserModel } from "../models/user";
import asyncHandler from "../utils/asynchandler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//sign token
const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//signup controller
const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  //check if email already exists
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    res.status(409).json({
      status: "false",
      message: "Email already exists",
    });
  }

  //create a new user with default role
  const user = new UserModel({
    name,
    email,
    password,
  });

  //save to database
  await user.save();

  //generate jwt
  const token = signToken(user._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

//login controller
const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  //check if user exists
  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(401).json({
      status: "false",
      message: "Invalid email or password",
    });
  }

  //check if password is correct
  const passswordMatch = await bcrypt.compare(password, user.password);

  if (!passswordMatch) {
    return res.status(401).json({
      status: "false",
      message: "Invalid email or password",
    });
  }

  //generate token and send response
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ status: "false", error: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        _id: string;
        iat: number;
      };

      console.log(decoded);

      if (decoded === null) {
        return res.status(401).json({ status: false });
      }

      const user = await UserModel.findById(decoded._id);
      if (!user) {
        return res
          .status(401)
          .json({ status: "false", error: "User not found" });
      }

      // if (user.changedPasswordAfter(decoded.iat)) {
      //   return res.status(401).json({
      //     status: "fail",
      //     message: "Password changed. Please log in again.",
      //   });
      // }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ status: "fail", message: "Invalid token" });
    }
  }
);

export default {
  register,
  login,
  protect,
};
