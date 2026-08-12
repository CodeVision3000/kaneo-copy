import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  locale: text("locale"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { mode: "date" }),
});

export const sessionTable = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
    activeTeamId: text("active_team_id"),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const accountTable = pgTable(
  "account",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verificationTable = pgTable(
  "verification",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const workspaceTable = pgTable("workspace", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

export const workspaceUserTable = pgTable(
  "workspace_member",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
      }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, {
        onDelete: "cascade",
      }),
    role: text("role").default("member").notNull(),
    joinedAt: timestamp("joined_at", { mode: "date" }).notNull(),
  },
  (table) => [
    index("workspace_member_workspaceId_idx").on(table.workspaceId),
    index("workspace_member_userId_idx").on(table.userId),
  ],
);

export const workspaceBillingTable = pgTable(
  "workspace_billing",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .unique("workspace_billing_workspace_id_unique")
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    foundingFree: boolean("founding_free").notNull().default(false),
    trialEndsAt: timestamp("trial_ends_at", { mode: "date" }),
    creemCustomerId: text("creem_customer_id"),
    creemSubscriptionId: text("creem_subscription_id").unique(),
    creemProductId: text("creem_product_id"),
    plan: text("plan"),
    billingInterval: text("billing_interval"),
    status: text("status"),
    seats: integer("seats").notNull().default(1),
    currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
    canceledAt: timestamp("canceled_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("workspace_billing_workspaceId_idx").on(table.workspaceId)],
);

export const billingEventTable = pgTable("billing_event", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { mode: "date" })
    .defaultNow()
    .notNull(),
});

export const teamTable = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(
      () => /* @__PURE__ */ new Date(),
    ),
  },
  (table) => [index("team_workspaceId_idx").on(table.workspaceId)],
);

export const teamMemberTable = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("teamMember_teamId_idx").on(table.teamId),
    index("teamMember_userId_idx").on(table.userId),
  ],
);

export const invitationTable = pgTable(
  "invitation",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    teamId: text("team_id"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_workspaceId_idx").on(table.workspaceId),
    index("invitation_email_idx").on(table.email),
    index("invitation_inviterId_idx").on(table.inviterId),
  ],
);

export const workspaceRoleTable = pgTable(
  "workspace_role",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    role: text("role").notNull(),
    permission: text("permission").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("workspace_role_workspaceId_idx").on(table.workspaceId),
    index("workspace_role_role_idx").on(table.role),
  ],
);

export const projectTable = pgTable(
  "project",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    slug: text("slug").notNull(),
    icon: text("icon").default("Layout"),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    isPublic: boolean("is_public").default(false),
    archivedAt: timestamp("archived_at", { mode: "date" }),
    lastTaskNumber: integer("last_task_number").notNull().default(0),
    // Utility project attributes. "discipline" drives which work-breakdown vocabulary
    // the project uses (structures and spans vs. work orders vs. bays and equipment).
    discipline: text("discipline"),
    utilityClient: text("utility_client"),
    contractNumber: text("contract_number"),
    workOrderNumber: text("work_order_number"),
    contractType: text("contract_type"),
    voltageKv: text("voltage_kv"),
    mobilizationDate: timestamp("mobilization_date", { mode: "date" }),
    energizationTargetDate: timestamp("energization_target_date", {
      mode: "date",
    }),
    substantialCompletionDate: timestamp("substantial_completion_date", {
      mode: "date",
    }),
  },
  (table) => [
    unique("project_workspace_id_id_unique").on(table.workspaceId, table.id),
    index("project_discipline_idx").on(table.discipline),
  ],
);

export const columnTable = pgTable(
  "column",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    position: integer("position").notNull().default(0),
    icon: text("icon"),
    color: text("color"),
    isFinal: boolean("is_final").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("column_projectId_idx").on(table.projectId)],
);

export const workflowRuleTable = pgTable(
  "workflow_rule",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    integrationType: text("integration_type").notNull(),
    eventType: text("event_type").notNull(),
    columnId: text("column_id")
      .notNull()
      .references(() => columnTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("workflow_rule_projectId_idx").on(table.projectId),
    index("workflow_rule_columnId_idx").on(table.columnId),
  ],
);

