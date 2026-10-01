import { NextResponse } from 'next/server';

export async function POST(request: Request) {
try {
const body = await request.json();


const identifier = String(body.identifier ?? '')
  .trim()
  .toLowerCase();

const password = String(body.password ?? '');

if (!identifier || !password) {
  return NextResponse.json(
    { error: 'Foydalanuvchi nomi va parolni kiriting.' },
    { status: 400 }
  );
}

// @ belgisi bo‘lsa olib tashlaymiz.
const username = identifier.startsWith('@')
  ? identifier.slice(1)
  : identifier;

if (!/^[a-z0-9_]{3,30}$/.test(username)) {
  return NextResponse.json(
    { error: 'Foydalanuvchi nomi noto‘g‘ri.' },
    { status: 400 }
  );
}

// Username orqali texnik email hosil qilinadi.
const email = `${username}@users.learnflow.local`;

return NextResponse.json({ email });


} catch {
return NextResponse.json(
{ error: 'So‘rovni bajarib bo‘lmadi.' },
{ status: 400 }
);
}
}
