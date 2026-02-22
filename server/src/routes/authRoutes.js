import express from 'express';
import tenantResolver from '../middlewares/tenantResolver.js';
import { loginOfficial, registerTenant } from '../controllers/auth/officialAuthController.js';
import { loginUser, registerUser } from '../controllers/auth/userAuthController.js';

const router = express.Router();

// ==========================================
// 1. OFFICIAL AUTH (Admins & Responders)
// ==========================================

// Login: Needs 'x-business-code' header to find the right DB
router.post('/official/login', tenantResolver, loginOfficial);

// Register Tenant: Creates a NEW business code, so no header needed yet
router.post('/official/register-tenant', registerTenant);


// ==========================================
// 2. GLOBAL USER AUTH (Citizens)
// ==========================================

// Citizens exist in 'public' schema, so NO tenantResolver needed
router.post('/user/login', loginUser);
router.post('/user/register', registerUser);

export default router;