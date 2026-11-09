import { Schema, model, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../../config';
import { TUserRole } from './auth.interface';

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: TUserRole;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(plainPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['renter', 'host', 'admin'],
      default: 'renter',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }
  // Only hash if not already a bcrypt hash
  if (
    !this.passwordHash.startsWith('$2b$') &&
    !this.passwordHash.startsWith('$2a$')
  ) {
    this.passwordHash = await bcrypt.hash(
      this.passwordHash,
      config.bcrypt_salt_rounds || 12,
    );
  }
});

userSchema.methods.comparePassword = async function (
  plainPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

export const UserModel = model<IUser>('User', userSchema);
