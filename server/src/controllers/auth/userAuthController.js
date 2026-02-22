import bcrypt from 'bcryptjs';
import { signToken } from '../../services/tokenService.js';
import db from '../../models/index.js';

const { GlobalUser } = db;

export async function registerUser(req, res, next) {
  try {
    const { phone, password, name, home_city, blood_group, emergency_contact } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and Password are required' });
    }

    const existingUser = await GlobalUser.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await GlobalUser.create({
      phone,
      password_hash: hashedPassword,
      name,
      home_city,
      blood_group,
      emergency_contact
    });

    const token = signToken({ id: user.id, role: 'global_citizen' });

    res.status(201).json({ 
      message: 'User registered successfully', 
      token,
      user: { id: user.id, name: user.name, phone: user.phone } 
    });

  } catch (err) {
    next(err);
  }
}

export async function loginUser(req, res, next) {
  try {
    const { phone, password } = req.body;

    const user = await GlobalUser.findOne({ where: { phone } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user.id, role: 'global_citizen' });

    res.json({ 
      token, 
      user: { id: user.id, name: user.name, phone: user.phone } 
    });

  } catch (err) {
    next(err);
  }
}