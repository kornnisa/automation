'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

// ---------- SVG Icon Set (เส้นสาย สไตล์อุตสาหกรรม) ----------
const iconBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className} aria-hidden>
      <path d="M12 3 2.5 19.5h19L12 3Z" />
      <path d="M12 9.5v4.5" />
    </svg>
  )
}

function IconWrench({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className} aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

// LED indicator (ไฟสถานะ)
function Led({ color }: { color: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
}

// สปินเนอร์โหลด
function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  )
}

type Props = {
  embedded?: boolean
  onClose?: () => void
}

export default function MachineFleetStatus({ embedded = false, onClose }: Props) {
  const [machines, setMachines] = useState<any[]>([])
  const [activeAlarms, setActiveAlarms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    const [machinesRes, alarmsRes] = await Promise.all([
      supabase.from('machines').select('*').order('machine_id'),
      supabase.from('alarms').select('*, machines(machine_id, machine_name)').in('status', ['Open', 'In Progress']),
    ])
    if (machinesRes.data) setMachines(machinesRes.data)
    setActiveAlarms(alarmsRes.data || [])
    setLoading(false)
  }

  // แผนผัง: เอา Alarm ค้างล่าสุดของแต่ละเครื่องมาโชว์บนการ์ด (ข้อมูลจริง ไม่ใช่ mock)
  const activeAlarmMap = useMemo(() => {
    const map: Record<string, any> = {}
    activeAlarms.forEach(a => {
      if (!map[a.machine_id]) map[a.machine_id] = a
    })
    return map
  }, [activeAlarms])

  if (loading) {
    return (
      <div className={embedded ? 'min-h-[40vh] flex flex-col items-center justify-center text-gray-500 gap-4' : 'min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-4'}>
        <Spinner className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="font-black uppercase tracking-widest text-sm">Loading Machine Fleet...</p>
      </div>
    )
  }

  return (
    <div className={embedded ? 'p-6 bg-slate-100' : 'p-6 md:p-8 max-w-7xl mx-auto bg-slate-100 min-h-screen'}>
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Machine Status</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="hidden md:flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide bg-white px-3 py-2 rounded-md border border-slate-200 shadow-sm">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" /> Alarm</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-orange-400 animate-pulse" /> ซ่อม</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500" /> ทำงาน</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-gray-400" /> หยุด</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-md shadow-sm border border-slate-200 text-sm font-black text-slate-600 uppercase tracking-widest">
            Total Fleet: {machines.length} Units
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-md bg-gray-900 text-white hover:bg-gray-700 flex items-center justify-center shadow-sm transition-colors"
              aria-label="ปิด"
            >
              <IconClose className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid แบบการ์ด */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map((machine) => {
          const activeAlarm = activeAlarmMap[machine.id]

          // กำหนดสีตามสถานะ
          let statusColor = 'bg-slate-400'
          let statusBg = 'bg-slate-50'
          let ledColor = 'bg-slate-400'

          if (machine.status === 'Running') {
            statusColor = 'bg-green-500'
            statusBg = 'bg-green-50'
            ledColor = 'bg-green-500'
          } else if (machine.status === 'Alarm') {
            statusColor = 'bg-red-500'
            statusBg = 'bg-red-50'
            ledColor = 'bg-red-500'
          } else if (machine.status === 'Maintenance') {
            statusColor = 'bg-orange-500'
            statusBg = 'bg-orange-50'
            ledColor = 'bg-orange-500'
          }

          return (
            <div key={machine.id} className="bg-white rounded-md shadow-sm hover:shadow-md transition-shadow border border-slate-200 overflow-hidden relative flex flex-col">

              {/* แถบสีสถานะด้านซ้ายสุด */}
              <div className={`absolute left-0 top-0 w-2 h-full ${statusColor}`}></div>

              {/* ส่วนหัวการ์ด (Header) */}
              <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ml-2 ${statusBg}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <Led color={ledColor} />
                    <h2 className="text-xl font-black text-slate-800">{machine.machine_id}</h2>
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-0.5">{machine.machine_type}</p>
                </div>
              </div>

              {/* ข้อมูล (ใช้ข้อมูลจริง) */}
              <div className="p-6 ml-2 flex-1 flex flex-col justify-between">

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* กล่องตัวเลข 1 */}
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Location</p>
                    <p className="text-lg font-black text-slate-700 truncate">{machine.location || '—'}</p>
                  </div>

                  {/* กล่องตัวเลข 2 */}
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status</p>
                    <p className="text-lg font-black text-slate-700 tabular-nums">{machine.status || '—'}</p>
                  </div>
                </div>

                {/* แจ้งเตือนเฉพาะเมื่อทำงานผิดปกติ (ข้อมูลจริง) */}
                {activeAlarm && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs font-black text-red-600 flex items-center gap-2 uppercase tracking-wide">
                      <IconAlert className="h-4 w-4" /> {activeAlarm.priority || 'Warning'} · System Fault Detected
                    </p>
                    <p className="text-sm text-red-700 mt-1 font-semibold">{activeAlarm.alarm_description || 'พบความผิดปกติในระบบ'}</p>
                  </div>
                )}
                {machine.status === 'Maintenance' && !activeAlarm && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-xs font-black text-orange-600 flex items-center gap-2 uppercase tracking-wide">
                      <IconWrench className="h-4 w-4" /> Under Maintenance
                    </p>
                  </div>
                )}

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}