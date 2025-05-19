import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/User';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();

  // Login route
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { username, password } = request.body as { username: string; password: string };
      const result = await authService.authenticate(username, password);
      return reply.code(200).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
  });

  // Register user route (admin only)
  fastify.post('/register', {
    preHandler: [authMiddleware, roleMiddleware(UserRole.ADMIN)],
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password', 'email', 'role', 'tenantId'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: Object.values(UserRole) },
          tenantId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userData = request.body as any;
      const user = await authService.registerUser(userData);
      return reply.code(201).send({ 
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      });
    } catch (error: unknown) {
      request.log.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Error creating user';
      return reply.code(400).send({ error: errorMessage });
    }
  });
} 