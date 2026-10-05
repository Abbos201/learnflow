import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ADMIN_USERNAME = 'jaloliddin123';
const ADMIN_EMAIL = `${ADMIN_USERNAME}@users.learnflow.local`;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const password = String(body?.password ?? '');

    if (!password) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Parolni kiriting.',
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      });

    if (error || !data.user) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Parol noto‘g‘ri.',
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('id, username, role')
        .eq('id', data.user.id)
        .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== 'admin' ||
      profile.username !== `@${ADMIN_USERNAME}`
    ) {
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          ok: false,
          error: 'Administrator akkaunti topilmadi.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error('Admin login error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Kirishda xatolik yuz berdi.',
      },
      { status: 500 }
    );
  }
}