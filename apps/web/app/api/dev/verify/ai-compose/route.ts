// apps/web/app/api/dev/verify/ai-compose/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Check if tables exist and get their columns
    const { data: sessionsColumns, error: sessionsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'ai_compose_sessions');
    
    const { data: messagesColumns, error: messagesError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'ai_compose_messages');
    
    const sessionsExists = !sessionsError && sessionsColumns && sessionsColumns.length > 0;
    const messagesExists = !messagesError && messagesColumns && messagesColumns.length > 0;
    
    return NextResponse.json({
      tables: {
        ai_compose_sessions: {
          exists: sessionsExists,
          columns: sessionsExists ? sessionsColumns.map(c => c.column_name) : []
        },
        ai_compose_messages: {
          exists: messagesExists,
          columns: messagesExists ? messagesColumns.map(c => c.column_name) : []
        }
      },
      required_columns: {
        ai_compose_sessions: ['model', 'temperature', 'prompt_overrides'],
        ai_compose_messages: ['session_id', 'organization_id', 'role', 'content', 'payload']
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      tables: {
        ai_compose_sessions: { exists: false, columns: [] },
        ai_compose_messages: { exists: false, columns: [] }
      }
    }, { status: 500 });
  }
}
