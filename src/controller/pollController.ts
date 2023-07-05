import { Request, Response, NextFunction } from "express";
import { PollModel } from "../models/polls";
import asyncHandler from "../utils/asynchandler";

const createPoll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, fields, options, startDate, expirationDate } =
      req.body;

    const currentDate = new Date();

    try {
      if (startDate) {
        if (currentDate > new Date(startDate)) {
          return res.status(400).json({
            status: false,
            message: "Active date must be in the future",
          });
        }
      }

      if (currentDate >= new Date(expirationDate)) {
        return res.status(400).json({
          status: false,
          message: "Expiration date must be in the future",
        });
      }

      const poll = new PollModel({
        name,
        description,
        fields,
        options,
        startDate,
        expirationDate,
        createdBy: req.user._id,
        active: false,
      });

      await poll.save();

      return res
        .status(201)
        .json({ status: true, message: "Poll created successfully" });
    } catch (err: any) {
      res.status(500).json({ status: false, message: err.message });
    }
  }
);

const updateActiveStatus = async () => {
  try {
    const currentDate: Date = new Date();

    //update all polls that are due
    await PollModel.updateMany(
      {
        active: false,
        startDate: { $lte: currentDate },
      },
      { active: true }
    );

    //update all polls that are expired
    await PollModel.updateMany(
      {
        active: true,
        expirationDate: { $lte: currentDate },
      },
      {
        active: false,
      }
    );

    console.log("Active status updated sucessfully");
  } catch (err) {
    console.log("Error updating active status", err);
  }
};

//get all polls(super admin)
const getAllPolls = asyncHandler(async (req: Request, res: Response) => {
  try {
    const polls = await PollModel.find();
    return res
      .status(200)
      .json({ status: true, number_of_polls: polls.length, message: polls });
  } catch (error: any) {
    res.status(500).json({ status: false, message: error.message });
  }
});

//get admin polls(polls created by admin)
const getAdminPolls = asyncHandler(async (req: Request, res: Response) => {
  try {
    const polls = await PollModel.find({ createdBy: req.user._id });
    return res
      .status(200)
      .json({ status: true, number_of_polls: polls.length, message: polls });
  } catch (error: any) {
    res.status(500).json({ status: false, message: error.message });
  }
});

//invite voters
//update poll before starting date
//vote

export default {
  createPoll,
  updateActiveStatus,
  getAllPolls, getAdminPolls
};
