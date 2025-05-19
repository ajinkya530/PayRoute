import { v4 as uuidv4 } from 'uuid';
import { PaymentRequest, PaymentResponse, Transaction, ProcessorAttempt } from '../types';
import { TenantConfig } from '../models/TenantConfig';
import { Transaction as TransactionModel } from '../models/Transaction';
import { decrypt } from '../utils/encryption';

export class PaymentService {
  private async mockPaymentProcessor(
    processor: string,
    apiKey: string,
    apiSecret: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    // Simulate API call to payment processor
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Randomly fail 50% of the time
    if (Math.random() < 0.5) {
      throw new Error(`Payment processor ${processor} failed to process the transaction`);
    }
    
    // Mock successful payment
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    return {
      success: true,
      transactionId: uuidv4(),
      processor,
      amount: request.amount,
      currency: request.currency,
      status: 'completed',
      timestamp: new Date()
    };
  }

  async processPayment(tenantId: string, request: PaymentRequest): Promise<PaymentResponse> {
    // Get tenant configuration
    const tenantConfig = await TenantConfig.findOne({ tenantId });
    if (!tenantConfig) {
      throw new Error('Tenant configuration not found');
    }

    let lastError: Error | null = null;
    const transactionId = uuidv4();
    const processorAttempts: ProcessorAttempt[] = [];

    // Try preferred processor first
    const preferredProcessor = tenantConfig.processors.find(
      p => p.name === tenantConfig.preferredProcessor && p.isActive
    );

    if (preferredProcessor) {
      try {
        const response = await this.mockPaymentProcessor(
          preferredProcessor.name,
          decrypt(preferredProcessor.apiKey),
          decrypt(preferredProcessor.apiSecret),
          request
        );

        // Add successful attempt
        processorAttempts.push({
          processor: preferredProcessor.name,
          status: 'completed',
          timestamp: new Date(),
          response: response
        });

        // Log transaction with successful attempt
        await this.logTransaction(tenantId, request, transactionId, processorAttempts, 'completed');

        return response;
      } catch (error: any) {
        lastError = error as Error;
        console.error(`Preferred processor ${preferredProcessor.name} failed:`, error);
        
        // Add failed attempt
        processorAttempts.push({
          processor: preferredProcessor.name,
          status: 'failed',
          timestamp: new Date(),
          response: { success: false },
          error: error.message
        });
      }
    }

    // Try other active processors
    const otherProcessors = tenantConfig.processors.filter(
      p => p.isActive && p.name !== tenantConfig.preferredProcessor
    );

    for (const processor of otherProcessors) {
      try {
        const response = await this.mockPaymentProcessor(
          processor.name,
          decrypt(processor.apiKey),
          decrypt(processor.apiSecret),
          request
        );

        // Add successful attempt
        processorAttempts.push({
          processor: processor.name,
          status: 'completed',
          timestamp: new Date(),
          response: response
        });

        // Update transaction with successful attempt
        await this.logTransaction(tenantId, request, transactionId, processorAttempts, 'completed');

        return response;
      } catch (error: any) {
        lastError = error as Error;
        console.error(`Processor ${processor.name} failed:`, error);
        
        // Add failed attempt
        processorAttempts.push({
          processor: processor.name,
          status: 'failed',
          timestamp: new Date(),
          response: { success: false },
          error: error.message
        });
      }
    }

    // If we get here, all processors failed
    // Log final failed transaction
    await this.logTransaction(tenantId, request, transactionId, processorAttempts, 'failed');
    throw new Error(`All payment processors failed. Last error: ${lastError?.message}`);
  }

  private async logTransaction(
    tenantId: string,
    request: PaymentRequest,
    transactionId: string,
    processorAttempts: ProcessorAttempt[],
    finalStatus: string
  ): Promise<void> {
    const transaction: Partial<Transaction> = {
      transactionId,
      tenantId,
      amount: request.amount,
      currency: request.currency,
      source: request.source,
      processorAttempts,
      finalStatus,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Use findOneAndUpdate with upsert to handle both new and existing transactions
    await TransactionModel.findOneAndUpdate(
      { transactionId },
      transaction,
      { upsert: true, new: true }
    );
  }

  async getTenantTransactions(tenantId: string): Promise<Transaction[]> {
    // Ensure tenant can only access their own transactions
    return TransactionModel.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }
} 