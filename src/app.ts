import fastify from 'fastify';
import mongoose from 'mongoose';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { paymentRoutes } from './routes/payment.routes';
import { authRoutes } from './routes/auth.routes';
import { tenantRoutes } from './routes/tenant.routes';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = fastify({
  logger: true
});

// Register plugins
app.register(cors, {
  origin: true
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key'
});

// Register routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(tenantRoutes, { prefix: '/api' });
app.register(paymentRoutes, { prefix: '/api' });

// Default route
app.get('/', async (request, reply) => {
  return { status: 'ok', message: 'Payment Gateway API' };
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payment-gateway')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Start server
const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 