import mongoose, {CallbackError, Document, Schema} from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

enum UserRole {
  Admin = "admin",
  SuperAdmin = "super_admin",
  RegularUser = "regular_user",
}

interface User extends Document {
  name: string;
  email: string;
  password: string;
  isEmailConfirmed: boolean;
  confirmationToken: string;
  role: UserRole[];
  assignedAdmin: Schema.Types.ObjectId;
}

const userSchema: Schema<User> = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please, provide a Name"],
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please, provide a valid email"],
  },

  password: { type: String, required: true, minlength: 8 },

  role: {
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.RegularUser],
  },

  isEmailConfirmed: {
    type: Boolean,
    default: false,
  },

  confirmationToken: { type: String },

  assignedAdmin: {
    ref: "User",
    type: Schema.Types.ObjectId,
    default: null,
  },
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject.password;
    delete returnedObject.__v;
  },
});

userSchema.pre<User>(
  "save",
  async function (next: (err?: CallbackError) => void) {
    if (this.isModified("password") || this.isNew) {
      try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      } catch (error: unknown) {
        return next(error as CallbackError);
      }
    } else {
      return next();
    }
  }
);



const UserModel = mongoose.model<User>("User", userSchema);

export { UserModel, User, UserRole };
