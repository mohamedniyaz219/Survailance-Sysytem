import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Handles authentication for a tenant-scoped user.
export async function login(req, res, next) {
  try {
    const { business_code: businessCode, email, password } = req.body || {};

    if (!businessCode || !email || !password) {
      return res.status(400).json({ error: 'business_code, email, and password are required' });
    }

    if (!req.tenantSchema) {
      return res.status(500).json({ error: 'Tenant schema not resolved' });
    }

    // TODO: replace with actual model lookup in the tenant schema (Officials/Admins table).
    // const user = await getUserFromTenantSchema(req.tenantSchema, email);
    const user = null;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        businessCode: businessCode,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    return next(err);
  }
}