export const taskTable = pgTable(
  "task",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    position: integer("position").default(0),
    number: integer("number").default(1),
    userId: text("assignee_id").references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("scheduled"),
    columnId: text("column_id").references(() => columnTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    priority: text("priority").default("routine"),
    startDate: timestamp("start_date", { mode: "date" }),
    dueDate: timestamp("due_date", { mode: "date" }),
    /**
     * The physical position this work is performed at. Optional: project-level tasks
     * (mobilization, submittals) are not tied to a structure or bay.
     */
    gridAssetId: text("grid_asset_id").references(
      (): AnyPgColumn => gridAssetTable.id,
      { onDelete: "set null", onUpdate: "cascade" },
    ),
    /**
     * Why the work is stopped. Kept separate from status so reporting can tell a
     * weather day from a missing material or an unapproved clearance.
     */
    holdReason: text("hold_reason"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_projectId_idx").on(table.projectId),
    index("task_dueDate_idx").on(table.dueDate),
    index("task_assigneeId_idx").on(table.userId),
    index("task_columnId_idx").on(table.columnId),
    index("task_gridAssetId_idx").on(table.gridAssetId),
    unique("task_project_number_unique").on(table.projectId, table.number),
  ],
);

export const taskReminderSentTable = pgTable(
  "task_reminder_sent",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => taskTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    reminderType: text("reminder_type").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_reminder_sent_taskId_idx").on(table.taskId),
    unique("task_reminder_sent_task_type_unique").on(
      table.taskId,
      table.reminderType,
    ),
  ],
);

export const timeEntryTable = pgTable(
  "time_entry",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => taskTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    description: text("description"),
    startTime: timestamp("start_time", { mode: "date" }).notNull(),
    endTime: timestamp("end_time", { mode: "date" }),
    duration: integer("duration").default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("time_entry_taskId_idx").on(table.taskId),
    index("time_entry_userId_idx").on(table.userId),
  ],
);

export const activityTable = pgTable(
  "activity",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => taskTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    type: text("type").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    content: text("content"),
    eventData: jsonb("event_data"),
    externalUserName: text("external_user_name"),
    externalUserAvatar: text("external_user_avatar"),
    externalSource: text("external_source"),
    externalUrl: text("external_url"),
  },
  (table) => [
    index("activity_task_id_idx").on(table.taskId),
    index("activity_userId_idx").on(table.userId),
    unique("activity_task_external_source_external_url_unique").on(
      table.taskId,
      table.externalSource,
      table.externalUrl,
    ),
  ],
);

