import { Request, Response, NextFunction } from "express";
import { Poll, PollField, PollModel, Vote, voteResult } from "../models/polls";
import { UserModel, UserRole } from "../models/user";
import { Schema } from "mongoose";
import { AllowedVotersModel } from "../models/invited-voter";
import computePollResultFromDatabase from "../helpers/resultPipeline";
import asyncHandler from "../utils/asynchandler";

interface UserUpdateFields {
  name: string;
  description: string;
  fields: PollField;
  isInviteOnly: boolean;
}

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data?: T;
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

    console.log("Active status updated successfully");
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
      "isInviteOnly",
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

//Participate in poll

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

    //Check if the user has already voted in this poll
    if (poll.votes.find((entry) => String(entry.userId) === String(userId))) {
      return res.status(400).json({
        status: false,
        message: "You have already voted in this poll",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Check if the poll is invite only
    if (poll.isInviteOnly) {
      const allowedVoter = await AllowedVotersModel.findOne({
        pollId,
        emails: { $in: user.email },
      });

      if (!allowedVoter) {
        return res.status(403).json({
          status: false,
          message: "Sorry, You are not allowed to participate in this poll",
        });
      }
    }

    //Validate field & options Id
    //optimize this, will slow down with scale
    const fieldIds = votes.map((vote) => vote.fieldId.toString());
    const optionIds = votes.map((vote) => vote.optionId.toString());

    const validFieldsIds = poll.fields.map((field) => field._id.toString());
    const validOptionIds = poll.fields.flatMap((field) =>
      field.options.map((option) => option._id.toString())
    );

    const areFieldIdsValid = fieldIds.every((id) =>
      validFieldsIds.includes(id)
    );

    const areOptionIdsValid = optionIds.every((id) =>
      validOptionIds.includes(id)
    );

    if (!areFieldIdsValid || !areOptionIdsValid) {
      return res.status(400).json({
        status: false,
        message: "Invalid vote! Field or option does not exist",
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

// Add Allowed Voters - receieves array of emails

const addAllowedVoters = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { pollId, emails } = req.body;
    const { userId } = req.user;
    try {
      // ensure the poll exists
      const poll = await PollModel.findById(pollId);
      if (!poll) {
        return res
          .status(404)
          .json({ status: false, message: "Poll not found" });
      }

      if (poll.isInviteOnly === false) {
        return res
          .status(404)
          .json({ status: false, message: "Poll is open to everyone" });
      }

      //ensure only poll creator can add voters
      if (String(poll.createdBy) !== String(userId)) {
        return res.status(403).json({
          message:
            "Access denied. Only the poll creator can add allowed voters",
        });
      }

      // Find the allowed voters entry for the given pollId
      let allowedVoters = await AllowedVotersModel.findOne({ pollId });

      if (!allowedVoters) {
        allowedVoters = new AllowedVotersModel({
          pollId,
          emails,
        });
      } else {
        const uniqueEmails = [...new Set([...allowedVoters.emails, ...emails])];
        allowedVoters.emails = uniqueEmails;
      }

      await allowedVoters.save();
      return res
        .status(201)
        .json({ status: true, message: "Allowed voters added successfully" });
    } catch (error) {
      return res
        .status(500)
        .json({ status: false, message: "Failed to add allowed voters" });
    }
  }
);

// DELETE /api/polls/:pollId
const deletePoll = asyncHandler(async (req: Request, res: Response) => {
  const { pollId } = req.params;

  try {
    // Find the poll by ID
    const poll = await PollModel.findById(pollId);

    if (!poll) {
      return res.status(404).json({
        status: false,
        message: "Poll not found",
      });
    }

    // Check if the requesting user is the creator of the poll
    if (poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: false,
        message: "Access denied. Only the creator can delete this poll",
      });
    }

    //delete poll
    poll.deleteOne();
    return res.status(200).json({
      status: true,
      message: "Poll deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

//Final result
const computePollResults = asyncHandler(async (req: Request, res: Response) => {
  const { pollId } = req.params;

  try {
    const poll = await PollModel.findById(pollId);

    if (!poll) {
      return res.status(404).json({
        status: false,
        message: "Poll not found",
      });
    }

    const results = await PollModel.aggregate([
      { $match: { _id: poll._id } },
      { $unwind: "$votes" },
      { $unwind: "$votes.vote" },
      {
        $group: {
          _id: {
            fieldId: "$votes.vote.fieldId",
            optionId: "$votes.vote.optionId",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    results.map((result) => {
      poll.fields.map((field) => {
        if (result._id.fieldId.toString() === field._id.toString()) {
          result["field"] = field.name;
        }

        field.options.map((option) => {
          if (option._id.toString() === result._id.optionId.toString()) {
            result["option"] = option.option;
          }
        });
      });

      delete result._id;
    });

    return res.status(200).json({
      status: true,
      message: results,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Failed to compute results",
      err,
    });
  }
});

//think caching computed result for a poll once the poll activation date is past.
//Prevent too frequent round trips to the database


export default {
  createPoll,
  updateActiveStatus,
  getAllPolls,
  getAdminPolls,
  updatePoll,
  participateInPoll,
  addAllowedVoters,
  deletePoll,
  computePollResults,
};
