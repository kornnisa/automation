import { supabase } from '@/lib/supabase'

// บันทึกทุกการกระทำของ Technician ลงตาราง activity_logs
// action: 'add' (บันทึกซ่อม) | 'edit' (แก้ไขซ่อม) | 'close' (ปิดงาน) | 'status' (เปลี่ยนสถานะแจ้งเตือน)
export async function logActivity(payload: {
  action: string
  details?: string
  machine_code?: string
  machine_name?: string
  alarm_code?: string
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('activity_logs').insert([
      {
        user_id: user.id,
        action: payload.action,
        details: payload.details || null,
        machine_code: payload.machine_code || null,
        machine_name: payload.machine_name || null,
        alarm_code: payload.alarm_code || null,
      },
    ])
    if (error) console.error('[activity_log]', error.message)
  } catch (e) {
    console.error('[activity_log]', e)
  }
}