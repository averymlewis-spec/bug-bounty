import { Router } from "express";
import {
  metrics,
  listUsers,
  getUser,
  suspendUser,
  reinstateUser,
  ban,
  listFlaggedJobs,
  getJob,
  moderate,
  listDisputes,
  getDispute,
  rule,
  escalate,
  platform,
  platformToggle,
  audit
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRoutes = Router();

/**
 * All admin routes are protected by two layers:
 *   1. authMiddleware — verifies the JWT and populates req.user (401 if absent/invalid)
 *   2. requireAdmin    — enforces that req.user.role === 'admin' (403 otherwise)
 *
 * Client-side routing guards are a convenience only; the server is the source
 * of truth for authorization.
 */
adminRoutes.use(authMiddleware, requireAdmin);

// Trust & Metrics Dashboard
adminRoutes.get("/metrics", metrics);

// Platform Controls
adminRoutes.get("/platform", platform);
adminRoutes.patch("/platform", platformToggle);

// User Management
adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:id", getUser);
adminRoutes.patch("/users/:id/suspend", suspendUser);
adminRoutes.patch("/users/:id/reinstate", reinstateUser);
adminRoutes.patch("/users/:id/ban", ban);

// Job / Listing Moderation
adminRoutes.get("/listings", listFlaggedJobs);
adminRoutes.get("/listings/:id", getJob);
adminRoutes.patch("/listings/:id/moderate", moderate);

// Dispute Resolution
adminRoutes.get("/disputes", listDisputes);
adminRoutes.get("/disputes/:id", getDispute);
adminRoutes.patch("/disputes/:id/rule", rule);
adminRoutes.patch("/disputes/:id/escalate", escalate);

// Audit Log
adminRoutes.get("/audit", audit);
