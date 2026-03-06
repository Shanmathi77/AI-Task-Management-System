/**
 * backend/middleware/auth.cjs
 * Compatibility shim - prefer src/middleware/auth.cjs then src/middleware/auth.js
 */
try {
  let authImpl;
  try { authImpl = require("../src/middleware/auth.cjs"); } catch(e) { authImpl = require("../src/middleware/auth.js"); }
  const requireAuth = (authImpl && (authImpl.requireAuth || authImpl)) || function (req, res, next) { return next(); };
  module.exports = requireAuth;
  module.exports.requireAuth = requireAuth;
  module.exports.default = requireAuth;
} catch (err) {
  console.warn("[auth.cjs shim] could not load ../src/middleware/auth.* - using dev fallback:", err && err.message ? err.message : err);
  function requireAuth(req, res, next) {
    req.user = { id: 1, name: "Dev User", email: "teamlead@gmail.com", role: "team_lead" };
    return next();
  }
  module.exports = requireAuth;
  module.exports.requireAuth = requireAuth;
  module.exports.default = requireAuth;
}
