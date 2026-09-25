'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/activity'

// ไอคอนสถานะการดำเนินงาน (SVG)
function IconStatus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 3h6" />
      <path d="M10 3v6.6L4.8 17a3 3 0 0 0 2.6 4.5h9.2a3 3 0 0 0 2.6-4.5L14 9.6V3" />
    </svg>
  )
}

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form States
  const [selectedMachine, setSelectedMachine] = useState('')
  const [alarmCode, setAlarmCode] = useState('')
  const [description, setDescription] = useState('')
  const [cause, setCause] = useState('')
  const [status, setStatus] = useState('Open')
  const [priority, setPriority] = useState('Warning')
  const [editingId, setEditingId] = useState<string | null>(null)

  // สถานะสำหรับ Modal เปลี่ยนสถานะ (ฝั่งช่าง - แก้ได้แค่ Status)
  const [statusTarget, setStatusTarget] = useState<any | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)

  // Filter States (สำหรับค้นหาข้อมูล 2 เงื่อนไข)
  const [filterStatus, setFilterStatus] = useState('')
  const [searchCode, setSearchCode] = useState('')

  // Role ของผู้ใช้ปัจจุบัน (admin เท่านั้นที่เห็นฟอร์มสร้าง/แก้ไข)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!error && data) setUserRole(data.role)
      }
    }
    checkRole()
  }, [])

  const isAdmin = userRole?.toLowerCase() === 'admin'

  useEffect(() => {
    fetchMachines() // โหลดรายชื่อเครื่องจักรมาใส่ Dropdown ก่อน
    fetchAlarms()
  }, [])

  // โหลดข้อมูลเมื่อมีการเปลี่ยนค่า Filter
  useEffect(() => {
    fetchAlarms()
  }, [filterStatus, searchCode])

  const fetchMachines = async () => {
    const { data } = await supabase.from('machines').select('id, machine_id, machine_name').order('machine_id')
    if (data) setMachines(data)
  }

  // [READ & FILTER] ดึงข้อมูล Alarm และเชื่อมกับตาราง Machine
  const fetchAlarms = async () => {
    setLoading(true)
    
    let query = supabase
      .from('alarms')
      .select('*, machines(machine_id, machine_name)')
      .order('created_at', { ascending: false })

    // ระบบกรองข้อมูล (Filter)
    if (filterStatus) {
      query = query.eq('status', filterStatus)
    }
    if (searchCode) {
      query = query.ilike('alarm_code', `%${searchCode}%`)
    }

    const { data, error } = await query
    if (!error && data) {
      setAlarms(data)
    }
    setLoading(false)
  }

  // [CREATE & UPDATE] บันทึกข้อมูล
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedMachine || !alarmCode) {
      setError('กรุณาเลือกเครื่องจักรและกรอก Alarm Code')
      return
    }

    const payload = {
      machine_id: selectedMachine,
      alarm_code: alarmCode,
      alarm_description: description,
      cause: cause,
      status: status,
      priority: priority
    }

    if (editingId) {
      const { error: updateError } = await supabase.from('alarms').update(payload).eq('id', editingId)
      if (updateError) return setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล')
      setSuccess('อัปเดต Alarm สำเร็จ!')
      const mach = machines.find(m => m.id === selectedMachine)
      await logActivity({
        action: 'alarmEdit',
        details: description || 'แก้ไขแจ้งเตือน',
        machine_code: mach?.machine_id,
        machine_name: mach?.machine_name,
        alarm_code: alarmCode,
      })
      await syncMachineStatus(selectedMachine)
    } else {
      const { error: insertError } = await supabase.from('alarms').insert([payload])
      if (insertError) return setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      setSuccess('เพิ่ม Alarm ใหม่สำเร็จ!')
      const mach = machines.find(m => m.id === selectedMachine)
      await logActivity({
        action: 'alarm',
        details: description || 'แจ้งเตือนใหม่',
        machine_code: mach?.machine_id,
        machine_name: mach?.machine_name,
        alarm_code: alarmCode,
      })
      await syncMachineStatus(selectedMachine)
    }

    resetForm()
    fetchAlarms()
  }

  const handleEdit = (alarm: any) => {
    setEditingId(alarm.id)
    setSelectedMachine(alarm.machine_id)
    setAlarmCode(alarm.alarm_code)
    setDescription(alarm.alarm_description || '')
    setCause(alarm.cause || '')
    setStatus(alarm.status)
    setPriority(alarm.priority || 'Warning')
  }

  const resetForm = () => {
    setEditingId(null)
    setSelectedMachine('')
    setAlarmCode('')
    setDescription('')
    setCause('')
    setStatus('Open')
    setPriority('Warning')
  }

  // เปิด Modal เปลี่ยนสถานะ (ช่างแก้ได้เฉพาะสถานะ)
  const openStatusModal = (alarm: any) => {
    setStatusTarget(alarm)
    setNewStatus(alarm.status)
  }

  // บันทึกการเปลี่ยนสถานะ
  const handleStatusChange = async () => {
    if (!statusTarget || !newStatus) return
    setStatusSaving(true)
    const { error } = await supabase.from('alarms').update({ status: newStatus }).eq('id', statusTarget.id)
    if (!error) {
      await syncMachineStatus(statusTarget.machine_id)
      fetchAlarms()
      setStatusTarget(null)
      setNewStatus('')
    }
    setStatusSaving(false)
  }

  // ---------------------------------------------------------------
  // ซิงก์สถานะเครื่องให้สอดคล้องกับ Alarm ที่ค้างอยู่ของเครื่องนั้น
  // - มี Alarm กำลังดำเนินการ (In Progress) → Maintenance
  // - มี Alarm เปิดค้างอยู่ (Open) → Alarm
  // - ไม่มี Alarm ค้างเลย → Running
  const syncMachineStatus = async (machineId: string) => {
    if (!machineId) return
    const { data } = await supabase
      .from('alarms')
      .select('status')
      .eq('machine_id', machineId)
      .in('status', ['Open', 'In Progress'])

    let newStatus = 'Running'
    if (data && data.length > 0) {
      newStatus = data.some(a => a.status === 'In Progress') ? 'Maintenance' : 'Alarm'
    }
    await supabase.from('machines').update({ status: newStatus }).eq('id', machineId)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Alarm Management</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}

      {/* ส่วนฟอร์มบันทึกข้อมูล — โชว์เฉพาะ Admin */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-t-4 border-red-500">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'แก้ไข Alarm' : 'แจ้งเตือน Alarm ใหม่'}</h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Machine *</label>
            <select value={selectedMachine} onChange={e => setSelectedMachine(e.target.value)} className="w-full border p-2 rounded">
              <option value="">-- เลือกเครื่องจักร --</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.machine_id} : {m.machine_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alarm Code *</label>
            <input type="text" value={alarmCode} onChange={e => setAlarmCode(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. ERR-01" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded" placeholder="รายละเอียดของปัญหา" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Cause (สาเหตุ)</label>
            <input type="text" value={cause} onChange={e => setCause(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border p-2 rounded bg-white">
              <option value="Open">Open (เปิดรับแจ้ง)</option>
              <option value="In Progress">In Progress (กำลังดำเนินการ)</option>
              <option value="Closed">Closed (แก้ไขแล้ว)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority (ระดับความรุนแรง)</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border p-2 rounded bg-white">
              <option value="Critical">Critical (หยุดสายการผลิต)</option>
              <option value="Warning">Warning (เครื่องสำรอง / ไม่ร้ายแรง)</option>
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2 mt-2">
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              {editingId ? 'อัปเดต Alarm' : 'บันทึก Alarm'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded">ยกเลิก</button>
            )}
          </div>
        </form>
      </div>
      )}

      {/* ส่วน Search & Filter */}
      <div className="bg-gray-100 p-4 rounded-lg mb-4 flex flex-col md:flex-row gap-4 items-center">
        <input 
          type="text" 
          placeholder="ค้นหาด้วย Alarm Code..." 
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          className="border p-2 rounded w-full md:w-64"
        />
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border p-2 rounded w-full md:w-48"
        >
          <option value="">-- ทุกสถานะ --</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* ตารางแสดงข้อมูล Alarm */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3">Date/Time</th>
              <th className="p-3">Machine</th>
              <th className="p-3">Alarm Code</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Description</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-4 text-center">กำลังโหลดข้อมูล...</td></tr>
            ) : alarms.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center">ไม่พบข้อมูล Alarm</td></tr>
            ) : (
              alarms.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm">{new Date(a.created_at).toLocaleString('th-TH')}</td>
                  <td className="p-3">{a.machines?.machine_id}</td>
                  <td className="p-3 font-semibold text-red-600">{a.alarm_code}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase ${a.priority === 'Critical' ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black'}`}>
                      {a.priority || 'Warning'}
                    </span>
                  </td>
                  <td className="p-3">{a.alarm_description || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs text-white ${
                      a.status === 'Open' ? 'bg-red-500' : 
                      a.status === 'In Progress' ? 'bg-yellow-500 text-black' : 'bg-green-500'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {isAdmin ? (
                      <button onClick={() => handleEdit(a)} className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded text-sm font-bold transition-colors">Edit</button>
                    ) : (
                      <button onClick={() => openStatusModal(a)} className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded text-sm font-bold transition-colors">Edit</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- Modal เปลี่ยนสถานะ (ช่างแก้ได้เฉพาะ Status) --- */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border-t-4 border-orange-500">
            <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
              <IconStatus className="h-5 w-5 text-orange-600 shrink-0" />
              <h3 className="text-lg font-black text-orange-700 uppercase tracking-wide">เปลี่ยนสถานะงาน</h3>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-gray-900">{statusTarget.alarm_code}</span>
                <span className="text-sm font-bold text-gray-500">{statusTarget.machines?.machine_id} · {statusTarget.machines?.machine_name}</span>
              </div>
              <p className="text-sm text-gray-600 font-semibold -mt-2">{statusTarget.alarm_description || '—'}</p>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full border p-2 rounded bg-white"
                >
                  <option value="Open">Open (เปิดรับแจ้ง)</option>
                  <option value="In Progress">In Progress (กำลังดำเนินการ)</option>
                  <option value="Closed">Closed (แก้ไขแล้ว)</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setStatusTarget(null)}
                disabled={statusSaving}
                className="bg-gray-500 hover:bg-gray-600 disabled:opacity-40 text-white font-black uppercase tracking-wide px-5 py-2 rounded text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleStatusChange}
                disabled={statusSaving}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-black uppercase tracking-wide px-5 py-2 rounded text-sm"
              >
                {statusSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}