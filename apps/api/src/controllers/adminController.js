import { ok } from "../utils/response.js";
import {
  searchUsers,
  getUserById,
  setUserStatus,
  banUser,
  getFlaggedJobs,
  getJobById,
  moderateJob,
  getDisputes,
  getDisputeById,
  ruleDispute,
  escalateDispute,
  getMetrics,
  getPlatformSettings,
  updatePlatformSetting,
  getAuditLog
} from "../services/adminService.js";

/**
 * Each controller handler receives `req.user` (the decoded JWT payload) thanks
 * to authMiddleware + requireAdmin. The admin's identity is threaded through
 * every mutating action so the audit log always records WHO did WHAT.
 */
const admin = (req) => ({ sub: req.user.sub, email: req.user.email });

/* =========================================================================
 * Trust & Metrics
 * =======================================================================*/
export async function metrics(req, res) {
  return ok(res, await getMetrics());
}

/* =========================================================================
 * User Management
 * =======================================================================*/
export async function listUsers(req, res) {
  const { query, role, status, page, pageSize } = req.query;
  const result = await searchUsers({
    query,
    role,
    status,
    page: String(page ?? "1"),
    pageSize: String(pageSize ?? undefined)
  });
  return ok(res, result);
}

export async function getUser(req, res) {
  const user = await getUserById(req.params.id);
  if (!user) {
    return ok(res, { error: "User not found" }, 404);
  }
  // Attach active jobs and disputes for the "view profile" use case.
  const storeJobs = (await import("../data/adminStore.js")).adminStore.jobs;
  const storeDisputes = (await import("../data/adminStore.js")).adminStore.disputes;
  const activeJobs = storeJobs.filter(
    (j) =>
      (j.clientId === user.id || false) &&
      ["open", "in_progress"].includes(j.status)
  );
  const disputeHistory = storeDisputes.filter(
    (d) => d.freelancerId === user.id || d.clientId === user.id
  );
  return ok(res, { user, activeJobs, disputeHistory });
}

export async function suspendUser(req, res) {
  const { reason } = req.body;
  const result = await setUserStatus(req.params.id, "suspended", admin(req));
  if (result.error) return ok(res, { error: result.error }, result.status);
  return ok(res, result);
}

export async function reinstateUser(req, res) {
  const result = await setUserStatus(req.params.id, "active", admin(req));
  if (result.error) return ok(res, { error: result.error }, result.status);
  return ok(res, result);
}

export async function ban(req, res) {
  const { reason } = req.body;
  const result = await banUser(
    req.params.id,
    reason ?? "No reason provided",
    admin(req)
  );
  if (result.error) return ok(res, { error: result.error }, result.status);
  return ok(res, result);
}

/* =========================================================================
 * Job & Listing Moderation
 * =======================================================================*/
export async function listFlaggedJobs(req, res) {
  const { query, page, pageSize } = req.query;
  const result = await getFlaggedJobs({
    query,
    page: String(page ?? "1"),
    pageSize: String(pageSize ?? undefined)
  });
  return ok(res, result);
}

export async function getJob(req, res) {
  const job = await getJobById(req.params.id);
  if (!job) return ok(res, { error: "Job not found" }, 404);
  return ok(res, job);
}

export async function moderate(req, res) {
  const { decision, reason } = req.body;
  if (!["approved", "rejected", "escalated"].includes(decision)) {
    return ok(res, { error: "Invalid decision" }, 400);
  }
  const result = await moderateJob(
    req.params.id,
    decision,
    admin(req),
    reason ?? ""
  );
  if (result.error) return ok(res, { error: result.error }, result.status);
  return ok(res, result);
}

/* =========================================================================
 * Dispute Resolution
 * =======================================================================*/
export async function listDisputes(req, res) {
  const { status, query, page, pageSize } = req.query;
  const result = await getDisputes({
    status,
    query,
    page: String(page ?? "1"),
    pageSize: String(pageSize ?? undefined)
  });
  return ok(res, result);
}

export async function getDispute(req, res) {
  const dispute = await getDisputeById(req.params.id);
  if (!dispute) return ok(res, { error: "Dispute not found" }, 404);
  return ok(res, dispute);
}

export async function rule(req, res) {
  const { winner, reason, action } = req.body;
  if (!winner || !reason) {
    return ok(res, { error: "winner and reason are required" }, 400);
  }
  const result = await ruleDispute(
    req.params.id,
    winner,
    reason,
    admin(req),
    action ?? "rule"
  );
  if (result.error) return ok(res, { error: result.error }, result.status);
  return ok(res, result);
}

export async function escalate(req, res) {
  const { reason } = req.body;
  const result = await escalateDispute(
    req.params.id,
    reason ?? "No reason provided",
    admin(req)
  );
  if (result.error) return ok(res, { error: result.error }, result.status);
  return ok(res, result);
}

/* =========================================================================
 * Platform Controls
 * =======================================================================*/
export async function platform(req, res) {
  const settings = await getPlatformSettings();
  return ok(res, settings);
}

export async function platformToggle(req, res) {
  const { key, value } = req.body;
  if (typeof key !== "string" || typeof value !== "boolean") {
    return ok(res, { error: "key (string) and value (boolean) are required" }, 400);
  }
  const result = await updatePlatformSetting(key, value, admin(req));
  if (result.error) return ok(res, { error: result.error }, result.status);
  return ok(res, result);
}

/* =========================================================================
 * Audit Log
 * =======================================================================*/
export async function audit(req, res) {
  const { admin: adminId, action: actionFilter, startDate, endDate, page, pageSize } = req.query;
  const result = await getAuditLog({
    admin: adminId,
    action: actionFilter,
    startDate,
    endDate,
    page: String(page ?? "1"),
    pageSize: String(pageSize ?? undefined)
  });
  return ok(res, result);
}
