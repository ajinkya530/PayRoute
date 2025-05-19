# Multi-Tenant Payment Gateway Router

A TypeScript-based payment gateway router that supports multiple tenants and payment processors with role-based authentication.

## Features

- Multi-tenant support with isolated configurations
- Multiple payment processor support per tenant with fallback mechanism
- Role-based authentication (JWT)
- Secure API key storage with encryption
- Transaction logging with processor attempts tracking
- AI-powered transaction summary generation
- TypeScript support
- Fastify-based REST API
- MongoDB integration

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Yarn package manager
- API key for an LLM service (OpenAI or similar)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd payment-gateway-ts
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Create a `.env` file in the project root:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/payment-gateway
   JWT_SECRET=your-super-secure-jwt-secret-key
   ENCRYPTION_KEY=your-32-character-encryption-key
   LLM_API_ENDPOINT=https://api.openai.com/v1/chat/completions
   LLM_API_KEY=your-llm-api-key
   ```

4. Seed the database with sample tenants and admin user:
   ```bash
   yarn seed
   ```

5. Start the development server:
   ```bash
   yarn dev
   ```

### Running in Production

1. Build the project:
   ```bash
   yarn build
   ```

2. Start the production server:
   ```bash
   yarn start
   ```

### Default Admin Credentials

After running the seed script, you can log in with:
- Username: admin
- Password: 123

## Fraud Detection & LLM Usage

### LLM Integration

This platform uses LLMs (Large Language Models) in two key ways:

1. **Transaction Analysis & Summarization**:
   - The system sends transaction data to an LLM API
   - The LLM generates natural language summaries of transaction patterns
   - Summaries can highlight unusual activity or potential red flags
   - Endpoints provide these insights to tenant administrators

2. **Smart Analysis Without Hard-Coded Rules**:
   - Instead of relying solely on rigid rule-based fraud detection
   - The LLM can identify patterns that wouldn't be caught by simple rule-based systems
   - The system builds prompts with transaction context for the LLM

### How the LLM Works in the System

1. Transaction data is collected and stored in MongoDB
2. When requested, the system retrieves relevant transactions
3. The data is formatted into a prompt with specific instructions
4. The prompt is sent to the LLM API (e.g., OpenAI GPT-4)
5. The LLM processes the data and generates insights
6. The response is formatted and returned to the user

### Example LLM Prompt:

```
Analyze the following payment transaction data for tenant tenant_001 and provide a concise summary of their payment processing activity. Focus on patterns, success rates, and notable events.

Transaction Data:
[Transaction records in JSON format]

Please provide a natural language summary of the payment processing activity.
```

### Extending for Advanced Fraud Detection

The system can be extended for more sophisticated fraud detection by:

1. Adding real-time transaction screening through the LLM
2. Creating specialized prompts focused on fraud signals
3. Implementing feedback loops to improve detection accuracy
4. Integrating with additional data sources for context

## Assumptions & Tradeoffs

### Security Assumptions

1. **API Key Storage**: 
   - We encrypt API keys and secrets at rest
   - Assumption: The encryption key is stored securely outside the application

2. **JWT Authentication**:
   - Tokens expire after 24 hours
   - Tradeoff: Longer lived tokens are more convenient but less secure

3. **Password Security**:
   - Passwords are hashed using bcrypt with cost factor 10
   - Tradeoff: Higher cost factors are more secure but impact performance

### Performance Tradeoffs

1. **LLM Integration**:
   - LLM calls are relatively slow (1-3 seconds)
   - Summary generation is on-demand rather than real-time
   - Assumption: User can tolerate slight delay for AI-generated insights

2. **Database Structure**:
   - All processor attempts are stored in a single transaction document
   - Tradeoff: Simplifies queries but can lead to large documents
   - Assumption: Most transactions will have 1-2 attempts only

3. **MongoDB Indexes**:
   - Added indexes for tenantId for performance
   - Tradeoff: Faster reads, slower writes, more storage

### Scalability Considerations

1. **Multi-Tenant Design**:
   - Uses a single database with tenant separation at the document level
   - Tradeoff: Simpler to manage vs. potential "noisy neighbor" issues
   - Assumption: Tenant data volumes won't be radically different

2. **Payment Processor Fallback**:
   - Sequential attempts may increase latency
   - Tradeoff: Better success rates vs. potentially slower response times

3. **Role-Based Access**:
   - Simple 3-tier role system
   - Assumption: Complex permission scenarios aren't needed

### Known Limitations

1. No rate limiting implemented
2. No refresh token mechanism
3. Mock payment processors don't simulate all failure scenarios
4. Limited test coverage
5. No analytics dashboard for LLM insights
6. Single region deployment (no geo-redundancy)

## Authentication & Security

### User Roles

Three user roles with hierarchical permissions:

1. **Viewer Role**
   - View tenant data, transactions, and summaries
   - Read-only access

2. **Tenant Role** (inherits Viewer permissions)
   - Everything Viewers can do
   - Process payments

3. **Admin Role** (inherits Tenant permissions)
   - Everything Tenants can do
   - Add/modify tenants and configurations
   - Register new users with any role

### Security Features

- JWT-based authentication
- Hierarchical role-based access control
- Tenant data isolation (users can only access their assigned tenant)
- Encrypted API keys and secrets
- Detailed transaction logging

## API Endpoints

### Authentication

```
POST /api/auth/login
POST /api/auth/register (Admin only)
```

### Tenant Management (Admin only)

```
GET /api/tenants
GET /api/tenants/:tenantId
POST /api/tenants
PUT /api/tenants/:tenantId
```

### Payments

```
POST /api/tenants/:tenantId/pay (Tenant role or higher)
```

### Analytics

```
GET /api/tenants/:tenantId/transactions (Viewer role or higher)
GET /api/tenants/:tenantId/summary (Viewer role or higher)
```

## Request Examples

### Login

```
POST /api/auth/login
{
  "username": "admin",
  "password": "123"
}
```

### Create Tenant

```
POST /api/tenants
{
  "tenantId": "tenant_001",
  "preferredProcessor": "stripe",
  "processors": [
    {
      "name": "stripe",
      "apiKey": "sk_test_stripe_001",
      "apiSecret": "stripe_secret_001",
      "isActive": true
    },
    {
      "name": "paypal",
      "apiKey": "pk_test_paypal_001",
      "apiSecret": "paypal_secret_001",
      "isActive": true
    }
  ]
}
```

### Process Payment

```
POST /api/tenants/:tenantId/pay
{
  "amount": 2500,
  "currency": "USD",
  "source": "tok_visa"
}
```

## Project Structure

```
src/
  ├── config/         # Configuration files
  ├── middleware/     # Custom middleware (auth, tenant)
  ├── models/         # MongoDB models
  ├── routes/         # API routes
  ├── scripts/        # Utility scripts (seed)
  ├── services/       # Business logic
  ├── types/          # TypeScript interfaces and types
  ├── utils/          # Utility functions
  └── app.ts          # Application entry point
```
