import { adminStore } from "../data/adminStore.js";

const PAGE_SIZE = 15;

/* =========================================================================
 * Server-side pagination helper
 * =======================================================================*/
function paginate(items, page, pageSize = PAGE_SIZE) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const size = Math.max(1, Math.min(100, parseInt(pageSize, 10) || PAGE_SIZE));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const start = (pageNum - 1) * size;
  const end = start + size;
  return {
    data: items.slice(start, end),
    pagination: {
      page: pageNum,
      pageSize: size,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  };
}

/* =========================================================================
 * Audit log (append-only)
 * =======================================================================*/
export function logAudit(adminId, adminEmail, action, targetType, targetId, detail) {
  const entry = {
    id: `aud_${Date.now()}_${adminStore.auditLog.length}`,
    adminId,
    adminEmail,
    action,
    targetType,
    targetId,
    detail,
    createdAt: new Date().toISOString()
  };
  adminStore.auditLog.push(entry);
  return entry;
}

/* =========================================================================
 * User Management
 * =======================================================================*/
export async function searchUsers({
  query = "",
  role,
  status,
  page = 1,
  pageSize = PAGE_SIZE
}) {
  let items = adminStore.users;
  const q = String(query).toLowerCase();
  if (q) {
    items = items.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q)
    );
  }
  if (role) {
    items = items.filter((u) => u.role === role);
  }
  if (status) {
    items = items.filter((u) => u.status === status);
  }
  items = [...items].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return paginate(items, page, pageSize);
}

export async function getUserById(id) {
  return adminStore.users.find((u) => u.id === id) ?? null;
}

export async function setUserStatus(id, status, admin) {
  const user = adminStore.users.find((u) => u.id === id);
  if (!user) {
    return { error: "User not found", status: 404 };
  }
  user.status = status;
  user.updatedAt = new Date().toISOString();
  logAudit(admin.sub, admin.email, "user_status_change", "user", id, `status => ${status}`);
  return { user };
}

export async function banUser(id, reason, admin) {
  const user = adminStore.users.find((u) => u.id === id);
  if (!user) {
    return { error: "User not found", status: 404 };
  }
  user.status = "banned";
  user.banReason = reason;
  user.updatedAt = new Date().toISOString();
  adminStore.emitEvent("user_banned", { userId: id, reason, adminId: admin.sub });
  logAudit(admin.sub, admin.email, "user_ban", "user", id, `reason: ${reason}`);
  return { user };
}

/* =========================================================================
 * Job / Listing Moderation
 * =======================================================================*/
export async function getFlaggedJobs({ query = "", page = 1, pageSize = PAGE_SIZE }) {
  let items = adminStore.jobs.filter((j) => j.flagged);
  const q = String(query).toLowerCase();
  if (q) {
    items = items.filter(
      (j) =>
        j.title?.toLowerCase().includes(q) ||
        j.id?.toLowerCase().includes(q)
    );
  }
  items = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return paginate(items, page, pageSize);
}

export async function getJobById(id) {
  return adminStore.jobs.find((j) => j.id === id) ?? null;
}

export async function moderateJob(id, decision, admin, reason = "") {
  const job = adminStore.jobs.find((j) => j.id === id);
  if (!job) {
    return { error: "Job not found", status: 404 };
  }
  job.flagged = false;
  job.flagReason = null;
  job.moderationStatus = decision; // approved | rejected | escalated
  job.moderatedAt = new Date().toISOString();
  job.moderatedBy = admin.sub;
  job.moderationReason = reason || null;
  job.updatedAt = new Date().toISOString();

  if (decision === "rejected") {
    const client = adminStore.users.find((u) => u.id === job.clientId);
    adminStore.emitEvent("listing_rejected", {
      jobId: id,
      title: job.title,
      clientId: job.clientId,
      clientEmail: client?.email,
      reason: reason || "No reason provided",
      adminId: admin.sub
    });
  }

  logAudit(
    admin.sub,
    admin.email,
    "listing_moderation",
    "job",
    id,
    `${decision}${reason ? `: ${reason}` : ""}`
  );
  return { job };
}

/* =========================================================================
 * Dispute Resolution
 * =========================================================================*/
export async function getDisputes({
  status,
  query = "",
  page = 1,
  pageSize = PAGE_SIZE
}) {
  let items = adminStore.disputes;
  if (status) {
    items = items.filter((d) => d.status === status);
  }
  const q = String(query).toLowerCase();
  if (q) {
    items = items.filter(
      (d) =>
        d.title?.toLowerCase().includes(q) ||
        d.id?.toLowerCase().includes(q)
    );
  }
  items = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return paginate(items, page, pageSize);
}

export async function getDisputeById(id) {
  const dispute = adminStore.disputes.find((d) => d.id === id) ?? null;
  if (!dispute) return null;
  const freelancer = adminStore.users.find((u) => u.id === dispute.freelancerId);
  const client = adminStore.users.find((u) => u.id === dispute.clientId);
  const job = adminStore.jobs.find((j) => j.id === dispute.jobId);
  return {
    ...dispute,
    freelancer: freelancer
      ? { id: freelancer.id, email: freelancer.email, fullName: freelancer.fullName }
      : null,
    client: client
      ? { id: client.id, email: client.email, fullName: client.fullName }
      : null,
    job: job ? { id: job.id, title: job.title, budget: job.budget } : null
  };
}

