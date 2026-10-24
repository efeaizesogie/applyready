import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { ApplicationType, Extraction, Guidance, Importance, KeyDetail } from "./ai/schema";
import type { Plan } from "./plan";

export type ChecklistItem = {
  id: string;
  title: string;
  detail: string | null;
  importance: Importance;
  bestBy: string | null;
  done: boolean;
  position: number;
};

export type Application = {
  id: string;
  userId: string | null;
  email: string | null;
  remindersEnabled: boolean;
  sourceUrl: string | null;
  title: string;
  organization: string | null;
  type: ApplicationType;
  deadline: string | null;
  deadlineText: string | null;
  tight: boolean;
  keyDetails: KeyDetail[];
  guidance: Guidance[];
  status: "in_progress" | "submitted";
  submittedAt: string | null;
  followUpAt: string | null;
  followUpSent: boolean;
  lastReminderAt: string | null;
  items: ChecklistItem[];
};

type ApplicationRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  reminders_enabled: boolean;
  source_url: string | null;
  title: string;
  organization: string | null;
  type: ApplicationType;
  deadline: string | null;
  deadline_text: string | null;
  tight: boolean;
  key_details: KeyDetail[];
  guidance: Guidance[];
  status: "in_progress" | "submitted";
  submitted_at: string | null;
  follow_up_at: string | null;
  follow_up_sent: boolean;
  last_reminder_at: string | null;
  checklist_items?: ItemRow[];
};

type ItemRow = {
  id: string;
  title: string;
  detail: string | null;
  importance: Importance;
  best_by: string | null;
  done: boolean;
  position: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (id: string) => UUID.test(id);

function toItem(r: ItemRow): ChecklistItem {
  return { id: r.id, title: r.title, detail: r.detail, importance: r.importance, bestBy: r.best_by, done: r.done, position: r.position };
}

export function toApplication(r: ApplicationRow): Application {
  return {
    id: r.id,
    userId: r.user_id,
    email: r.email,
    remindersEnabled: r.reminders_enabled,
    sourceUrl: r.source_url,
    title: r.title,
    organization: r.organization,
    type: r.type,
    deadline: r.deadline,
    deadlineText: r.deadline_text,
    tight: r.tight,
    keyDetails: r.key_details,
    guidance: r.guidance,
    status: r.status,
    submittedAt: r.submitted_at,
    followUpAt: r.follow_up_at,
    followUpSent: r.follow_up_sent,
    lastReminderAt: r.last_reminder_at,
    items: (r.checklist_items ?? []).map(toItem).sort((a, b) => a.position - b.position),
  };
}

export async function createApplication(
  extraction: Extraction,
  plan: Extract<Plan, { status: "open" }>,
  sourceUrl: string | null,
): Promise<string> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("applications")
    .insert({
      title: extraction.title || "Untitled application",
      organization: extraction.organization,
      type: extraction.type,
      deadline: plan.deadline,
      deadline_text: extraction.deadlineText,
      tight: plan.tight,
      key_details: extraction.keyDetails,
      guidance: extraction.guidance,
      source_url: sourceUrl,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Saving application failed: ${error.message}`);

  if (plan.items.length) {
    const { error: itemsError } = await db.from("checklist_items").insert(
      plan.items.map((i) => ({
        application_id: data.id,
        title: i.title,
        detail: i.detail,
        importance: i.importance,
        best_by: i.bestBy,
        position: i.position,
      })),
    );
    if (itemsError) {
      await db.from("applications").delete().eq("id", data.id);
      throw new Error(`Saving checklist failed: ${itemsError.message}`);
    }
  }
  return data.id;
}

export async function getApplication(id: string): Promise<Application | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await createAdminClient()
    .from("applications")
    .select("*, checklist_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toApplication(data as ApplicationRow) : null;
}

export async function markSubmitted(id: string, followUpAt: string | null) {
  if (!isUuid(id)) return null;
  const { data, error } = await createAdminClient()
    .from("applications")
    .update({ status: "submitted", submitted_at: new Date().toISOString(), follow_up_at: followUpAt, follow_up_sent: false })
    .eq("id", id)
    .select("id, status, submitted_at, follow_up_at")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listApplicationsForUser(userId: string): Promise<Application[]> {
  const { data, error } = await createAdminClient()
    .from("applications")
    .select("*, checklist_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ApplicationRow[]).map(toApplication);
}

/** In-progress, confirmed applications not yet reminded today and not past their deadline. */
export async function applicationsDueReminder(today: string): Promise<Application[]> {
  const { data, error } = await createAdminClient()
    .from("applications")
    .select("*, checklist_items(*)")
    .eq("status", "in_progress")
    .eq("reminders_enabled", true)
    .not("email", "is", null)
    .or(`deadline.is.null,deadline.gte.${today}`)
    .or(`last_reminder_at.is.null,last_reminder_at.lt.${today}T00:00:00Z`);
  if (error) throw new Error(error.message);
  return (data as ApplicationRow[]).map(toApplication);
}

export async function applicationsDueFollowUp(now: string): Promise<Application[]> {
  const { data, error } = await createAdminClient()
    .from("applications")
    .select("*, checklist_items(*)")
    .eq("status", "submitted")
    .eq("follow_up_sent", false)
    .not("email", "is", null)
    .lte("follow_up_at", now);
  if (error) throw new Error(error.message);
  return (data as ApplicationRow[]).map(toApplication);
}

export async function stampApplication(id: string, fields: { last_reminder_at?: string; follow_up_sent?: boolean }) {
  const { error } = await createAdminClient().from("applications").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setRemindersEnabled(id: string, enabled: boolean) {
  if (!isUuid(id)) return false;
  const { data, error } = await createAdminClient().from("applications").update({ reminders_enabled: enabled }).eq("id", id).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

/** On sign-in: adopt applications saved under this email that no account owns yet. */
export async function attachApplicationsByEmail(userId: string, email: string) {
  const { error } = await createAdminClient()
    .from("applications")
    .update({ user_id: userId, reminders_enabled: true })
    .eq("email", email.toLowerCase())
    .is("user_id", null);
  if (error) throw new Error(error.message);
}

/** Checklist items go with it (on delete cascade). */
export async function deleteApplication(id: string) {
  const { error } = await createAdminClient().from("applications").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Attaches an application to a confirmed email and turns reminders on. Won't steal one another user already owns. */
export async function claimApplication(id: string, userId: string, email: string) {
  const { data, error } = await createAdminClient()
    .from("applications")
    .update({ user_id: userId, email, reminders_enabled: true })
    .eq("id", id)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

export async function setItemDone(itemId: string, done: boolean) {
  if (!isUuid(itemId)) return null;
  const { data, error } = await createAdminClient()
    .from("checklist_items")
    .update({ done })
    .eq("id", itemId)
    .select("id, done, application_id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
