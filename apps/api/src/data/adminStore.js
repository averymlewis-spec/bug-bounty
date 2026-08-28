/**
 * In-memory data store for the admin panel.
 *
 * The production codebase uses Prisma (see packages/db) but it is not wired
 * up yet, so each service module keeps its own in-memory arrays. This store
 * centralises the admin-specific entities (users, jobs, disputes, audit log,
 * platform settings and moderation flags) so the admin controller/service can
 * operate on a single source of truth and the data persists for the lifetime
 * of the process.
 *
 * It is seeded with deterministic sample data so the panel is immediately
 * usable and demonstrable without a database connection.
 */

// -- Platform-wide toggles -------------------------------------------------
const platformSettings = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

// -- Users -----------------------------------------------------------------
const users = [
  {
    id: "usr_001",
    email: "admin@freelanceflow.com",
    fullName: "Admin User",
    role: "admin",
    isVerified: true,
    status: "active",
    trustScore: 98,
    createdAt: "2025-01-01T08:00:00.000Z",
    updatedAt: "2025-01-01T08:00:00.000Z"
  },
  {
    id: "usr_101",
    email: "maya.dev@example.com",
    fullName: "Maya Chen",
    role: "freelancer",
    isVerified: true,
    status: "active",
    trustScore: 87,
    createdAt: "2025-02-14T10:30:00.000Z",
    updatedAt: "2025-02-14T10:30:00.000Z"
  },
  {
    id: "usr_102",
    email: "jordan.ux@example.com",
    fullName: "Jordan Smith",
    role: "freelancer",
    isVerified: true,
    status: "suspended",
    trustScore: 42,
    createdAt: "2025-03-05T14:15:00.000Z",
    updatedAt: "2025-06-10T09:00:00.000Z"
  },
  {
    id: "usr_201",
    email: "acme-corp@example.com",
    fullName: "Acme Corporation",
    role: "client",
    isVerified: true,
    status: "active",
    trustScore: 91,
    createdAt: "2025-01-22T11:45:00.000Z",
    updatedAt: "2025-01-22T11:45:00.000Z"
  },
  {
    id: "usr_202",
    email: "greenfield-studios@example.com",
    fullName: "Greenfield Studios",
    role: "client",
    isVerified: true,
    status: "banned",
    trustScore: 15,
    createdAt: "2025-04-01T16:20:00.000Z",
    updatedAt: "2025-07-19T12:00:00.000Z"
  }
];

// -- Jobs (listings) -------------------------------------------------------
const jobs = [
  {
    id: "job_101",
    title: "Build an AI customer support widget",
    budget: "$1,500",
    clientId: "usr_201",
    status: "open",
    flagged: false,
    flagReason: null,
    createdAt: "2025-05-10T09:00:00.000Z"
  },
  {
    id: "job_102",
    title: "Migrate legacy API to Node.js",
    budget: "$2,800",
    clientId: "usr_201",
    status: "open",
    flagged: true,
    flagReason: "Automated rule: duplicate posting detected",
    createdAt: "2025-05-12T09:00:00.000Z"
  },
  {
    id: "job_103",
    title: "Design SaaS onboarding flows",
    budget: "$900",
    clientId: "usr_202",
    status: "open",
    flagged: true,
    flagReason: "User report: potential spam listing",
    createdAt: "2025-05-15T14:00:00.000Z"
  }
];

// -- Disputes --------------------------------------------------------------
const disputes = [
  {
    id: "dsp_001",
    title: "Unpaid milestone for customer support widget",
    freelancerId: "usr_101",
    clientId: "usr_201",
    jobId: "job_101",
    status: "open",
    raisedBy: "usr_101",
    amount: 1500,
    currency: "USD",
    createdAt: "2025-06-01T10:00:00.000Z",
    updatedAt: "2025-06-01T10:00:00.000Z",
    thread: [
      {
        id: "msg_001",
        authorId: "usr_101",
        authorRole: "freelancer",
        body: "The client refused to release the first milestone payment after I delivered the widget.",
        createdAt: "2025-06-01T09:30:00.000Z"
      },
      {
        id: "msg_002",
        authorId: "usr_201",
        authorRole: "client",
        body: "The widget did not match the agreed spec and had multiple bugs on mobile.",
        createdAt: "2025-06-01T09:45:00.000Z"
      }
    ],
    evidence: [
      {
        id: "ev_001",
        name: "screenshot-deliverable.png",
        url: "/evidence/screenshot-deliverable.png",
        uploadedBy: "usr_101",
        createdAt: "2025-06-01T09:35:00.000Z"
      },
      {
        id: "ev_002",
        name: "contract.pdf",
        url: "/evidence/contract.pdf",
        uploadedBy: "usr_201",
        createdAt: "2025-06-01T09:50:00.000Z"
      }
    ],
    transaction: {
      id: "pay_101",
      amount: 1500,
      currency: "USD",
      status: "held",
      provider: "stripe"
    }
  },
  {
    id: "dsp_002",
    title: "Scope creep on Node.js migration",
    freelancerId: "usr_102",
    clientId: "usr_202",
    jobId: "job_102",
    status: "under_review",
    raisedBy: "usr_102",
    amount: 2800,
    currency: "USD",
    createdAt: "2025-06-05T12:00:00.000Z",
    updatedAt: "2025-06-06T08:00:00.000Z",
    thread: [
      {
        id: "msg_003",
        authorId: "usr_102",
        authorRole: "freelancer",
        body: "The client kept adding requirements outside the original scope.",
        createdAt: "2025-06-05T11:30:00.000Z"
      }
    ],
    evidence: [],
    transaction: {
      id: "pay_102",
      amount: 2800,
      currency: "USD",
      status: "held",
      provider: "stripe"
    },
    ruling: {
      adminId: "usr_001",
      winner: "freelancer",
      reason: "Client acknowledged scope expansion in thread.",
      createdAt: "2025-06-06T08:00:00.000Z"
    }
  }
];

// -- Audit log (append-only) -----------------------------------------------
const auditLog = [
  {
    id: "aud_001",
    adminId: "usr_001",
    adminEmail: "admin@freelanceflow.com",
    action: "platform_toggle",
    targetType: "platform",
    targetId: "registrations",
    detail: "registrationsEnabled => true",
    createdAt: "2025-01-01T08:00:00.000Z"
  }
];

// -- Notification dispatch (in-process; real impl would hit notification svc)
const eventBuffer = [];

function emitEvent(type, payload) {
  eventBuffer.push({ type, payload, createdAt: new Date().toISOString() });
}

export const adminStore = {
  platformSettings,
  users,
  jobs,
  disputes,
  auditLog,
  eventBuffer,
  emitEvent
};