export async function ruleDispute(id, winner, reason, admin, action = "rule") {
  const dispute = adminStore.disputes.find((d) => d.id === id);
  if (!dispute) {
    return { error: "Dispute not found", status: 404 };
  }
  if (dispute.status === "resolved") {
    return { error: "Dispute already resolved", status: 409 };
  }

  dispute.winner = winner;
  dispute.rulingReason = reason;
  dispute.status = "resolved";
  dispute.ruling = {
    adminId: admin.sub,
    adminEmail: admin.email,
    winner,
    reason,
    createdAt: new Date().toISOString()
  };
  dispute.updatedAt = new Date().toISOString();

  if (action === "refund") {
    dispute.transaction = { ...dispute.transaction, status: "refunded" };
  } else if (winner === "freelancer") {
    dispute.transaction = { ...dispute.transaction, status: "released" };
  } else if (winner === "client") {
    dispute.transaction = { ...dispute.transaction, status: "refunded" };
  }

  adminStore.emitEvent("dispute_resolved", {
    disputeId: id,
    winner,
    adminId: admin.sub
  });

  logAudit(
    admin.sub,
    admin.email,
    "dispute_ruling",
    "dispute",
    id,
    `${winner}${action === "refund" ? " + refund" : ""}: ${reason}`
  );
  return { dispute };
}

export async function escalateDispute(id, reason, admin) {
  const dispute = adminStore.disputes.find((d) => d.id === id);
  if (!dispute) {
    return { error: "Dispute not found", status: 404 };
  }
  dispute.status = "under_review";
  dispute.escalated = true;
  dispute.escalationReason = reason;
  dispute.updatedAt = new Date().toISOString();

  logAudit(
    admin.sub,
    admin.email,
    "dispute_escalation",
    "dispute",
    id,
    reason
  );
  return { dispute };
}

/* =========================================================================
 * Metrics / Trust & Metrics Dashboard
 * =======================================================================*/
export async function getMetrics() {
  const totalUsers = adminStore.users.length;
  const activeJobs = adminStore.jobs.filter(
    (j) => !j.flagged && ["open", "in_progress"].includes(j.status)
  ).length;
  const openDisputes = adminStore.disputes.filter(
    (d) => d.status === "open"
  ).length;
  const flaggedListings = adminStore.jobs.filter((j) => j.flagged).length;

  // Revenue: sum of completed/released payments held against disputes + job budgets
  // Using the dispute transaction amounts as the revenue proxy for the current period.
  const revenue = adminStore.disputes
    .filter((d) => d.status === "resolved")
    .reduce((sum, d) => sum + (d.transaction?.amount ?? 0), 0);

  // Trust score distribution buckets
  const trustBuckets = {
    "0-20": 0,
    "21-40": 0,
    "41-60": 0,
    "61-80": 0,
    "81-100": 0
  };
  for (const user of adminStore.users) {
    const score = user.trustScore ?? 0;
    if (score <= 20) trustBuckets["0-20"] += 1;
    else if (score <= 40) trustBuckets["21-40"] += 1;
    else if (score <= 60) trustBuckets["41-60"] += 1;
    else if (score <= 80) trustBuckets["61-80"] += 1;
    else trustBuckets["81-100"] += 1;
  }

  return {
    summary: {
      totalUsers,
      activeJobs,
      openDisputes,
      flaggedListings,
      revenue
    },
    trustDistribution: Object.entries(trustBuckets).map(([range, count]) => ({
      range,
      count
    }))
  };
}

/* =========================================================================
 * Platform Controls
 * =======================================================================*/
export async function getPlatformSettings() {
  return { ...adminStore.platformSettings };
}

export async function updatePlatformSetting(key, value, admin) {
  if (!(key in adminStore.platformSettings)) {
    return { error: `Unknown platform setting: ${key}`, status: 400 };
  }
  const oldValue = adminStore.platformSettings[key];
  adminStore.platformSettings[key] = value;
  logAudit(
    admin.sub,
    admin.email,
    "platform_toggle",
    "platform",
    key,
    `${key} => ${value} (was ${oldValue})`
  );
  return { settings: { ...adminStore.platformSettings } };
}

/* =========================================================================
 * Audit Log
 * =======================================================================*/
export async function getAuditLog({
  admin: adminFilter,
  action: actionFilter,
  startDate,
  endDate,
  page = 1,
  pageSize = PAGE_SIZE
}) {
  let items = adminStore.auditLog;
  if (adminFilter) {
    items = items.filter(
      (e) =>
        e.adminId?.includes(adminFilter) ||
        e.adminEmail?.toLowerCase().includes(String(adminFilter).toLowerCase())
    );
  }
  if (actionFilter) {
    items = items.filter((e) => e.action === actionFilter);
  }
  if (startDate) {
    items = items.filter((e) => Date.parse(e.createdAt) >= Date.parse(startDate));
  }
  if (endDate) {
    items = items.filter((e) => Date.parse(e.createdAt) <= Date.parse(endDate));
  }
  items = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return paginate(items, page, pageSize);
}
