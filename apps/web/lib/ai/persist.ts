// apps/web/lib/ai/persist.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { StreamEvent } from "./composeEngine";

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function createComposeSession(args: {
  organizationId: string;
  userId: string;
  brief: string;
  brandContextSnapshot?: any;
}) {
  const supabase = sb();
  const { data, error } = await supabase
    .from("ai_compose_sessions")
    .insert({
      organization_id: args.organizationId,
      user_id: args.userId,
      brief: args.brief,
      brand_context: args.brandContextSnapshot ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function saveStreamEvent(args: {
  sessionId: string;
  organizationId: string;
  role: "system" | "assistant" | "user" | "tool";
  event: StreamEvent;
}) {
  const supabase = sb();
  const content =
    args.event.type === "message" ? args.event.data.text : `[${args.event.type}]`;
  const payload = args.event.type === "message" ? null : (args.event as any);
  await supabase.from("ai_compose_messages").insert({
    session_id: args.sessionId,
    organization_id: args.organizationId,
    role: args.role,
    content,
    payload,
  });
}
