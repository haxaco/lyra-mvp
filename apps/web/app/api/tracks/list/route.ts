import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { r2SignGet } from "@/lib/r2";

export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("tracks")
      .select("id, organization_id, r2_key, flac_r2_key, duration_seconds, created_at, meta, title")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[tracks/list] query error:", error);
      throw error;
    }

    console.log(`[tracks/list] found ${data?.length ?? 0} tracks`);

    const items = await Promise.all(
      (data ?? []).map(async (row) => {
        try {
          const mp3Url = row.r2_key ? await r2SignGet(row.r2_key, 3600) : null;
          const flacUrl = row.flac_r2_key ? await r2SignGet(row.flac_r2_key, 3600) : null;
          return {
            id: row.id,
            organization_id: row.organization_id,
            duration_seconds: row.duration_seconds,
            created_at: row.created_at,
            title: row.title,
            meta: row.meta,
            mp3: row.r2_key ? { key: row.r2_key, url: mp3Url } : null,
            flac: row.flac_r2_key ? { key: row.flac_r2_key, url: flacUrl } : null,
          };
        } catch (err) {
          console.error(`[tracks/list] error processing track ${row.id}:`, err);
          // Return the track anyway with null URLs
          return {
            id: row.id,
            organization_id: row.organization_id,
            duration_seconds: row.duration_seconds,
            created_at: row.created_at,
            title: row.title,
            meta: row.meta,
            mp3: null,
            flac: null,
          };
        }
      })
    );

    console.log(`[tracks/list] returning ${items.length} items`);

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}

