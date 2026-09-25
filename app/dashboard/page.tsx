'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import MachineFleetStatus from '@/components/MachineFleetStatus'

// ---------- SVG Icon Set (เส้นสาย สไตล์อุตสาหกรรม) ----------
const iconBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
}

function IconFactory({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className} aria-hidden>
      <path d="M3 21h18" />
      <path d="M5 21V7l5-4v18" />
      <path d="M10 21v-6l5 3v3" />
      <path d="M15 21V8l6 3v10" />
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

function IconAlert({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className} aria-hidden>
      <path d="M12 3 2.5 19.5h19L12 3Z" />
      <path d="M12 9.5v4.5" />
      <circle cx="12" cy="17" r="0.25" fill="currentColor" />
    </svg>
  )
}

function IconPower({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className} aria-hidden>
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 5-5.5" />
    </svg>
  )
}

function IconActivity({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

// สปินเนอร์โหลด (วงกลมหมุน)
function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  )
}

// LED indicator (ไฟสถานะ)
function Led({ color, onClick }: { color: string; onClick?: () => void }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color} ${onClick ? 'animate-pulse' : ''}`} />
}

// นาฬิกาสด (ช่วงเวลาทำงานจริง)
// ---------- บล็อกเครื่องในผังโรงงาน (ปุ่มกดดูรายละเอียด) ----------
function MachineBlock({ m, active, onClick }: { m: any; active: any; onClick: () => void }) {
  const s = m.status

  // ธีมสถานะแบบเดียวกับการ์ดฝั่ง Admin
  let statusColor = 'bg-slate-400'
  let statusBg = 'bg-slate-50'
  let ledColor = 'bg-slate-400'

  if (s === 'Running') {
    statusColor = 'bg-green-500'
    statusBg = 'bg-green-50'
    ledColor = 'bg-green-500'
  } else if (s === 'Alarm') {
    statusColor = 'bg-red-500'
    statusBg = 'bg-red-50'
    ledColor = 'bg-red-500'
  } else if (s === 'Maintenance') {
    statusColor = 'bg-orange-500'
    statusBg = 'bg-orange-50'
    ledColor = 'bg-orange-500'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-md shadow-sm hover:shadow-md transition-shadow border border-slate-200 overflow-hidden text-left flex flex-col bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
    >
      {/* แถบสีสถานะด้านซ้ายสุด */}
      <div className={`absolute left-0 top-0 w-2 h-full ${statusColor}`}></div>

      {/* ส่วนหัวการ์ด (Header) */}
      <div className={`px-4 py-3 border-b border-slate-100 flex justify-between items-center ml-2 ${statusBg}`}>
        <div>
          <div className="flex items-center gap-2">
            <Led color={ledColor} />
            <h2 className="text-lg font-black text-slate-800">{m.machine_id}</h2>
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{m.machine_type}</p>
        </div>
      </div>

      {/* ข้อมูล (ใช้ข้อมูลจริง) */}
      <div className="px-4 py-4 ml-2 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* กล่องตัวเลข 1 */}
          <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Location</p>
            <p className="text-base font-black text-slate-700 truncate">{m.location || '—'}</p>
          </div>

          {/* กล่องตัวเลข 2 */}
          <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status</p>
            <p className="text-base font-black text-slate-700 tabular-nums">{s || '—'}</p>
          </div>
        </div>

        {/* แจ้งเตือนเฉพาะเมื่อทำงานผิดปกติ */}
        {active && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-md">
            <p className="text-[11px] font-black text-red-600 flex items-center gap-2 uppercase tracking-wide">
              <IconAlert className="h-4 w-4" /> {active.priority || 'Warning'} · System Fault Detected
            </p>
            <p className="text-xs text-red-700 mt-1 font-semibold">{active.alarm_description || 'พบความผิดปกติในระบบ'}</p>
          </div>
        )}
        {s === 'Maintenance' && !active && (
          <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-[11px] font-black text-orange-600 flex items-center gap-2 uppercase tracking-wide">
              <IconWrench className="h-4 w-4" /> Under Maintenance
            </p>
          </div>
        )}
      </div>
    </button>
  )
}

// ---------- มุมมองฝั่งช่างเทคนิค (Task Board) ----------
// ---------- Metadata + แถวแสดงผล Activity (ใช้ร่วม Admin / Technician) ----------
const activityMeta: Record<string, { icon: any; cls: string; prefix: string }> = {
  add: { icon: IconWrench, cls: 'bg-orange-500 text-white', prefix: 'บันทึกงานซ่อม' },
  maintenance: { icon: IconWrench, cls: 'bg-orange-500 text-white', prefix: 'บันทึกงานซ่อม' },
  edit: { icon: IconWrench, cls: 'bg-blue-600 text-white', prefix: 'แก้ไขงานซ่อม' },
  close: { icon: IconCheck, cls: 'bg-green-600 text-white', prefix: 'ปิดงาน' },
  machine: { icon: IconFactory, cls: 'bg-blue-600 text-white', prefix: '' },
  machineEdit: { icon: IconFactory, cls: 'bg-sky-600 text-white', prefix: '' },
  machineDelete: { icon: IconFactory, cls: 'bg-red-600 text-white', prefix: '' },
}

function ActivityRow({ act }: { act: any }) {
  const meta = activityMeta[act.type] || { icon: IconFactory, cls: 'bg-blue-600 text-white', prefix: 'อัปเดต' }
  const Icon = meta.icon
  const text = meta.prefix
    ? `${meta.prefix}: ${act.details || ''}${act.alarm_code ? ' (' + act.alarm_code + ')' : ''}`
    : act.details || ''
  return (
    <div className="relative pl-6">
      <div className={`absolute -left-[17px] top-1 h-8 w-8 rounded flex items-center justify-center border-2 border-white shadow-sm ${meta.cls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-black text-gray-900 tracking-wide">{act.machine_id}</span>
          <span className="text-sm font-bold text-gray-500">{act.machine_name}</span>
          <span className="text-xs text-gray-400 ml-auto">{act.date?.toLocaleString('th-TH') || ''}</span>
        </div>
        <p className="text-gray-700 text-sm mt-1">{text}</p>
      </div>
    </div>
  )
}

