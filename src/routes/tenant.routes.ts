import { FastifyInstance, FastifyRequest } from 'fastify';
import { TenantConfig } from '../models/TenantConfig';
import { UserRole } from '../models/User';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { encrypt } from '../utils/encryption';
import { PaymentProcessor } from '../types';

export async function tenantRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);
  
  // Get all tenants (admin only)
  fastify.get(
    '/tenants',
    { preHandler: [roleMiddleware(UserRole.ADMIN)] },
    async (request, reply) => {
      try {
        const tenants = await TenantConfig.find({});
        return reply.code(200).send(tenants);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to retrieve tenants' });
      }
    }
  );

  // Get a specific tenant (admin or assigned tenant users)
  fastify.get(
    '/tenants/:tenantId',
    { preHandler: [roleMiddleware(UserRole.ADMIN)] },
    async (request, reply) => {
      try {
        const { tenantId } = request.params as { tenantId: string, userInfo: any };
        // Check permissions
        const user = request.userInfo as { role?: UserRole; tenantId?: string };
        if (user.role !== UserRole.ADMIN && user.tenantId !== tenantId) {
          return reply.code(403).send({ error: 'Unauthorized access to tenant data' });
        }
        
        const tenant = await TenantConfig.findOne({ tenantId });
        if (!tenant) {
          return reply.code(404).send({ error: 'Tenant not found' });
        }
        
        return reply.code(200).send(tenant);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to retrieve tenant' });
      }
    }
  );

  // Create a new tenant (admin only)
  fastify.post(
    '/tenants',
    { 
      preHandler: [roleMiddleware(UserRole.ADMIN)],
      schema: {
        body: {
          type: 'object',
          required: ['tenantId', 'preferredProcessor', 'processors'],
          properties: {
            tenantId: { type: 'string' },
            preferredProcessor: { type: 'string' },
            processors: { 
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'apiKey', 'apiSecret', 'isActive'],
                properties: {
                  name: { type: 'string' },
                  apiKey: { type: 'string' },
                  apiSecret: { type: 'string' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const tenantData = request.body as any;
        
        // Check if tenant already exists
        const existingTenant = await TenantConfig.findOne({ tenantId: tenantData.tenantId });
        if (existingTenant) {
          return reply.code(409).send({ error: 'Tenant ID already exists' });
        }
        
        // Encrypt sensitive data
        tenantData.processors = tenantData.processors.map((processor: PaymentProcessor) => ({
          ...processor,
          apiKey: encrypt(processor.apiKey),
          apiSecret: encrypt(processor.apiSecret)
        }));
        
        const tenant = new TenantConfig(tenantData);
        await tenant.save();
        
        return reply.code(201).send(tenant);
      } catch (error) {
        request.log.error(error);
        return reply.code(400).send({ error: 'Failed to create tenant' });
      }
    }
  );

  // Update a tenant (admin only)
  fastify.put(
    '/tenants/:tenantId',
    { 
      preHandler: [roleMiddleware(UserRole.ADMIN)],
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
    async (request: FastifyRequest<{ Params: { tenantId: string } }>, reply) => {
      try {
        const { tenantId } = request.params;
        const updateData = request.body as any;
        
        // Encrypt sensitive data if provided
        if (updateData.processors) {
          updateData.processors = updateData.processors.map((processor: PaymentProcessor) => {
            const updatedProcessor = { ...processor };
            if (processor.apiKey) {
              updatedProcessor.apiKey = encrypt(processor.apiKey);
            }
            if (processor.apiSecret) {
              updatedProcessor.apiSecret = encrypt(processor.apiSecret);
            }
            return updatedProcessor;
          });
        }
        
        // Update with validation
        const tenant = await TenantConfig.findOneAndUpdate(
          { tenantId },
          { ...updateData, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
        
        if (!tenant) {
          return reply.code(404).send({ error: 'Tenant not found' });
        }
        
        return reply.code(200).send(tenant);
      } catch (error) {
        request.log.error(error);
        return reply.code(400).send({ error: 'Failed to update tenant' });
      }
    }
  );
} 