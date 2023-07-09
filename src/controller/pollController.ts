import { Request, Response, NextFunction } from "express";
import { Poll, PollField, PollModel, Vote } from "../models/polls";
import asyncHandler from "../utils/asynchandler";
import { UserModel, UserRole } from "../models/user";
import { Schema } from "mongoose";

interface UserUpdateFields {
  name: string;
  description: string;
  fields: PollField;
}

const createPoll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      description,
      fields,
      options,
      startDate,
      expirationDate,
      isInviteOnly,
    } = req.body;

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
        isInviteOnly,
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


//cron schedule function to update active status of polls
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

//update poll
const updatePoll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user._id;
    const { pollId } = req.params;

    const allowedFields: (keyof UserUpdateFields)[] = [
      "name",
      "description",
      "fields",
    ];

    const updates: Partial<UserUpdateFields> = {};

    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    }

    try {
      const poll: Poll | null = await PollModel.findById(pollId);

      if (!poll) {
        return res.status(404).json({
          status: false,
          message: "Poll not found",
        });
      }

      //don't update poll that is already active
      if (poll.active) {
        return res.status(400).json({
          status: false,
          message: "Cannot update an active poll",
        });
      }

      //ensure poll is only updated by creator
      if (poll.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
          status: false,
          message: "Not Authorized",
        });
      }

      //update poll fields
      await poll.updateOne(updates);

      return res.status(200).json({
        status: true,
        message: "Poll updated sucessfully",
      });
    } catch (err: any) {
      console.log(err);
      res.status(500).json({ status: false, message: err.message });
    }
  }
);


//vote
const participateInPoll = asyncHandler(async (req: Request, res: Response) => {
  const userId: Schema.Types.ObjectId = req.user._id;
  const votes: Vote["vote"] = req.body;
  const { pollId } = req.params;

  try {
    // Check if the poll exists
    const poll = await PollModel.findById(pollId);

    if (!poll) {
      return res.status(404).json({
        status: false,
        message: "Poll not found",
      });
    }

    // Check if the poll is closed for voting
    if (!poll.active) {
      return res.status(403).json({
        status: false,
        message: "Voting is closed for this poll",
      });
    }

    // Check if the user has already voted in this poll
    if (poll.votes.find((entry) => String(entry.userId) === String(userId))) {
      return res.status(400).json({
        status: false,
        message: "You have already voted in this poll",
      });
    }

    // Check if the poll is invite-only
    if (poll.isInviteOnly) {
      return res.status(403).json({
        status: false,
        message: "Access denied. This poll is invite-only",
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    //cast vote
    poll.votes.push({ userId: userId, vote: votes });
    poll.save();

    return res.status(200).json({
      status: true,
      message: "Participation confirmed",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});


//invite voters
//Live result
//Final result


export default {
  createPoll,
  updateActiveStatus,
  getAllPolls,
  getAdminPolls,
  updatePoll,
  participateInPoll,
};
