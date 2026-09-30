import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const identifier = String(body.identifier ?? '').trim();
    const password = String(body.password ?? '');

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required.' },
        { status: 400 }
      );
    }

    let email = identifier;

    // If the user entered a username,
    // resolve username -> email on the server.
    if (!identifier.includes('@')) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .ilike('username', identifier)
        .maybeSingle();

      if (error || !data?.email) {
        return NextResponse.json(
          { error: 'Invalid username/email or password.' },
          { status: 401 }
        );
      }

      email = data.email;
    }

    return NextResponse.json({ email });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request.' },
      { status: 400 }
    );
  }
}