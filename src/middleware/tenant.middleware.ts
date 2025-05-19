import { FastifyRequest, FastifyReply } from 'fastify';
import { TenantConfig } from '../models/TenantConfig';

export async function tenantMiddleware(
  request: FastifyRequest<{ Params: { tenantId: string } }>,
  reply: FastifyReply
) {
  const { tenantId } = request.params;

  if (!tenantId) {
    return reply.code(400).send({ error: 'Tenant ID is required' });
  }

  try {
    // Verify tenant exists and is active
    const tenant = await TenantConfig.findOne({ tenantId });
    if (!tenant) {
      return reply.code(404).send({ error: 'Tenant not found' });
    }

    // Attach tenant to request for use in route handlers
    request.tenant = tenant;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Error validating tenant' });
  }
} 