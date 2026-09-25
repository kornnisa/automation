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

function IconDownload({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className} aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
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

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']

const categoryTheme: Record<string, { badge: string; bar: string }> = {
  maintenance: { badge: 'bg-orange-100 text-orange-700', bar: 'border-t-4 border-orange-500' },
  machine: { badge: 'bg-blue-100 text-blue-700', bar: 'border-t-4 border-blue-600' },
  add: { badge: 'bg-orange-100 text-orange-700', bar: 'border-t-4 border-orange-500' },
  edit: { badge: 'bg-blue-100 text-blue-700', bar: 'border-t-4 border-blue-600' },
  close: { badge: 'bg-green-100 text-green-700', bar: 'border-t-4 border-green-600' },
  machineEdit: { badge: 'bg-sky-100 text-sky-700', bar: 'border-t-4 border-sky-600' },
  machineDelete: { badge: 'bg-red-100 text-red-700', bar: 'border-t-4 border-red-600' },
}

export default function ReportsPage() {
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const [logs, setLogs] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)

    // --- Log เดียวที่ใช้ร่วมกันทั้ง 2 ฝั่ง (Admin + Technician) ---
    const logsRes = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })

    let combined: any[] = []
    if (logsRes.error) {
      // ตาราง activity_logs ยังไม่ถูกสร้าง → fallback ใช้ประวัติซ่อมทั้งหมด
      const fallback = await supabase
        .from('maintenance_records')
        .select('*, machines(machine_id, machine_name)')
        .order('created_at', { ascending: false })
      if (fallback.data) {
        combined = fallback.data.map(m => ({
          id: m.id,
          type: 'maintenance',
          date: new Date(m.created_at),
          machineLabel: m.machines?.machine_id || '-',
          machineName: m.machines?.machine_name || '',
          details: m.details || 'งานซ่อมบำรุง',
          status: 'Completed',
        }))
      }
    } else if (logsRes.data) {
      combined = logsRes.data
        .filter((l: any) => l.action !== 'status')
        .map((l: any) => ({
          id: l.id,
          type: l.action,
          date: new Date(l.created_at),
          machineLabel: l.machine_code || '-',
          machineName: l.machine_name || '',
          details: l.details || '-',
          status:
            l.action === 'close' ? 'Closed' :
            l.action === 'edit' ? 'Updated' :
            l.action === 'machineEdit' ? 'Edited' :
            l.action === 'machineDelete' ? 'Deleted' : 'Completed',
          alarmCode: l.alarm_code,
        }))
    }
    combined = combined.filter(l => l.date && !isNaN(l.date.getTime()))
    combined.sort((a, b) => b.date.getTime() - a.date.getTime())
    setLogs(combined)

    const ys = Array.from(new Set(combined.map(l => l.date.getFullYear()))).sort((a, b) => b - a)
    setYears(ys.map(y => String(y)))
    setLoading(false)
  }

  // ใช้ได้ทันทีเมื่อเปลี่ยนตัวกรอง (ไม่ต้องกดปุ่ม)
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const yearOk = l.date.getFullYear() === Number(filterYear)
      const monthOk = filterMonth === 'all' || (l.date.getMonth() + 1) === Number(filterMonth)
      let catOk = filterCategory === 'all'
      if (!catOk) {
        if (filterCategory === 'add') catOk = ['add', 'edit', 'maintenance'].includes(l.type)
        else if (filterCategory === 'machine') catOk = ['machine', 'machineEdit', 'machineDelete'].includes(l.type)
        else if (filterCategory === 'close') catOk = ['alarm', 'alarmEdit', 'add', 'close'].includes(l.type) && !!l.alarmCode
        else catOk = l.type === filterCategory
      }
      return yearOk && monthOk && catOk
    })
  }, [logs, filterYear, filterMonth, filterCategory])

  // Export เป็น CSV (อ่านภาษาไทยใน Excel ได้ ใส่ BOM + quote ทุกช่อง)
  const typeLabel = (t: string) =>
    t === 'alarm' ? 'เพิ่ม Alarm' :
    t === 'alarmEdit' ? 'แก้ไข Alarm' :
    t === 'add' || t === 'maintenance' ? 'บันทึกซ่อม' :
    t === 'edit' ? 'แก้ไขงานซ่อม' :
    t === 'close' ? 'ปิดงาน' :
    t === 'machine' ? 'เพิ่มเครื่องจักร' :
    t === 'machineEdit' ? 'แก้ไขเครื่องจักร' :
    t === 'machineDelete' ? 'ลบเครื่องจักร' : t

  const handleExportCSV = () => {
    const rows = [
      ['วันที่ / เวลา', 'เครื่องจักร', 'ประเภท', 'รายละเอียด'],
      ...filteredLogs.map(l => [
        l.date.toLocaleString('th-TH'),
        `${l.machineLabel}${l.machineName ? ' (' + l.machineName + ')' : ''}`,
        typeLabel(l.type),
        l.details,
      ]),
    ]
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Plant_Report_${filterYear}${filterMonth === 'all' ? '_year' : '_' + filterMonth}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">System Reports & Logs</h1>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md shadow-sm font-black uppercase tracking-wide flex items-center gap-2 transition-colors"
        >
          <IconDownload className="h-5 w-5" /> Export to Excel
        </button>
      </div>

      {/* --- โซน 1: ตัวกรอง (Filters) --- */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-black text-slate-600 uppercase tracking-wide">ปี:</label>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm font-bold bg-white">
            {years.length > 0 ? years.map(y => (
              <option key={y} value={y}>{y} ({Number(y) + 543})</option>
            )) : <option value={filterYear}>{filterYear}</option>}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-black text-slate-600 uppercase tracking-wide">เดือน:</label>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm font-bold bg-white">
            <option value="all">ทั้งหมดตลอดปี</option>
            {THAI_MONTHS.map((m, i) => (
              <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-black text-slate-600 uppercase tracking-wide">ประเภท:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm font-bold bg-white">
            <option value="all">ดูทุกประวัติรวมกัน</option>
            <option value="add">บันทึกงานซ่อม</option>
            <option value="close">Alarm</option>
            <option value="machine">เครื่องจักร</option>
          </select>
        </div>
        <button onClick={fetchLogs} className="bg-blue-600 text-white px-4 py-1.5 rounded-md font-black uppercase tracking-wide text-sm hover:bg-blue-700 flex items-center gap-2 ml-auto">
          <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'โหลด...' : 'รีเฟรช'}
        </button>
      </div>

      {/* --- โซน 3: ตารางข้อมูล (Data Log) --- */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <p className="text-xs font-black text-slate-600 uppercase tracking-widest">History Log</p>
          <span className="text-xs font-black text-slate-400 tabular-nums">{filteredLogs.length} RECORDS</span>
        </div>
        {loading ? (
          <p className="p-8 text-center text-gray-500 font-bold">กำลังโหลดข้อมูล...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="p-8 text-center text-gray-500 font-bold">ไม่พบข้อมูลตามเงื่อนไขที่กรอง</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                  <th className="p-4 font-black uppercase tracking-wide text-xs w-1/4">วันที่ / เวลา</th>
                  <th className="p-4 font-black uppercase tracking-wide text-xs w-1/4">เครื่องจักร</th>
                  <th className="p-4 font-black uppercase tracking-wide text-xs w-1/4">ประเภท</th>
                  <th className="p-4 font-black uppercase tracking-wide text-xs w-1/4">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {filteredLogs.map((l) => (
                  <tr key={l.id + l.type} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">{l.date.toLocaleString('th-TH')}</td>
                    <td className="p-4 font-black text-slate-800 truncate">
                      {l.machineLabel}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-black ${(categoryTheme[l.type as keyof typeof categoryTheme] || categoryTheme.maintenance).badge}`}>
                        {typeLabel(l.type)}
                      </span>
                    </td>
                    <td className="p-4 break-words">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}