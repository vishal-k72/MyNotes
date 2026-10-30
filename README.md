# Notes App (React + Supabase)

## Setup

1. [supabase.com](https://supabase.com) par project banao.
2. Dashboard -> **SQL Editor** me `supabase/schema.sql` paste karke Run karo.
3. Dashboard -> **Project Settings -> API** se `Project URL` aur `anon public` key copy karo.
4. `.env.example` ko copy karke `.env` banao aur dono values bharo.
5. Chalao:

```bash
npm install
npm run dev
```

## Buttons

- **Delete all notes** - Supabase se saare notes delete (DELETE type karke confirm karna padta hai)
- **Create JSON file** - saare notes ki backup JSON download
- **Pick JSON file** - JSON chuno, notes preview me dikhenge, phir "Save all" se Supabase me save

## Security

`schema.sql` ki policy anon key wale kisi ko bhi access deti hai, aur passwords plain text me store hote hain.
Sirf personal/local use ke liye. Public deploy karna ho to Supabase Auth (login) lagao.