export const assetTable = pgTable(
  "asset",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    taskId: text("task_id").references(() => taskTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    activityId: text("activity_id").references(() => activityTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    objectKey: text("object_key").notNull().unique(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    kind: text("kind").notNull().default("image"),
    surface: text("surface").notNull().default("description"),
    createdBy: text("created_by").references(() => userTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("asset_workspaceId_idx").on(table.workspaceId),
    index("asset_projectId_idx").on(table.projectId),
    index("asset_taskId_idx").on(table.taskId),
    index("asset_activityId_idx").on(table.activityId),
    index("asset_createdBy_idx").on(table.createdBy),
  ],
);

export const labelTable = pgTable(
  "label",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    taskId: text("task_id").references(() => taskTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    workspaceId: text("workspace_id").references(() => workspaceTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  },
  (table) => [
    index("label_task_id_idx").on(table.taskId),
    index("label_workspace_id_idx").on(table.workspaceId),
    unique("label_task_name_unique").on(table.taskId, table.name),
    uniqueIndex("label_workspace_name_unique")
      .on(table.workspaceId, table.name)
      .where(sql`${table.taskId} is null`),
  ],
);

export const notificationTable = pgTable(
  "notification",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    title: text("title"),
    content: text("content"),
    type: text("type").notNull().default("info"),
    eventData: jsonb("event_data"),
    isRead: boolean("is_read").default(false),
    resourceId: text("resource_id"),
    resourceType: text("resource_type"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("notification_userId_idx").on(table.userId)],
);

export const userNotificationPreferenceTable = pgTable(
  "user_notification_preference",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => userTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    emailEnabled: boolean("email_enabled").default(false).notNull(),
    ntfyEnabled: boolean("ntfy_enabled").default(false).notNull(),
    ntfyServerUrl: text("ntfy_server_url"),
    ntfyTopic: text("ntfy_topic"),
    ntfyToken: text("ntfy_token"),
    gotifyEnabled: boolean("gotify_enabled").default(false).notNull(),
    gotifyServerUrl: text("gotify_server_url"),
    gotifyToken: text("gotify_token"),
    webhookEnabled: boolean("webhook_enabled").default(false).notNull(),
    webhookUrl: text("webhook_url"),
    webhookSecret: text("webhook_secret"),
    taskAssignmentEnabled: boolean("task_assignment_enabled")
      .default(true)
      .notNull(),
    taskCommentEnabled: boolean("task_comment_enabled").default(true).notNull(),
    taskStatusChangeEnabled: boolean("task_status_change_enabled")
      .default(true)
      .notNull(),
    dueDateReminderEnabled: boolean("due_date_reminder_enabled")
      .default(true)
      .notNull(),
    dueDateReminderLeadTimeMinutes: integer(
      "due_date_reminder_lead_time_minutes",
    )
      .default(1440)
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
);

export const userNotificationWorkspaceRuleTable = pgTable(
  "user_notification_workspace_rule",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    isActive: boolean("is_active").default(true).notNull(),
    emailEnabled: boolean("email_enabled").default(false).notNull(),
    ntfyEnabled: boolean("ntfy_enabled").default(false).notNull(),
    gotifyEnabled: boolean("gotify_enabled").default(false).notNull(),
    webhookEnabled: boolean("webhook_enabled").default(false).notNull(),
    projectMode: text("project_mode").default("all").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("user_notification_workspace_rule_userId_idx").on(table.userId),
    index("user_notification_workspace_rule_workspaceId_idx").on(
      table.workspaceId,
    ),
    unique("user_notification_workspace_rule_user_workspace_unique").on(
      table.userId,
      table.workspaceId,
    ),
    unique("user_notification_workspace_rule_workspace_id_id_unique").on(
      table.workspaceId,
      table.id,
    ),
  ],
);

export const userNotificationWorkspaceProjectTable = pgTable(
  "user_notification_workspace_project",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    workspaceRuleId: text("workspace_rule_id").notNull(),
    projectId: text("project_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.workspaceId, table.workspaceRuleId],
      foreignColumns: [
        userNotificationWorkspaceRuleTable.workspaceId,
        userNotificationWorkspaceRuleTable.id,
      ],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.workspaceId, table.projectId],
      foreignColumns: [projectTable.workspaceId, projectTable.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    index("user_notification_workspace_project_ruleId_idx").on(
      table.workspaceRuleId,
    ),
    index("user_notification_workspace_project_projectId_idx").on(
      table.projectId,
    ),
    index("user_notification_workspace_project_workspaceId_projectId_idx").on(
      table.workspaceId,
      table.projectId,
    ),
    index("unwp_workspaceId_workspaceRuleId_idx").on(
      table.workspaceId,
      table.workspaceRuleId,
    ),
    unique("user_notification_workspace_project_rule_project_unique").on(
      table.workspaceRuleId,
      table.projectId,
    ),
  ],
);

export const githubIntegrationTable = pgTable("github_integration", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projectTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .unique(),
  repositoryOwner: text("repository_owner").notNull(),
  repositoryName: text("repository_name").notNull(),
  installationId: integer("installation_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const integrationTable = pgTable(
  "integration",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    type: text("type").notNull(),
    config: text("config").notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("integration_projectId_idx").on(table.projectId),
    index("integration_type_idx").on(table.type),
    unique("integration_project_type_unique").on(table.projectId, table.type),
  ],
);

export const externalLinkTable = pgTable(
  "external_link",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => taskTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    integrationId: text("integration_id")
      .notNull()
      .references(() => integrationTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    resourceType: text("resource_type").notNull(),
    externalId: text("external_id").notNull(),
    url: text("url").notNull(),
    title: text("title"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("external_link_taskId_idx").on(table.taskId),
    index("external_link_integrationId_idx").on(table.integrationId),
    index("external_link_externalId_idx").on(table.externalId),
    index("external_link_resourceType_idx").on(table.resourceType),
  ],
);

export const commentTable = pgTable(
  "comment",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => taskTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("comment_task_idx").on(table.taskId),
    index("comment_user_idx").on(table.userId),
  ],
);

export const taskRelationTable = pgTable(
  "task_relation",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    sourceTaskId: text("source_task_id")
      .notNull()
      .references(() => taskTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    targetTaskId: text("target_task_id")
      .notNull()
      .references(() => taskTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    relationType: text("relation_type").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("task_relation_source_idx").on(table.sourceTaskId),
    index("task_relation_target_idx").on(table.targetTaskId),
  ],
);

export const apikeyTable = pgTable(
  "apikey",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    configId: text("config_id").default("default").notNull(),
    name: text("name"),
    start: text("start"),
    referenceId: text("reference_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    prefix: text("prefix"),
    key: text("key").notNull(),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "cascade",
    }),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at", { mode: "date" }),
    enabled: boolean("enabled").default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").default(true),
    rateLimitTimeWindow: integer("rate_limit_time_window").default(86400000),
    rateLimitMax: integer("rate_limit_max").default(10),
    requestCount: integer("request_count").default(0),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request", { mode: "date" }),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (table) => [
    index("apikey_configId_idx").on(table.configId),
    index("apikey_key_idx").on(table.key),
    index("apikey_referenceId_idx").on(table.referenceId),
    index("apikey_userId_idx").on(table.userId),
  ],
);

export const deviceCodeTable = pgTable(
  "device_code",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    deviceCode: text("device_code").notNull(),
    userCode: text("user_code").notNull(),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    status: text("status").notNull(),
    lastPolledAt: timestamp("last_polled_at", { mode: "date" }),
    pollingInterval: integer("polling_interval"),
    clientId: text("client_id"),
    scope: text("scope"),
  },
  (table) => [
    uniqueIndex("device_code_device_code_uidx").on(table.deviceCode),
    uniqueIndex("device_code_user_code_uidx").on(table.userCode),
    index("device_code_user_id_idx").on(table.userId),
  ],
);

/* ------------------------------------------------------------------------------------
 * Utility domain: the physical grid the work is performed on.
 *
 * A circuit is the electrical asset (a transmission line, a distribution feeder, a
 * substation bus). A grid asset is a discrete position on it -- a structure, a span, a
 * substation bay, a piece of equipment. Together they form the work-breakdown spine:
 * tasks, pay items, and production all hang off a grid asset.
 *
 * Named "grid_asset" because "asset" is already this schema's file-attachment table.
 * ---------------------------------------------------------------------------------- */

export const circuitTable = pgTable(
  "circuit",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    /** Utility's own identifier, e.g. "Line 1234" or feeder "23F4". */
    designation: text("designation").notNull(),
    name: text("name"),
    /** transmission_line | distribution_feeder | substation_bus */
    type: text("type").notNull().default("transmission_line"),
    voltageKv: text("voltage_kv"),
    substationFrom: text("substation_from"),
    substationTo: text("substation_to"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("circuit_projectId_idx").on(table.projectId),
    unique("circuit_project_designation_unique").on(
      table.projectId,
      table.designation,
    ),
  ],
);

export const gridAssetTable = pgTable(
  "grid_asset",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    circuitId: text("circuit_id").references(() => circuitTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    /**
     * Self-reference for containment: a span belongs to a line section, a breaker to a
     * bay. Set null on delete so removing a parent orphans rather than deletes children.
     */
    parentGridAssetId: text("parent_grid_asset_id").references(
      (): AnyPgColumn => gridAssetTable.id,
      { onDelete: "set null", onUpdate: "cascade" },
    ),
    /** structure | span | bay | equipment | foundation | duct_bank | work_order_location */
    assetType: text("asset_type").notNull().default("structure"),
    /** Field identifier: structure number "PS-142", bay "Bay 3", equipment tag "T-1". */
    designation: text("designation").notNull(),
    description: text("description"),
    /** Ordering along a line, so structures sort by position rather than by name. */
    sequence: integer("sequence"),
    latitude: text("latitude"),
    longitude: text("longitude"),
    /** Survey station or mile marker. */
    stationing: text("stationing"),
    voltageKv: text("voltage_kv"),
    /** Discipline-specific fields: pole class and height, framing, conductor size. */
    attributes: jsonb("attributes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("grid_asset_projectId_idx").on(table.projectId),
    index("grid_asset_circuitId_idx").on(table.circuitId),
    index("grid_asset_parentId_idx").on(table.parentGridAssetId),
    index("grid_asset_assetType_idx").on(table.assetType),
    unique("grid_asset_project_designation_unique").on(
      table.projectId,
      table.designation,
    ),
  ],
);

/* ------------------------------------------------------------------------------------
 * Utility domain: what gates the work.
 *
 * Most utility construction cannot start on demand. It waits on a switching clearance
 * from the system operator, on a permit from a municipality or railroad, and on an
 * inspection signature before the next step is allowed. Missing an approved outage window
 * is the single most expensive schedule failure on a T&D job, so these are first-class
 * records rather than notes on a task.
 * ---------------------------------------------------------------------------------- */

export const outageTable = pgTable(
  "outage",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    circuitId: text("circuit_id").references(() => circuitTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    /** The utility's clearance or switching-order number. */
    outageNumber: text("outage_number"),
    title: text("title").notNull(),
    /**
     * planned_outage | clearance | switching_order | hot_line_tag | energization
     * A hot line tag is not an outage but is tracked here because it gates work the
     * same way.
     */
    type: text("type").notNull().default("planned_outage"),
    /** draft | requested | approved | denied | active | released | cancelled */
    status: text("status").notNull().default("draft"),
    /** Requested window, then the window the utility actually granted, then reality. */
    requestedStart: timestamp("requested_start", { mode: "date" }),
    requestedEnd: timestamp("requested_end", { mode: "date" }),
    approvedStart: timestamp("approved_start", { mode: "date" }),
    approvedEnd: timestamp("approved_end", { mode: "date" }),
    actualStart: timestamp("actual_start", { mode: "date" }),
    actualEnd: timestamp("actual_end", { mode: "date" }),
    requestedById: text("requested_by_id").references(() => userTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    /** Free text: the utility-side approver is rarely a user of this system. */
    approvedBy: text("approved_by"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("outage_projectId_idx").on(table.projectId),
    index("outage_circuitId_idx").on(table.circuitId),
    index("outage_status_idx").on(table.status),
    index("outage_requestedById_idx").on(table.requestedById),
  ],
);

/** Many-to-many: one clearance usually covers several tasks. */
export const taskOutageTable = pgTable(
  "task_outage",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => taskTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    outageId: text("outage_id")
      .notNull()
      .references(() => outageTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("task_outage_taskId_idx").on(table.taskId),
    index("task_outage_outageId_idx").on(table.outageId),
    unique("task_outage_task_outage_unique").on(table.taskId, table.outageId),
  ],
);

export const permitTable = pgTable(
  "permit",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    gridAssetId: text("grid_asset_id").references(
      (): AnyPgColumn => gridAssetTable.id,
      { onDelete: "set null", onUpdate: "cascade" },
    ),
    /**
     * row_access | road_opening | dot | railroad | swppp | wetlands |
     * environmental | municipal | other
     */
    type: text("type").notNull().default("other"),
    permitNumber: text("permit_number"),
    description: text("description"),
    issuingAuthority: text("issuing_authority"),
    /** not_required | pending | applied | issued | expired | denied */
    status: text("status").notNull().default("pending"),
    appliedAt: timestamp("applied_at", { mode: "date" }),
    issuedAt: timestamp("issued_at", { mode: "date" }),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("permit_projectId_idx").on(table.projectId),
    index("permit_gridAssetId_idx").on(table.gridAssetId),
    index("permit_status_idx").on(table.status),
    index("permit_expiresAt_idx").on(table.expiresAt),
  ],
);

export const inspectionTable = pgTable(
  "inspection",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    taskId: text("task_id").references(() => taskTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    gridAssetId: text("grid_asset_id").references(
      (): AnyPgColumn => gridAssetTable.id,
      { onDelete: "set null", onUpdate: "cascade" },
    ),
    /**
     * rebar | concrete_pour | torque | grounding | megger | hipot |
     * relay_functional | ct_ratio | oil_sample | punchlist | final
     */
    type: text("type").notNull(),
    description: text("description"),
    /**
     * A hold point must pass before its task may be completed. A rebar inspection
     * before a pour is a hold point; a punchlist walk usually is not.
     */
    isHoldPoint: boolean("is_hold_point").default(false).notNull(),
    /** pending | scheduled | passed | failed | waived */
    status: text("status").notNull().default("pending"),
    scheduledFor: timestamp("scheduled_for", { mode: "date" }),
    performedAt: timestamp("performed_at", { mode: "date" }),
    inspectorName: text("inspector_name"),
    result: text("result"),
    /** Test values: megger readings, torque figures, CT ratios. */
    readings: jsonb("readings"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("inspection_projectId_idx").on(table.projectId),
    index("inspection_taskId_idx").on(table.taskId),
    index("inspection_gridAssetId_idx").on(table.gridAssetId),
    index("inspection_status_idx").on(table.status),
    // Looking up "does this task have an unsatisfied hold point" runs on every
    // status change, so it gets a covering index.
    index("inspection_task_holdpoint_idx").on(
      table.taskId,
      table.isHoldPoint,
      table.status,
    ),
  ],
);

/* ------------------------------------------------------------------------------------
 * Utility domain: who does the work, what it is worth, and what got installed.
 *
 * Utility construction is billed and measured in construction units (CUs): utility-defined
 * codes with a unit of measure, a standard manhour value, and a unit price. An estimate is
 * a list of pay items (CU x quantity); production is the same list filled in as work is
 * completed. That pairing is what makes earned value possible:
 *
 *   earned revenue = installed qty x unit price
 *   earned hours   = installed qty x standard hours
 *
 * Comparing earned hours against actual hours from the daily reports is how a project
 * manager knows whether a job is winning or losing.
 * ---------------------------------------------------------------------------------- */

export const crewTable = pgTable(
  "crew",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    /** Crews are workspace-level: the same crew moves between projects. */
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(),
    /** line | substation | civil | underground | test | support */
    crewType: text("crew_type").notNull().default("line"),
    foremanUserId: text("foreman_user_id").references(() => userTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    isActive: boolean("is_active").default(true).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("crew_workspaceId_idx").on(table.workspaceId),
    index("crew_foremanUserId_idx").on(table.foremanUserId),
    unique("crew_workspace_name_unique").on(table.workspaceId, table.name),
  ],
);

export const crewMemberTable = pgTable(
  "crew_member",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    crewId: text("crew_id")
      .notNull()
      .references(() => crewTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    /** foreman | journeyman | apprentice | groundman | operator | technician */
    classification: text("classification").notNull().default("journeyman"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("crew_member_crewId_idx").on(table.crewId),
    index("crew_member_userId_idx").on(table.userId),
    unique("crew_member_crew_user_unique").on(table.crewId, table.userId),
  ],
);

export const equipmentTable = pgTable(
  "equipment",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    /** Fleet number, the way equipment is actually referred to in the field. */
    unitNumber: text("unit_number").notNull(),
    description: text("description"),
    /**
     * digger_derrick | bucket | crane | puller | tensioner | pickup | trailer |
     * dozer | excavator | other
     */
    equipmentType: text("equipment_type").notNull().default("other"),
    /** Stored as text to avoid binary float rounding on money. */
    hourlyRate: text("hourly_rate"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("equipment_workspaceId_idx").on(table.workspaceId),
    unique("equipment_workspace_unit_unique").on(
      table.workspaceId,
      table.unitNumber,
    ),
  ],
);

export const constructionUnitTable = pgTable(
  "construction_unit",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    /** The catalog is workspace-level so one utility's codes serve all its projects. */
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    /** The utility's code, e.g. an Avangrid PayCU or an Eversource CU number. */
    code: text("code").notNull(),
    description: text("description").notNull(),
    /** EA | LF | CY | TON | HR | LS */
    unitOfMeasure: text("unit_of_measure").notNull().default("EA"),
    discipline: text("discipline"),
    /**
     * Standard manhours and prices per action. Utilities price installing, removing, and
     * transferring the same unit differently -- a pole transfer is not a pole set.
     * Text for exact decimal arithmetic.
     */
    installHours: text("install_hours"),
    removeHours: text("remove_hours"),
    transferHours: text("transfer_hours"),
    installPrice: text("install_price"),
    removePrice: text("remove_price"),
    transferPrice: text("transfer_price"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("construction_unit_workspaceId_idx").on(table.workspaceId),
    index("construction_unit_code_idx").on(table.code),
    unique("construction_unit_workspace_code_unique").on(
      table.workspaceId,
      table.code,
    ),
  ],
);

export const payItemTable = pgTable(
  "pay_item",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    constructionUnitId: text("construction_unit_id")
      .notNull()
      .references(() => constructionUnitTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    /** Optional: a pay item may be scoped to one structure or bay. */
    gridAssetId: text("grid_asset_id").references(
      (): AnyPgColumn => gridAssetTable.id,
      { onDelete: "set null", onUpdate: "cascade" },
    ),
    /** install | remove | transfer | relocate */
    action: text("action").notNull().default("install"),
    estimatedQuantity: text("estimated_quantity").notNull().default("0"),
    /**
     * Snapshotted from the catalog at estimate time. The catalog can be repriced later
     * without silently rewriting the value of work already bid.
     */
    unitPrice: text("unit_price"),
    standardHours: text("standard_hours"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("pay_item_projectId_idx").on(table.projectId),
    index("pay_item_constructionUnitId_idx").on(table.constructionUnitId),
    index("pay_item_gridAssetId_idx").on(table.gridAssetId),
    unique("pay_item_project_unit_action_asset_unique").on(
      table.projectId,
      table.constructionUnitId,
      table.action,
      table.gridAssetId,
    ),
  ],
);

export const dailyReportTable = pgTable(
  "daily_report",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    crewId: text("crew_id").references(() => crewTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    /** Date only in practice; stored as a timestamp for consistency with the schema. */
    reportDate: timestamp("report_date", { mode: "date" }).notNull(),
    foremanUserId: text("foreman_user_id").references(() => userTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    weatherConditions: text("weather_conditions"),
    temperatureHigh: text("temperature_high"),
    temperatureLow: text("temperature_low"),
    workPerformed: text("work_performed"),
    delays: text("delays"),
    visitors: text("visitors"),
    safetyTopic: text("safety_topic"),
    /** draft | submitted | approved */
    status: text("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at", { mode: "date" }),
    approvedByUserId: text("approved_by_user_id").references(
      () => userTable.id,
      { onDelete: "set null", onUpdate: "cascade" },
    ),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("daily_report_projectId_idx").on(table.projectId),
    index("daily_report_crewId_idx").on(table.crewId),
    index("daily_report_reportDate_idx").on(table.reportDate),
    index("daily_report_status_idx").on(table.status),
    // One report per crew per day; a second one is a duplicate, not a revision.
    unique("daily_report_project_crew_date_unique").on(
      table.projectId,
      table.crewId,
      table.reportDate,
    ),
  ],
);

/**
 * The crew's tailboard / JHA for the day. A separate record because it is a distinct
 * signed safety artifact, not a note on the report.
 */
export const tailboardTable = pgTable(
  "tailboard",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    dailyReportId: text("daily_report_id")
      .notNull()
      .unique()
      .references(() => dailyReportTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    jobSteps: text("job_steps"),
    hazards: text("hazards"),
    controls: text("controls"),
    /** Minimum approach distance for the voltage being worked. */
    minimumApproachDistance: text("minimum_approach_distance"),
    groundingPlan: text("grounding_plan"),
    emergencyPlan: text("emergency_plan"),
    /** [{ name, userId?, signedAt }] -- crews include people without accounts. */
    signatures: jsonb("signatures"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("tailboard_dailyReportId_idx").on(table.dailyReportId)],
);

/**
 * Payroll hours per person per day. Separate from `time_entry`, which is a per-task
 * stopwatch with no notion of overtime or classification.
 */
export const laborEntryTable = pgTable(
  "labor_entry",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    dailyReportId: text("daily_report_id")
      .notNull()
      .references(() => dailyReportTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    /** Crews include people without accounts, so a name is always kept. */
    workerName: text("worker_name").notNull(),
    classification: text("classification").notNull().default("journeyman"),
    regularHours: text("regular_hours").notNull().default("0"),
    overtimeHours: text("overtime_hours").notNull().default("0"),
    doubleTimeHours: text("double_time_hours").notNull().default("0"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("labor_entry_dailyReportId_idx").on(table.dailyReportId),
    index("labor_entry_userId_idx").on(table.userId),
  ],
);

export const equipmentEntryTable = pgTable(
  "equipment_entry",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    dailyReportId: text("daily_report_id")
      .notNull()
      .references(() => dailyReportTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    equipmentId: text("equipment_id")
      .notNull()
      .references(() => equipmentTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    hoursUsed: text("hours_used").notNull().default("0"),
    hoursIdle: text("hours_idle").notNull().default("0"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("equipment_entry_dailyReportId_idx").on(table.dailyReportId),
    index("equipment_entry_equipmentId_idx").on(table.equipmentId),
    unique("equipment_entry_report_equipment_unique").on(
      table.dailyReportId,
      table.equipmentId,
    ),
  ],
);

/**
 * Quantity of a pay item installed on a date. This is the row that drives billing and
 * earned value, so it keeps its own project and date rather than relying on the daily
 * report -- office staff also post production against a period without a field report.
 */
export const productionEntryTable = pgTable(
  "production_entry",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    payItemId: text("pay_item_id")
      .notNull()
      .references(() => payItemTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    dailyReportId: text("daily_report_id").references(
      () => dailyReportTable.id,
      { onDelete: "set null", onUpdate: "cascade" },
    ),
    crewId: text("crew_id").references(() => crewTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    quantity: text("quantity").notNull().default("0"),
    entryDate: timestamp("entry_date", { mode: "date" }).notNull(),
    enteredByUserId: text("entered_by_user_id").references(() => userTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("production_entry_projectId_idx").on(table.projectId),
    index("production_entry_payItemId_idx").on(table.payItemId),
    index("production_entry_dailyReportId_idx").on(table.dailyReportId),
    index("production_entry_crewId_idx").on(table.crewId),
    index("production_entry_entryDate_idx").on(table.entryDate),
  ],
);

// Auth-schema compatible aliases in schema.ts
export const user = userTable;
export const session = sessionTable;
export const account = accountTable;
export const verification = verificationTable;
export const workspace = workspaceTable;
export const team = teamTable;
export const teamMember = teamMemberTable;
export const workspace_member = workspaceUserTable;
export const invitation = invitationTable;
export const organizationRole = workspaceRoleTable;
export const apikey = apikeyTable;
export const deviceCode = deviceCodeTable;

// Auth-schema compatible relation exports in schema.ts
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  teamMembers: many(teamMember),
  workspace_members: many(workspace_member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const workspaceRelations = relations(workspace, ({ many }) => ({
  teams: many(team),
  workspace_members: many(workspace_member),
  invitations: many(invitation),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [team.workspaceId],
    references: [workspace.id],
  }),
  teamMembers: many(teamMember),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}));

export const workspace_memberRelations = relations(
  workspace_member,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [workspace_member.workspaceId],
      references: [workspace.id],
    }),
    user: one(user, {
      fields: [workspace_member.userId],
      references: [user.id],
    }),
  }),
);

export const invitationRelations = relations(invitation, ({ one }) => ({
  workspace: one(workspace, {
    fields: [invitation.workspaceId],
    references: [workspace.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const organizationRoleRelations = relations(
  organizationRole,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [organizationRole.workspaceId],
      references: [workspace.id],
    }),
  }),
);
