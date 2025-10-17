// apps/web/app/api/ai/compose/[sessionId]/stream/route.ts
import { composeInStages } from "@/lib/ai/composeEngine";
import { saveStreamEvent } from "@/lib/ai/persist";
import { getUserAndOrg } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const { userId, organizationId } = await getUserAndOrg();
    const sessionId = params.sessionId;
    const url = new URL(req.url);
    const brief = url.searchParams.get("brief");

    if (!brief) {
      return NextResponse.json({ ok: false, error: "Missing brief" }, { status: 400 });
    }

    // Load session to get model and temperature
    const supabase = getSupabaseAdmin();
    const { data: session, error: sessionError } = await supabase
      .from("ai_compose_sessions")
      .select("model, temperature")
      .eq("id", sessionId)
      .eq("organization_id", organizationId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: any) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        try {
          for await (const ev of composeInStages({
            sessionId,
            organizationId,
            userId,
            briefInput: { 
              brief,
              durationSec: 180,
              n: 6,
              model: (session.model as any) || "auto",
              familyFriendly: true,
              temperature: session.temperature
            },
          })) {
            await saveStreamEvent({
              sessionId,
              organizationId,
              role: "assistant",
              event: ev,
            }).catch(() => {});
            await send(ev);
            if (ev.type === "done") break;
          }
          controller.close();
        } catch (e: any) {
          await send({ type: "error", error: String(e?.message || e) });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
}
