import { supabase } from '@/lib/supabase'

export interface ContactFormPayload {
  fullName: string
  email: string
  subject: string
  message: string
  honeypot?: string
}

export async function submitContactMessage(payload: ContactFormPayload) {
  const { data, error } = await supabase.rpc('submit_contact_message', {
    p_full_name: payload.fullName,
    p_email: payload.email,
    p_subject: payload.subject,
    p_message: payload.message,
    p_honeypot: payload.honeypot ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as string
}
