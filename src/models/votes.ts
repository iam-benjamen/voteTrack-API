import mongoose, {Schema, model, Document} from "mongoose";

interface Vote extends Document{
    userId:Schema.Types.ObjectId;
    vote: {
        fieldId: Schema.Types.ObjectId;
        optionId: Schema.Types.ObjectId;
    }[];
}

const voteSchema:Schema<Vote> = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    vote: [
        {
            fieldId: { type: Schema.Types.ObjectId, required: false },
            optionId: { type: Schema.Types.ObjectId, required: false },
        },
    ],
})

const VoteModel = mongoose.model<Vote>("Vote", voteSchema);
export {VoteModel, Vote, voteSchema}