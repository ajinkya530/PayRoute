import mongoose from 'mongoose';
import { TenantConfig } from '../models/TenantConfig';
import { User, UserRole } from '../models/User';
import { encrypt } from '../utils/encryption';

const sampleTenants = [
  {
    tenantId: 'tenant_001',
    preferredProcessor: 'stripe',
    processors: [
      {
        name: 'stripe',
        apiKey: encrypt('sk_test_stripe_001'),
        apiSecret: encrypt('stripe_secret_001'),
        isActive: true
      },
      {
        name: 'paypal',
        apiKey: encrypt('pk_test_paypal_001'),
        apiSecret: encrypt('paypal_secret_001'),
        isActive: true
      }
    ]
  },
  {
    tenantId: 'tenant_002',
    preferredProcessor: 'paypal',
    processors: [
      {
        name: 'paypal',
        apiKey: encrypt('pk_test_paypal_002'),
        apiSecret: encrypt('paypal_secret_002'),
        isActive: true
      },
      {
        name: 'stripe',
        apiKey: encrypt('sk_test_stripe_002'),
        apiSecret: encrypt('stripe_secret_002'),
        isActive: true
      }
    ]
  },
  {
    tenantId: 'tenant_003',
    preferredProcessor: 'stripe',
    processors: [
      {
        name: 'stripe',
        apiKey: encrypt('sk_test_stripe_003'),
        apiSecret: encrypt('stripe_secret_003'),
        isActive: true
      },
      {
        name: 'paypal',
        apiKey: encrypt('pk_test_paypal_003'),
        apiSecret: encrypt('paypal_secret_003'),
        isActive: false
      }
    ]
  }
];

// Admin user
const adminUser = {
  username: 'admin',
  password: '123',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
  tenantId: 'tenant_001', // Assign to first tenant
  active: true
};

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payment-gateway');
    console.log('Connected to MongoDB');

    // Clear existing data
    await TenantConfig.deleteMany({});
    console.log('Cleared existing tenant configurations');

    // Insert sample data
    await TenantConfig.insertMany(sampleTenants);
    console.log('Inserted sample tenant configurations');

    // Create admin user
    await User.deleteMany({ username: adminUser.username });
    const user = new User(adminUser);
    await user.save();
    console.log('Created admin user:', adminUser.username);

    // Verify the data
    const tenants = await TenantConfig.find({});
    console.log('Current tenant configurations:');
    console.log(JSON.stringify(tenants, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed(); 