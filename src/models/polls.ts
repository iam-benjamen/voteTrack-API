import mongoose, { Document, Schema } from "mongoose";

interface PollOption {
  option: string;
  image?: string;
  _id: Schema.Types.ObjectId;
}

interface PollField {
  name: string;
  options: PollOption[];
  _id: Schema.Types.ObjectId;
}

export interface Vote {
  userId: Schema.Types.ObjectId;
  vote: {
    fieldId: Schema.Types.ObjectId;
    optionId: Schema.Types.ObjectId;
  }[];
}

export interface voteResult {
  field: string;
  option: string;
  count: number;
}
interface Poll extends Document {
  name: string;
  description: string;
  active: boolean;
  startDate: Date;
  expirationDate: Date;
  createdBy: Schema.Types.ObjectId;
  fields: PollField[];
  isInviteOnly: boolean;
  votes: Vote[];
}

const pollOptionSchema: Schema<PollOption> = new mongoose.Schema({
  option: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,    
  },
});

const pollFieldSchema: Schema<PollField> = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  options: {
    type: [pollOptionSchema],
    required: true,
  },
});

const pollSchema: Schema<Poll> = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name for the poll"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please provide a description for the poll"],
    trim: true,
  },
  fields: {
    type: [pollFieldSchema],
    required: [true, "Please provide at least one field for the poll"],
  },
  active: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  expirationDate: {
    type: Date,
    required: [true, "Please provide the polls expiration date"],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isInviteOnly: {
    type: Boolean,
    default: false,
  },
  votes: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        required: false,
      },
      vote: [
        {
          fieldId: {
            type: Schema.Types.ObjectId,
            required: false,
          },
          optionId: {
            type: Schema.Types.ObjectId,
            required: false,
          },
        },
      ],
    },
  ],
});

// Pre-save middleware to set the 'active' field based on the current date

pollSchema.pre("save", function (next) {
  const currentDate = new Date();
  if (this.isModified("startDate") || this.isModified("expirationDate")) {
    if (this.startDate <= currentDate && this.expirationDate > currentDate) {
      this.active = true;
    } else {
      this.active = false;
    }
  }

  next();
});

const PollModel = mongoose.model<Poll>("Poll", pollSchema);

export { PollModel, Poll, PollField};
