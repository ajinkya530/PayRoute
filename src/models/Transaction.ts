import mongoose, { Schema, Document } from 'mongoose';
import { Transaction as ITransaction } from '../types';

export interface TransactionDocument extends ITransaction, Document {}

const ProcessorAttemptSchema = new Schema({
  processor: { type: String, required: true },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  response: { type: Schema.Types.Mixed, required: true },
  error: { type: String }
});

const TransactionSchema = new Schema({
  transactionId: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  source: { type: String, required: true },
  processorAttempts: [ProcessorAttemptSchema],
  finalStatus: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Transaction = mongoose.model<TransactionDocument>('Transaction', TransactionSchema); 