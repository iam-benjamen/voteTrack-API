import { NextFunction, Request, Response } from "express";
import nodemailer, { TransportOptions } from "nodemailer";
import { User, UserModel } from "../models/user";
import asyncHandler from "../utils/asynchandler";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

//sign token
const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//signup controller
const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    try {
      //check if email already exists
      const existingUser = await UserModel.findOne({ email });

      if (existingUser) {
        res.status(409).json({
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

      //save user with confirmation code to database
      await user.save();

      res.status(201).json({
        status: true,
        token,
        data: {
          user,
        },
      });

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

    if (!token) {
      return res.status(401).json({ status: false, error: "Unauthorized" });
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
        return res.status(401).json({ status: false, error: "User not found" });
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
      return res.status(401).json({ status: false, message: "Invalid token" });
    }
  }
);

const sendConfirmationEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

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
      // transporter.verify(function (error, success) {
      //   if (error) {
      //     console.log("here", error);
      //   } else {
      //     console.log("Server is ready to take your messages");
      //   }
      // });

      const confirmationUrl = `localhost:3000/confirm-email/${confirmationToken}`;

      await transporter.sendMail({
        from: "from@example.com",
        to: "to@example.com", //should be user email in real world
        subject: "Test message title",
        html: `Click the link below to confirm your email address:<br/><a href="${confirmationUrl}">${confirmationUrl}</a>`,
      });

      res
        .status(200)
        .json({ status: true, message: "Confirmation email sent" });
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

export default {
  register,
  login,
  protect,
  sendConfirmationEmail,
  confirmEmail,
};
