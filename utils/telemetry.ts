import { supabaseServer } from '@/lib/supabaseServer'

export async function trackEvent(userId: string, event_type: string, meta?: Record<string, any>) {
  try {
    await supabaseServer.from('telemetry_events').insert([{ user_id: userId, event_type, meta: meta || null }])
  } catch (e) {
    console.warn('telemetry insert failed', e)
  }
}
