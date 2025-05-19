import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../models/User';
import { TenantConfig } from '../models/TenantConfig';

export interface TokenPayload {
  id: string;
  username: string;
  role: UserRole;
  tenantId: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  private readonly JWT_EXPIRES_IN = '24h';

  async authenticate(username: string, password: string): Promise<{ token: string, user: TokenPayload }> {
    // Find user
    const user = await User.findOne({ username, active: true });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Validate password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const payload: TokenPayload = {
      id: user._id.toString(),
      username: user.username,
      role: user.role as UserRole,
      tenantId: user.tenantId
    };

    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });

    return { token, user: payload };
  }

  async validateToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async registerUser(userData: Partial<UserDocument>): Promise<UserDocument> {
    // Validate tenant existence
    const tenant = await TenantConfig.findOne({ tenantId: userData.tenantId });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const user = new User(userData);
    await user.save();
    return user;
  }

  async hasPermission(role: UserRole, requiredRole: UserRole): Promise<boolean> {
    const roleHierarchy = {
      [UserRole.VIEWER]: 1,
      [UserRole.TENANT]: 2,
      [UserRole.ADMIN]: 3
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  }
} 