import mongoose, { CallbackError, Document, Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

enum UserRole {
  SuperAdmin = "super_admin",
  RegularUser = "regular_user",
  Admin = "admin",
}

interface User extends Document {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role: UserRole[];
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
  password: { type: String, required: true, minlength: 8, select: false },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
  },

  role: {
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.RegularUser],
  },
});

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
    returnedObject.id = returnedObject._id.toString();

    // the password should not be revealed
    delete returnedObject.password;
  },
});

const UserModel = mongoose.model<User>("User", userSchema);

export { UserModel, User, UserRole };
