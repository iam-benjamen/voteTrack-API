import mongoose, { Document, Schema } from "mongoose";

interface AllowedVoters extends Document {
  pollId: Schema.Types.ObjectId;
  emails: string[];
}

const allowedVotersSchema: Schema<AllowedVoters> = new mongoose.Schema({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: "Poll",
    required: true,
  },
  emails: {
    type: [String],
    required: true,
  },
});

const AllowedVotersModel = mongoose.model<AllowedVoters>(
  "AllowedVoters",
  allowedVotersSchema
);

export { AllowedVotersModel };
