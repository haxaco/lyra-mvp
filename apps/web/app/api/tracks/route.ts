import { NextResponse, type NextRequest } from "next/server";
import { getOrgClientAndId } from "@/lib/org";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supa
      .from("tracks")
      .select("*", { count: 'exact', head: true });

    const { data, error } = await supa
      .from("tracks")
      .select("id, title, duration_seconds, r2_key, flac_r2_key, created_at, meta, artist, mood, play_count, user_liked, genre, provider_id, blueprint")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const totalPages = count ? Math.ceil(count / limit) : 1;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({ 
      ok: true, 
      items: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supa, orgId, userId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    
    // Validate required fields
    if (!body?.title) {
      return NextResponse.json({ ok:false, error:"Missing required field: title" }, { status: 400 });
    }

    // Use admin client for write to bypass RLS if needed
    const admin = supabaseAdmin();
    
    // Get user info for default artist name
    const { data: userData } = await supa.auth.getUser();
    const userEmail = userData?.user?.email || 'Unknown User';
    const defaultArtist = body.artist || userEmail.split('@')[0]; // Use username part of email
    
    const insertData: any = {
      organization_id: orgId,
      title: body.title,
      duration_seconds: body.duration_seconds || null,
      genre: body.genre || null,
      energy: body.energy || null,
      r2_key: body.r2_key || null,
      flac_r2_key: body.flac_r2_key || null,
      job_id: body.job_id || null,
      watermark: body.watermark ?? false,
      meta: body.meta || null,
      artist: defaultArtist,
      mood: body.mood || null,
      provider_id: body.provider_id || null,
      play_count: body.play_count || 0,
      user_liked: body.user_liked ?? false,
    };

    const { data, error } = await admin
      .from("tracks")
      .insert([insertData])
      .select("id, title, duration_seconds, r2_key, created_at, artist, mood, play_count, user_liked, genre, provider_id")
      .single();
    
    if (error) throw error;

    console.log(`[tracks/POST] Created track ${data.id} for org ${orgId}`);
    return NextResponse.json({ ok:true, track: data });
  } catch (e:any) {
    console.error('[tracks/POST] Error:', e);
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) return NextResponse.json({ ok:false, error:"No org in session" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get('id');
    
    if (!trackId) {
      return NextResponse.json({ ok:false, error:"Missing track id parameter" }, { status: 400 });
    }

    // Verify track belongs to org before deleting
    const { data: track } = await supa
      .from("tracks")
      .select("id, organization_id")
      .eq("id", trackId)
      .single();
    
    if (!track) {
      return NextResponse.json({ ok:false, error:"Track not found" }, { status: 404 });
    }

    const { error } = await supa
      .from("tracks")
      .delete()
      .eq("id", trackId);
    
    if (error) throw error;

    console.log(`[tracks/DELETE] Deleted track ${trackId} from org ${orgId}`);
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    console.error('[tracks/DELETE] Error:', e);
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}

