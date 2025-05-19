import { FastifyInstance } from 'fastify';
import { PaymentService } from '../services/payment.service';
import { LLMService } from '../services/llm.service';
import { PaymentRequest } from '../types';
import { authMiddleware, roleMiddleware, tenantAccessMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

export async function paymentRoutes(fastify: FastifyInstance) {
  const paymentService = new PaymentService();
  const llmService = new LLMService();

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Process payment (tenant role or higher)
  fastify.post<{ Params: { tenantId: string }; Body: PaymentRequest }>(
    '/tenants/:tenantId/pay',
    {
      preHandler: [roleMiddleware(UserRole.TENANT), tenantAccessMiddleware()],
      schema: {
        params: {
          type: 'object',
          required: ['tenantId'],
          properties: {
            tenantId: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['amount', 'currency', 'source'],
          properties: {
            amount: { type: 'number' },
            currency: { type: 'string' },
            source: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { tenantId } = request.params;
        const paymentRequest = request.body;

        const response = await paymentService.processPayment(tenantId, paymentRequest);
        return reply.code(200).send(response);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Payment processing failed' });
      }
    }
  );

  // Get tenant transactions (viewer role or higher)
  fastify.get<{ Params: { tenantId: string } }>(
    '/tenants/:tenantId/transactions',
    {
      preHandler: [roleMiddleware(UserRole.VIEWER), tenantAccessMiddleware()],
      schema: {
        params: {
          type: 'object',
          required: ['tenantId'],
          properties: {
            tenantId: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { tenantId } = request.params;
        const transactions = await paymentService.getTenantTransactions(tenantId);
        return reply.code(200).send(transactions);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch transactions' });
      }
    }
  );

  // Get tenant summary (viewer role or higher)
  fastify.get<{ Params: { tenantId: string } }>(
    '/tenants/:tenantId/summary',
    {
      preHandler: [roleMiddleware(UserRole.VIEWER), tenantAccessMiddleware()],
      schema: {
        params: {
          type: 'object',
          required: ['tenantId'],
          properties: {
            tenantId: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { tenantId } = request.params;
        const transactions = await paymentService.getTenantTransactions(tenantId);
        const summary = await llmService.generateTenantSummary(tenantId, transactions);

        return reply.code(200).send({
          tenantId,
          summary,
          generatedAt: new Date().toISOString()
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to generate summary' });
      }
    }
  );
} 