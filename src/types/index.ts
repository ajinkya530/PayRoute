import { TenantConfigDocument } from '../models/TenantConfig';
import { FastifyRequest } from 'fastify';

export interface PaymentProcessor {
  name: string;
  apiKey: string;
  apiSecret: string;
  isActive: boolean;
}

export interface TenantConfig {
  tenantId: string;
  preferredProcessor: string;
  processors: PaymentProcessor[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  source: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  processor: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: Date;
}

export interface ProcessorAttempt {
  processor: string;
  status: string;
  timestamp: Date;
  response: any;
  error?: string;
}

export interface Transaction {
  transactionId: string;
  tenantId: string;
  amount: number;
  currency: string;
  source: string;
  processorAttempts: ProcessorAttempt[];
  finalStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extend FastifyRequest to include tenant information
declare module 'fastify' {
  interface FastifyRequest {
    tenant?: TenantConfigDocument;
  }
} 