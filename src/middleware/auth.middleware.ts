import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/User';
import { TokenPayload } from '../services/auth.service';

const authService = new AuthService();

// Define custom user property for FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    userInfo?: TokenPayload;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const payload = await authService.validateToken(token);
    
    // Attach user to request
    request.userInfo = payload;
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}

export function roleMiddleware(requiredRole: UserRole) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.userInfo) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const hasPermission = await authService.hasPermission(request.userInfo.role, requiredRole);
    if (!hasPermission) {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
  };
}

export function tenantAccessMiddleware() {
  return async (request: FastifyRequest<{ Params: { tenantId: string } }>, reply: FastifyReply) => {
    if (!request.userInfo) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const requestedTenantId = request.params.tenantId;
    
    // Admin can access any tenant
    if (request.userInfo.role === UserRole.ADMIN) {
      return;
    }
    
    // Users can only access their assigned tenant
    if (request.userInfo.tenantId !== requestedTenantId) {
      return reply.code(403).send({ error: 'You do not have access to this tenant' });
    }
  };
} 