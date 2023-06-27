import mongoose, { CallbackError, Document, Schema } from "mongoose";
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
  role: UserRole[];
  isEmailConfirmed: boolean;
  confirmationToken: string;
  // passwordChangedAt?: Date;
  // changedPasswordAfter(tokenIssuedAt: number): boolean;
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
  // passwordChangedAt: { type: Date, default: undefined },
});

userSchema.methods.changedPasswordAfter = function (
  tokenIssuedAt: number
): boolean {
  if (this.passwordChangedAt) {
    const passwordChangedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );

    return tokenIssuedAt < passwordChangedTimestamp;
  }

  return false;
};

userSchema.pre<User>(
  "save",
  async function (next: (err?: CallbackError) => void) {
    if (this.isModified("password") || this.isNew) {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
      } catch (error: unknown) {
        return next(error as CallbackError);
      }
    } else {
      return next();
    }
  }
);

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject.password;
    delete returnedObject.__v;
  },
});

const UserModel = mongoose.model<User>("User", userSchema);

export { UserModel, User };
