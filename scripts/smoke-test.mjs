/**
 * Phase 6 smoke checks against live Supabase (anon key only).
 * Usage: node --env-file=.env scripts/smoke-test.mjs
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)
const results = []

function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  const mark = ok ? 'PASS' : 'FAIL'
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function run() {
  console.log(`Smoke testing ${url}\n`)

  {
    const { data, error } = await supabase.from('profiles').select('id, full_name').limit(1)
    record('Public can read profiles', !error, error?.message || `${data?.length ?? 0} row(s)`)
  }

  {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, is_published')
      .eq('is_published', true)
    record(
      'Public can read published projects',
      !error,
      error?.message || `${data?.length ?? 0} published`,
    )
  }

  {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, is_published')
      .eq('is_published', false)
    const leaked = (data ?? []).length > 0
    record(
      'Anon cannot see draft projects via RLS',
      !error && !leaked,
      error?.message || (leaked ? `leaked ${data.length} draft(s)` : '0 drafts visible'),
    )
  }

  {
    const { data, error } = await supabase.from('contact_messages').select('id').limit(1)
    const blocked =
      Boolean(error) ||
      error?.code === 'PGRST301' ||
      (Array.isArray(data) && data.length === 0 && !error) ||
      // Prefer explicit denial; empty + no error can also mean zero messages.
      // Treat readable rows as failure.
      false
    // If query succeeds with rows, that is a failure. If it succeeds empty, warn but pass.
    if (!error && (data?.length ?? 0) > 0) {
      record('Anon cannot read contact messages', false, `readable rows: ${data.length}`)
    } else if (error) {
      record('Anon cannot read contact messages', true, error.message)
    } else {
      record(
        'Anon cannot read contact messages',
        true,
        '0 rows returned (RLS may hide rows; confirm with a known message in admin)',
      )
      void blocked
    }
  }

  {
    const { data, error } = await supabase.from('admin_users').select('id').limit(1)
    if (!error && (data?.length ?? 0) > 0) {
      record('Anon cannot read admin_users', false, `readable rows: ${data.length}`)
    } else if (error) {
      record('Anon cannot read admin_users', true, error.message)
    } else {
      record('Anon cannot read admin_users', true, '0 rows returned')
    }
  }

  {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key')
      .in('key', ['homepage', 'contact'])
    record(
      'Public can read site settings',
      !error,
      error?.message || `keys: ${(data ?? []).map((r) => r.key).join(', ') || 'none'}`,
    )
  }

  {
    const { data, error } = await supabase.rpc('submit_contact_message', {
      p_full_name: 'Smoke Bot',
      p_email: 'smoke-bot@example.com',
      p_subject: 'Phase 6 honeypot check',
      p_message: 'This should be ignored by honeypot handling.',
      p_honeypot: 'filled-by-bot',
    })
    record(
      'Contact RPC accepts honeypot without storing intent',
      !error && Boolean(data),
      error?.message || `returned id ${data}`,
    )
  }

  {
    const { data, error } = await supabase.storage.from('portfolio-media').list('', {
      limit: 1,
    })
    record(
      'Storage portfolio-media is reachable',
      !error,
      error?.message || `listed ${data?.length ?? 0} item(s)`,
    )
  }

  const failed = results.filter((item) => !item.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length > 0) process.exit(1)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
