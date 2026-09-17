'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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
  const [editingId, setEditingId] = useState<string | null>(null)

  // Filter States (สำหรับค้นหาข้อมูล 2 เงื่อนไข)
  const [filterStatus, setFilterStatus] = useState('')
  const [searchCode, setSearchCode] = useState('')

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
      status: status
    }

    if (editingId) {
      const { error: updateError } = await supabase.from('alarms').update(payload).eq('id', editingId)
      if (updateError) return setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล')
      setSuccess('อัปเดต Alarm สำเร็จ!')
    } else {
      const { error: insertError } = await supabase.from('alarms').insert([payload])
      if (insertError) return setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      setSuccess('เพิ่ม Alarm ใหม่สำเร็จ!')
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
  }

  const resetForm = () => {
    setEditingId(null)
    setSelectedMachine('')
    setAlarmCode('')
    setDescription('')
    setCause('')
    setStatus('Open')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Alarm Management</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}

      {/* ส่วนฟอร์มบันทึกข้อมูล */}
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

      {/* ส่วน Search & Filter */}
      <div className="bg-gray-100 p-4 rounded-lg mb-4 flex flex-col md:flex-row gap-4 items-center">
        <span className="font-semibold text-gray-700">ตัวกรอง (Filter):</span>
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
              <th className="p-3">Description</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center">กำลังโหลดข้อมูล...</td></tr>
            ) : alarms.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center">ไม่พบข้อมูล Alarm</td></tr>
            ) : (
              alarms.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm">{new Date(a.created_at).toLocaleString('th-TH')}</td>
                  <td className="p-3">{a.machines?.machine_id}</td>
                  <td className="p-3 font-semibold text-red-600">{a.alarm_code}</td>
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
                    <button onClick={() => handleEdit(a)} className="text-blue-600 hover:underline">Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}