function TechnicianTaskView() {
  const [alarms, setAlarms] = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMachine, setViewMachine] = useState<any | null>(null)
  const [showFloor, setShowFloor] = useState(false)
  const [machineMaint, setMachineMaint] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  const loadData = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const alarmsP = await supabase
        .from('alarms')
        .select('*, machines(machine_id, machine_name, machine_type)')
        .order('created_at', { ascending: true })

      if (!alarmsP.error && alarmsP.data) setAlarms(alarmsP.data)

      const machinesP = await supabase.from('machines').select('id, machine_id, machine_name, machine_type, location, status')
      if (!machinesP.error && machinesP.data) setMachines(machinesP.data)

      // Activity Log: บันทึกทุกการทำงานของระบบ (ใช้ร่วมกัน 2 ฝั่ง)
      const recentLogs = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      let activities: any[] = []
      if (recentLogs.error) {
        // ตาราง activity_logs ยังไม่ถูกสร้าง → ว่าง (ไม่ block หน้า)
      } else if (recentLogs.data) {
        activities = recentLogs.data
          .filter((l: any) => !['alarm', 'alarmEdit', 'status'].includes(l.action))
          .map((l: any) => ({
            ...l,
            type: l.action,
            machine_id: l.machine_code,
            machine_name: l.machine_name,
            date: new Date(l.created_at),
          }))
      }
      activities = activities.filter(a => a.machine_id || a.machine_name || a.details || a.alarm_code)
      setRecentActivities(activities.slice(0, 10))
    } finally {
      setLoading(false)
      if (!silent) setRefreshing(false)
    }
  }

  const fetchData = () => loadData(false)

  // โหลดครั้งแรก + อัปเดตอัตโนมัติทุก 5 วินาที (เงียบ ไม่เด้ง Overlay)
  useEffect(() => {
    loadData(false)
    const t = setInterval(() => loadData(true), 5000)
    return () => clearInterval(t)
  }, [])

  // --- ข้อมูลสำหรับ Visual Floor Plan ---
  // แผนที่ Alarm ค้างตามเครื่อง (เครื่องไหนมีปัญหา)
  const activeMap: Record<string, any> = {}
  alarms
    .filter(a => a.status === 'Open' || a.status === 'In Progress')
    .forEach(a => { if (!activeMap[a.machine_id]) activeMap[a.machine_id] = a })

  // เปิด Modal รายละเอียดเครื่อง
  const openMachine = async (m: any) => {
    setViewMachine(m)
    setMachineMaint([])
    const { data } = await supabase
      .from('maintenance_records')
      .select('details, created_at')
      .eq('machine_id', m.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setMachineMaint(data)
  }

  // Alarm ค้าง (เรียงล่าสุดก่อน) สำหรับบล็อก Alarm ของช่าง
  const techAlarms = alarms
    .filter(a => a.status !== 'Closed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Alarm ค้าง + Alarm ที่ปิดแล้วของเครื่องที่เลือก
  const mActive = viewMachine ? alarms.filter(a => a.machine_id === viewMachine.id && a.status !== 'Closed') : []
  const mClosed = viewMachine ? alarms.filter(a => a.machine_id === viewMachine.id && a.status === 'Closed').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5) : []

  // สีหัว Modal ตามสถานะเครื่อง
  const viewBorder = viewMachine
    ? viewMachine.status === 'Alarm' ? 'border-red-600'
      : viewMachine.status === 'Maintenance' ? 'border-orange-500'
        : viewMachine.status === 'Stop' ? 'border-gray-600' : 'border-green-600'
    : 'border-gray-800'
  const viewText = viewMachine
    ? viewMachine.status === 'Alarm' ? 'text-red-600'
      : viewMachine.status === 'Maintenance' ? 'text-orange-500'
        : viewMachine.status === 'Stop' ? 'text-gray-500' : 'text-green-600'
    : 'text-gray-800'

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* หัว */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">Technician</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60 text-sm font-bold tracking-wider uppercase px-4 py-2 rounded-md shadow-sm transition-colors flex items-center gap-2"
          >
            <IconRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* --- Layout แนว: สรุปจำนวนเครื่อง + Alarm | Activity Log --- */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* คอลัมน์ซ้าย: สรุปจำนวนเครื่อง + Alarm */}
        <div className="xl:col-span-2 space-y-6">
        {/* สรุปจำนวนเครื่องทั้งหมด → กดเปิด Machine Status */}
        <button
          onClick={() => setShowFloor(true)}
          className="bg-white rounded-md shadow overflow-hidden w-full text-left hover:shadow-lg hover:-translate-y-0.5 transition transform focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
        >
          <div className="flex items-stretch">
            <div className="bg-blue-700 px-4 py-4 flex items-center gap-3 flex-1 min-w-0">
              <IconFactory className="h-5 w-5 text-white shrink-0" />
              <h2 className="text-lg font-black text-white uppercase tracking-wide truncate">Machine</h2>
            </div>
            <div className="bg-white w-24 px-3 py-4 flex items-center justify-center border-l border-blue-700">
              <p className="text-4xl font-black text-gray-900 tabular-nums leading-none">{machines.length}</p>
            </div>
          </div>
        </button>

        {/* --- Alarm (แบบฝั่ง Admin) --- */}
        <div className="bg-white rounded-md shadow overflow-hidden flex flex-col border-t-4 border-red-600">
          <div className="bg-red-50 px-5 py-4 border-b border-red-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Led color="bg-red-500 animate-pulse" />
              <h2 className="text-lg font-black text-red-800 uppercase tracking-wide">
                Alarm
              </h2>
            </div>
            <span className="text-xs font-bold text-red-600 tracking-widest">{techAlarms.length} UNITS</span>
          </div>
          <div className="p-5 flex-1">
            {techAlarms.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 py-8">
                <IconCheck className="h-10 w-10 text-gray-300" />
                <p className="font-bold tracking-wide uppercase text-sm">All Clear</p>
              </div>
            ) : (
              <div className="space-y-4">
                {techAlarms.map((alarm) => (
                  <div key={alarm.id} className="p-4 border-l-4 border-red-500 bg-red-50/60 rounded-r flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <Led color={alarm.status === 'In Progress' ? 'bg-orange-400 animate-pulse' : 'bg-red-500 animate-pulse'} />
                        <p className="font-black text-red-700 text-lg tracking-wide">{alarm.alarm_code || alarm.machines?.machine_id}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-500 mt-1">
                        {alarm.machines?.machine_id} · {alarm.machines?.machine_name}
                      </p>
                      <p className="text-gray-700 text-sm mt-2">{alarm.alarm_description || 'พบความผิดปกติในระบบ'}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-black text-white rounded-sm ${
                        alarm.status === 'In Progress' ? 'bg-orange-500' : 'bg-red-600'
                      }`}>
                        {alarm.status}
                      </span>
                    </div>
                    <Link href="/dashboard/alarms">
                      <button className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition text-sm font-bold tracking-wider uppercase whitespace-nowrap">
                        จัดการ
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* --- Activity Log --- */}
      <div className="bg-white rounded-md shadow overflow-hidden flex flex-col border-t-4 border-gray-800 xl:col-span-3">
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <IconActivity className="h-5 w-5 text-gray-700" />
            <div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Activity Log</h2>
            </div>
          </div>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center border-2 border-gray-300 hover:border-blue-600 bg-white px-3 py-1.5 rounded text-sm font-black text-gray-700 hover:text-blue-700 uppercase tracking-wide shadow-sm transition-colors"
          >
            History Log
          </Link>
        </div>
        <div className="p-5 flex-1">
          {recentActivities.length === 0 ? (
            <p className="text-center text-gray-500 py-8">ยังไม่มีการบันทึกการทำงานในระบบ</p>
          ) : (
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
              {recentActivities.map((act, index) => (
                <ActivityRow key={index} act={act} />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {loading && (
        <div className="min-h-[40vh] flex items-center justify-center gap-3 text-gray-500">
          <Spinner className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="font-bold tracking-wide uppercase text-sm">กำลังโหลดงาน...</span>
        </div>
      )}

      {/* --- Modal แผนผังโรงงาน --- */}
      {showFloor && (
        <div className="fixed inset-0 z-50 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowFloor(false)}>
          <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden border-t-4 border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-900 px-5 py-4 flex flex-col md:flex-row justify-between md:items-center gap-3">
              <div className="flex items-center gap-3">
                <IconFactory className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-black text-white uppercase tracking-wide">Machine Status</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-wrap items-center gap-2 text-xs font-bold text-white uppercase tracking-wide">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 border border-gray-700"><span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" /> Alarm</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 border border-gray-700"><span className="h-3 w-3 rounded-full bg-orange-400 animate-pulse" /> ซ่อม</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 border border-gray-700"><span className="h-3 w-3 rounded-full bg-green-500" /> ทำงาน</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 border border-gray-700"><span className="h-3 w-3 rounded-full bg-gray-400" /> หยุด</span>
                </div>
                <button onClick={() => setShowFloor(false)} className="bg-gray-700 hover:bg-gray-600 text-white font-black w-8 h-8 rounded text-sm">X</button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto space-y-8">
              {machines.length === 0 ? (
                <p className="text-center text-gray-500 py-8 font-bold">ยังไม่มีเครื่องจักรในระบบ</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {machines.map(m => (
                    <MachineBlock key={m.id} m={m} active={activeMap[m.id]} onClick={() => openMachine(m)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Modal รายละเอียดเครื่อง --- */}
      {viewMachine && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewMachine(null)}>
          <div className={`bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border-t-4 ${viewBorder}`} onClick={e => e.stopPropagation()}>
            {/* หัว */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Led color={viewMachine.status === 'Alarm' ? 'bg-red-500 animate-pulse' : viewMachine.status === 'Maintenance' ? 'bg-orange-400 animate-pulse' : viewMachine.status === 'Stop' ? 'bg-gray-400' : 'bg-green-500'} />
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide leading-none">{viewMachine.machine_id}</h3>
                  <p className="text-sm font-bold text-gray-500 mt-0.5">{viewMachine.machine_name || viewMachine.machine_type}</p>
                </div>
              </div>
              <button onClick={() => setViewMachine(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-600 font-black w-8 h-8 rounded text-sm">X</button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* สถานะ */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-black uppercase tracking-wide text-white ${
                  viewMachine.status === 'Alarm' ? 'bg-red-600' : viewMachine.status === 'Maintenance' ? 'bg-orange-500' : viewMachine.status === 'Stop' ? 'bg-gray-600' : 'bg-green-600'
                }`}>
                  {viewMachine.status}
                </span>
                <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-600 text-xs font-bold">{viewMachine.machine_type || '—'}</span>
                <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-600 text-xs font-bold">{viewMachine.location || '—'}</span>
              </div>

              {/* Alarm ที่ค้าง (แสดงเฉพาะเครื่องที่มี alarm ค้าง) */}
              {mActive.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Alarm ที่ค้าง ({mActive.length})</h4>
                  <div className="space-y-2">
                    {mActive.map(a => (
                      <div key={a.id} className={`p-3 rounded-r border-l-4 ${a.priority === 'Critical' ? 'border-red-600 bg-red-50/60' : 'border-yellow-400 bg-yellow-50/60'}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${a.priority === 'Critical' ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black'}`}>{a.priority || 'Warning'}</span>
                          <span className="font-black text-gray-900">{a.alarm_code}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black text-white ${a.status === 'In Progress' ? 'bg-orange-500' : 'bg-red-600'}`}>{a.status}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{a.alarm_description || 'พบความผิดปกติ'}</p>
                        <p className="text-xs text-gray-400 font-bold mt-1">แจ้ง: {new Date(a.created_at).toLocaleString('th-TH')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ประวัติการซ่อมล่าสุด */}
              <div>
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">ประวัติการซ่อมล่าสุด</h4>
                {machineMaint.length === 0 ? (
                  <p className="text-sm font-bold text-gray-400">ยังไม่มีประวัติการซ่อม</p>
                ) : (
                  <div className="space-y-2">
                    {machineMaint.map((r, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-800 font-semibold whitespace-pre-wrap">{r.details}</p>
                        <p className="text-xs text-gray-400 font-bold mt-1">{new Date(r.created_at).toLocaleString('th-TH')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alarm ที่ปิดแล้ว */}
              {mClosed.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Alarm ที่ปิดแล้ว</h4>
                  <div className="space-y-1.5">
                    {mClosed.map(a => (
                      <div key={a.id} className="flex items-center justify-between text-sm px-3 py-2 bg-gray-50 rounded">
                        <span className="font-bold text-gray-700">{a.alarm_code} <span className="text-gray-400 font-semibold">({a.alarm_description || '—'})</span></span>
                        <span className="text-xs text-gray-400 font-bold">{new Date(a.created_at).toLocaleString('th-TH')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Overlay รีเฟรชทั้งหน้า --- */}
      {refreshing && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-md shadow-xl px-10 py-8 flex flex-col items-center gap-4 border-t-4 border-blue-600">
            <Spinner className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="font-black uppercase tracking-[0.2em] text-gray-800 text-sm">กำลังรีเฟรชข้อมูล...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- ตัวล็อก: แยกหน้าจอตาม Role ----------
export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!error && data) setRole(data.role)
      }
      setLoading(false)
    }
    check()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-4">
        <Spinner className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    )
  }

  if (role?.toLowerCase() === 'technician') return <TechnicianTaskView />
  return <AdminDashboardView />
}

// ---------- มุมมองฝั่งแอดมิน (Fleet Monitor) ----------
function AdminDashboardView() {
  const [stats, setStats] = useState({
    total: 0,
    alarm: 0,
    maintenance: 0,
    stopped: 0
  })
  const [activeAlarms, setActiveAlarms] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showFleet, setShowFleet] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setRefreshing(true)
    try {
      // 1. ดึงข้อมูลจำนวนเครื่องจักรแต่ละสถานะ
    const { data: machines } = await supabase.from('machines').select('status')

    // 2. ดึง Alarm ที่ยังไม่ปิด (Open, In Progress)
    const { data: openAlarms } = await supabase
      .from('alarms')
      .select('*, machines(machine_id, machine_name)')
      .in('status', ['Open', 'In Progress'])
      .order('created_at', { ascending: false })

    // 3. ดึงกิจกรรมล่าสุดจาก Activity Log (ใช้ร่วมกับฝั่ง Technician)
    const { data: recentLogs } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    let activities: any[] = []
    if (recentLogs) {
      activities = recentLogs
        .filter((l: any) => !['alarm', 'alarmEdit', 'status'].includes(l.action))
        .map((l: any) => ({
          ...l,
          type: l.action,
          machine_id: l.machine_code,
          machine_name: l.machine_name,
          date: new Date(l.created_at),
        }))
    }
    activities = activities.filter(a => a.machine_id || a.machine_name || a.details || a.alarm_code)

    if (machines) {
      setStats({
        total: machines.length,
        alarm: (openAlarms || []).length,
        maintenance: machines.filter(m => m.status === 'Maintenance').length,
        stopped: machines.filter(m => m.status === 'Stop').length,
      })
    }

    setActiveAlarms(openAlarms || [])
    setRecentActivities(activities.slice(0, 10))
    setLoading(false)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-4">
      <Spinner className="h-12 w-12 text-blue-600 animate-spin" />
      <p className="font-bold tracking-widest uppercase text-sm">กำลังโหลดระบบ Plant Monitoring...</p>
    </div>
  )

  // กำหนดสีของแต่ละโมดูล
  const statusTheme = {
    alarm: { bar: 'bg-red-600', label: 'text-red-600', icon: 'text-red-600', chip: 'bg-red-600', dot: 'bg-red-500' },
    maintenance: { bar: 'bg-orange-500', label: 'text-orange-600', icon: 'text-orange-500', chip: 'bg-orange-500', dot: 'bg-orange-400' },
    stop: { bar: 'bg-gray-500', label: 'text-gray-500', icon: 'text-gray-500', chip: 'bg-gray-500', dot: 'bg-gray-400' },
    running: { bar: 'bg-blue-600', label: 'text-blue-700', icon: 'text-blue-600', chip: 'bg-blue-600', dot: 'bg-blue-500' },
  }
  const T = statusTheme

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">

      {/* --- 2. หัวข้อหน้าพร้อมปุ่มรีเฟรช --- */}
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 uppercase">Plant Dashboard</h1>
        <button onClick={fetchDashboardData} disabled={refreshing} className="bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60 text-sm font-bold tracking-wider uppercase px-4 py-2 rounded-md shadow-sm transition-colors flex items-center gap-2">
          <IconRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* --- 3. Stat Cards (Module Panels แถบสีทึบด้านบน) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button onClick={() => setShowFleet(true)} className="bg-white rounded-md shadow overflow-hidden w-full text-left hover:shadow-lg hover:-translate-y-0.5 transition transform focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer">
          <div className="flex items-stretch">
            <div className="bg-blue-700 px-4 py-4 flex items-center gap-3 flex-1 min-w-0">
              <IconFactory className="h-5 w-5 text-white shrink-0" />
              <h2 className="text-lg font-black text-white uppercase tracking-wide truncate">Machine</h2>
            </div>
            <div className="bg-white w-24 px-3 py-4 flex items-center justify-center border-l border-blue-700">
              <p className="text-4xl font-black text-gray-900 tabular-nums leading-none">{stats.total}</p>
            </div>
          </div>
        </button>

        <div className="block">
          <div className="bg-white rounded-md shadow overflow-hidden">
            <div className="flex items-stretch">
              <div className="bg-orange-500 px-4 py-4 flex items-center gap-3 flex-1 min-w-0">
                <IconWrench className="h-5 w-5 text-white shrink-0" />
                <h2 className="text-lg font-black text-white uppercase tracking-wide truncate">อยู่ระหว่างซ่อม</h2>
              </div>
              <div className="bg-white w-24 px-3 py-4 flex items-center justify-center border-l border-orange-500">
                <p className="text-4xl font-black text-gray-900 tabular-nums leading-none">{stats.maintenance}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="block">
          <div className="bg-white rounded-md shadow overflow-hidden">
            <div className="flex items-stretch">
              <div className="bg-gray-600 px-4 py-4 flex items-center gap-3 flex-1 min-w-0">
                <IconPower className="h-5 w-5 text-white shrink-0" />
                <h2 className="text-lg font-black text-white uppercase tracking-wide truncate">เครื่องที่หยุดทำงาน</h2>
              </div>
              <div className="bg-white w-24 px-3 py-4 flex items-center justify-center border-l border-gray-600">
                <p className="text-4xl font-black text-gray-900 tabular-nums leading-none">{stats.stopped}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">

        {/* --- 4. Action Required --- */}
        <div className="bg-white rounded-md shadow overflow-hidden flex flex-col border-t-4 border-red-600">
          <div className="bg-red-50 px-5 py-4 border-b border-red-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Led color="bg-red-500 animate-pulse" />
              <h2 className="text-lg font-black text-red-800 uppercase tracking-wide">
                Alarm
              </h2>
            </div>
            <span className="text-xs font-bold text-red-600 tracking-widest">{activeAlarms.length} UNITS</span>
          </div>
          <div className="p-5 flex-1">
            {activeAlarms.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 py-8">
                <IconCheck className="h-10 w-10 text-gray-300" />
                <p className="font-bold tracking-wide uppercase text-sm">All Clear</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAlarms.map((alarm) => (
                  <div key={alarm.id} className="p-4 border-l-4 border-red-500 bg-red-50/60 rounded-r flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <Led color={alarm.status === 'In Progress' ? 'bg-orange-400 animate-pulse' : 'bg-red-500 animate-pulse'} />
                        <p className="font-black text-red-700 text-lg tracking-wide">{alarm.alarm_code || alarm.machines?.machine_id}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-500 mt-1">
                        {alarm.machines?.machine_id} · {alarm.machines?.machine_name}
                      </p>
                      <p className="text-gray-700 text-sm mt-2">{alarm.alarm_description || 'พบความผิดปกติในระบบ'}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-black text-white rounded-sm ${
                        alarm.status === 'In Progress' ? 'bg-orange-500' : 'bg-red-600'
                      }`}>
                        {alarm.status}
                      </span>
                    </div>
                    <Link href="/dashboard/alarms">
                      <button className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition text-sm font-bold tracking-wider uppercase whitespace-nowrap">
                        จัดการ
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- 5. Activity Feed --- */}
        <div className="bg-white rounded-md shadow overflow-hidden flex flex-col border-t-4 border-gray-800">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <IconActivity className="h-5 w-5 text-gray-700" />
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Activity Log</h2>
            </div>
          </div>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center border-2 border-gray-300 hover:border-blue-600 bg-white px-3 py-1.5 rounded text-sm font-black text-gray-700 hover:text-blue-700 uppercase tracking-wide shadow-sm transition-colors"
          >
            History Log
          </Link>
        </div>
        <div className="p-5 flex-1">
          {recentActivities.length === 0 ? (
            <p className="text-center text-gray-500 py-8">ยังไม่มีการบันทึกการทำงานในระบบ</p>
          ) : (
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
              {recentActivities.map((act, index) => (
                <ActivityRow key={index} act={act} />
              ))}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* --- ป้อปอัพ Machine Fleet Status (กดจาก "เครื่องจักรทั้งหมด") --- */}
      {showFleet && (
        <div
          className="fixed inset-0 z-50 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowFleet(false)}
        >
          <div
            className="bg-slate-100 rounded-lg shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-y-auto border-t-4 border-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            <MachineFleetStatus embedded onClose={() => setShowFleet(false)} />
          </div>
        </div>
      )}

      {/* --- Overlay รีเฟรชทั้งหน้า --- */}
      {refreshing && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-md shadow-xl px-10 py-8 flex flex-col items-center gap-4 border-t-4 border-blue-600">
            <Spinner className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="font-black uppercase tracking-[0.2em] text-gray-800 text-sm">กำลังรีเฟรชข้อมูล...</p>
          </div>
        </div>
      )}
    </div>
  )
}