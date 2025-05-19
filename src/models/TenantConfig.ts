import mongoose, { Schema, Document } from 'mongoose';
import { TenantConfig as ITenantConfig } from '../types';

export interface TenantConfigDocument extends ITenantConfig, Document {}

const PaymentProcessorSchema = new Schema({
  name: { type: String, required: true },
  apiKey: { type: String, required: true },
  apiSecret: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

const TenantConfigSchema = new Schema({
  tenantId: { type: String, required: true, unique: true },
  preferredProcessor: { type: String, required: true },
  processors: [PaymentProcessorSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const TenantConfig = mongoose.model<TenantConfigDocument>('TenantConfig', TenantConfigSchema); 