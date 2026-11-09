import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import { TUserRole } from './auth.interface';

export interface IUser {
  _id?: string;
  email: string;
  password: string;
  role: TUserRole;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(plainPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'USER'],
      default: 'USER',
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (
  plainPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, this.password);
};

export const UserModel = model<IUser>('User', userSchema);
