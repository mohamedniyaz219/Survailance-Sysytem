/**
 * CRITICAL: Tenant Resolver Middleware
 * Switches database schema based on authenticated user's organization
 * Ensures data isolation in multi-tenant architecture
 */
const tenantResolver = async (req, res, next) => {
  try {
    // Ensure user is authenticated first
    if (!req.user || !req.user.tenantId) {
      return res.status(401).json({ error: 'Tenant information not found' });
    }

    // Set the tenant schema for this request
    req.tenantSchema = `tenant_${req.user.tenantId}`;
    
    // Store in request context for database queries
    req.dbContext = {
      schema: req.tenantSchema,
      tenantId: req.user.tenantId
    };

    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    return res.status(500).json({ error: 'Failed to resolve tenant' });
  }
};

module.exports = tenantResolver;
