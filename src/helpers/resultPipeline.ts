import { PollModel } from "../models/polls";
import { Document } from "mongoose";

const computePollResultFromDatabase = async (poll: Document) => {
  await PollModel.aggregate([
    { $match: { _id: poll._id } },
  ]);
};

export default computePollResultFromDatabase;
