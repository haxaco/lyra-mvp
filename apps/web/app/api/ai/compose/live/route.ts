// apps/web/app/api/ai/compose/live/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createComposeSession } from "@/lib/ai/persist";
import { loadBrandContext } from "@/lib/ai/brandContext";
import { getUserAndOrg } from "@/lib/auth";
import { composeInStages } from "@/lib/ai/composeEngine";
import { saveStreamEvent } from "@/lib/ai/persist";

// Local schema to avoid client/server import issues
const PlaylistBriefSchema = z.object({
  brief: z.string().min(1).max(2000),
  mood: z.string().optional(),
  energy: z.number().int().min(1).max(10).optional(),
  bpmMin: z.number().int().min(40).max(240).optional(),
  bpmMax: z.number().int().min(40).max(240).optional(),
  genres: z.array(z.string()).max(10).optional(),
  bannedTerms: z.array(z.string()).max(50).optional(),
  durationSec: z.number().int().min(30).max(600).default(180),
  n: z.number().int().min(1).max(10).default(6),
  model: z.enum(["auto", "gpt-4o-mini", "gpt-4o", "mureka-6", "mureka-7.5", "mureka-o1"]).default("auto"),
  familyFriendly: z.boolean().default(true),
  seed: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export async function GET(req: Request) {
  try {
    const { userId, organizationId } = await getUserAndOrg();
    const url = new URL(req.url);
    const brief = url.searchParams.get("brief");
    const model = url.searchParams.get("model") || "auto";
    const temperature = parseFloat(url.searchParams.get("temperature") || "0.7");

    if (!brief) {
      return NextResponse.json({ ok: false, error: "Missing brief" }, { status: 400 });
    }

    const brand = await loadBrandContext(organizationId);

    // Create session immediately
    const sessionId = await createComposeSession({
      organizationId,
      userId,
      brief: brief,
      brandContextSnapshot: brand,
      model: model,
      temperature: temperature,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: any) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        
        try {
          // Send session ID first
          await send({ type: "session_created", data: { sessionId } });
          
          // Start the composition stream
          for await (const ev of composeInStages({
            sessionId,
            organizationId,
            userId,
            briefInput: {
              brief,
              model: model as any,
              temperature,
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
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, organizationId } = await getUserAndOrg();
    const body = await req.json();
    const brief = PlaylistBriefSchema.parse(body);
    const brand = await loadBrandContext(organizationId);

    // Create session immediately
    const sessionId = await createComposeSession({
      organizationId,
      userId,
      brief: brief.brief,
      brandContextSnapshot: brand,
      model: brief.model,
      temperature: brief.temperature,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: any) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        
        try {
          // Send session ID first
          await send({ type: "session_created", data: { sessionId } });
          
          // Start the composition stream
          for await (const ev of composeInStages({
            sessionId,
            organizationId,
            userId,
            briefInput: brief,
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
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
}
