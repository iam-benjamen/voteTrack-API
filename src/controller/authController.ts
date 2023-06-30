import { NextFunction, Request, Response } from "express";
import nodemailer, { TransportOptions } from "nodemailer";
import { User, UserModel, UserRole } from "../models/user";
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
const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, assignedAdmin } = req.body;

    try {
      //check if email already exists
      const existingUser = await UserModel.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          status: false,
          message: "Email already exists",
        });
      }

      //create a new user with default role
      const user = new UserModel({
        name,
        email,
        password,
      });

      //generate jwt and save for confirmation
      const token = signToken(user._id);
      user.confirmationToken = token;

      //Take note of assigned admin
      const superAdmin = await UserModel.findOne({
        role: { $in: [UserRole.SuperAdmin] },
      });
      user.assignedAdmin = assignedAdmin ? assignedAdmin : superAdmin?._id;

      //save user with confirmation code to database
      await user.save();

      req.user = user;

      next();
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  }
);

//login controller
const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  //check if user exists
  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(401).json({
      status: false,
      message: "Invalid email or password",
    });
  }

  //Enforce email confirmation
  if (!user.isEmailConfirmed) {
    return res.status(401).json({
      status: false,
      message:
        "Email not confirmed. Please check your email and confirm your account",
    });
  }

  //check if password is correct
  const passswordMatch = await bcrypt.compare(password, user.password);

  if (!passswordMatch) {
    return res.status(401).json({
      status: true,
      message: "Invalid email or password",
    });
  }

  //serve session
  req.session.userId = user._id.toString();
  req.session.email = user.email;

  //generate token and send response
  const token = signToken(user._id);
  res.status(200).json({
    status: true,
    token,
  });
});

const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    //ensure auth token exists
    if (!token) {
      return res.status(401).json({ status: false, error: "Unauthorized" });
    }

    //ensure user is logged in
    if (!req.session.userId) {
      return res.status(401).json({
        status: false,
        message: "User not logged in",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        _id: string;
        iat: number;
      };

      if (!decoded) {
        return res.status(401).json({ status: false });
      }

      //ensure user exists and is logged in
      const user = await UserModel.findById(decoded._id);
      if (!user) {
        return res.status(401).json({ status: false, error: "User not found" });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ status: false, message: "Invalid token" });
    }
  }
);

const sendConfirmationEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = req.user;

    try {
      const User = await UserModel.findOne({ email });

      if (!User) {
        return res
          .status(404)
          .json({ status: false, message: "User not found" });
      }

      const confirmationToken = User?.confirmationToken;

      const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "c779f934ca4c22",
          pass: "20787f6801f004",
        },
      });

      //verify connection configuration
      transporter.verify(function (error, success) {
        if (error) {
          console.log("here", error);
        } else {
          console.log("Server is ready to take your messages");
        }
      });

      const confirmationUrl = `localhost:3000/auth/confirm-email/${confirmationToken}`;

      await transporter.sendMail({
        from: "from@example.com",
        to: "to@example.com", //should be user email in real world
        subject: "VoteTrack Email Confirmation",
        html: `Click the link below to confirm your email address:<br/><a href="${confirmationUrl}">${confirmationUrl}</a>`,
      });

      res.status(201).json({
        status: true,
        message: "Registration successful, kindly confirm your email",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to send confirmation email" });
    }
  }
);

const confirmEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const user = await UserModel.findOne({
      confirmationToken: token,
    });

    if (!user) {
      return res.status(404).json({ status: false, message: "Invalid Token" });
    }

    user.isEmailConfirmed = true;
    user.confirmationToken = "";

    await user.save();

    return res
      .status(200)
      .json({ status: true, message: "Email confirmed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Server error: Error confirming email" });
  }
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ status: false, error: "Not logged in" });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        status: false,
        message: "Server error: Error Logging out",
      });
    }
    res.status(200).json({ status: true, message: "Logout successful" });
  });
});

export default {
  register,
  login,
  protect,
  confirmEmail,
  logout,
  sendConfirmationEmail,
};
