import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  VIEWER = 'viewer',
  TENANT = 'tenant',
  ADMIN = 'admin'
}

export interface IUser {
  username: string;
  password: string;
  email: string;
  role: UserRole;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface UserDocument extends IUser, Document {}

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.VIEWER },
  tenantId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
});

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const bcrypt = require('bcrypt');
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export const User = mongoose.model<UserDocument>('User', UserSchema); 