import { Schema, model, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, Role } from "../types";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  department?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  hashPassword(plain: string): Promise<string>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "INSPECTOR" },
    department: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain: string) {
  return bcrypt.hash(plain, 10);
};

// Never leak the hash even if a query forgets to deselect it.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const json = ret as unknown as Record<string, unknown>;
    delete json.passwordHash;
    delete json.__v;
    return ret;
  },
});

export const User = model<IUser, IUserModel>("User", userSchema);
