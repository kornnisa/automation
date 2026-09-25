'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/activity'

export default function MaintenancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form States
  const [selectedMachine, setSelectedMachine] = useState('')
  const [details, setDetails] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // สถานะสำหรับโหมด "ปิดงาน" (มาจากปุ่ม Resolve ใน Task Board)
  const [prefillMachine, setPrefillMachine] = useState('')
  const [prefillAlarmId, setPrefillAlarmId] = useState('')
  const [prefillAlarmCode, setPrefillAlarmCode] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    // อ่านพารามิเตอร์จาก URL เช่น ?machine=xxx&alarm=yyy
    const params = new URLSearchParams(window.location.search)
    if (params.get('machine')) setPrefillMachine(params.get('machine')!)
    if (params.get('alarm')) setPrefillAlarmId(params.get('alarm')!)
    fetchMachines()
    fetchRecords()
  }, [])

  // เมื่อโหลดรายชื่อเครื่องเสร็จ ให้นำเครื่องจาก URL ไปตั้งในฟอร์ม + แจ้งโหมดปิดงาน
  useEffect(() => {
    if (prefillMachine && machines.length && !selectedMachine) {
      if (machines.some(m => m.id === prefillMachine)) setSelectedMachine(prefillMachine)
      if (prefillAlarmId && !notice) {
        supabase
          .from('alarms')
          .select('alarm_code, machines(machine_id, machine_name)')
          .eq('id', prefillAlarmId)
          .single()
          .then(({ data }) => {
            setPrefillAlarmCode(data?.alarm_code || '')
            setNotice(data ? `กำลังปิดงาน ${data.alarm_code} (${data.machines?.machine_id}) — บันทึกการซ่อมด้านล่างเพื่อปิดงานอัตโนมัติ` : '')
          })
      }
    }
  }, [machines, prefillMachine])

  // ดึงข้อมูลเครื่องจักรสำหรับ Dropdown
  const fetchMachines = async () => {
    const { data } = await supabase.from('machines').select('id, machine_id, machine_name').order('machine_id')
    if (data) setMachines(data)
  }

  // [READ] ดึงข้อมูลประวัติการซ่อมบำรุง
  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*, machines(machine_id, machine_name)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRecords(data)
    }
    setLoading(false)
  }

  // [CREATE & UPDATE] บันทึกข้อมูล
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedMachine || !details) {
      setError('กรุณาเลือกเครื่องจักรและกรอกรายละเอียดการซ่อมบำรุง')
      return
    }

    // ดึง ID ผู้ใช้ที่ล็อกอิน (ผู้ที่ปิดงาน/บันทึกการซ่อม)
    const { data: { user } } = await supabase.auth.getUser()
    const technicianId = user?.id || null

    const payload = {
      machine_id: selectedMachine,
      details: details,
      technician_id: technicianId
    }

    // ชื่อเครื่อง (code) สำหรับบันทึกลง Log
    const mach = machines.find(x => x.id === selectedMachine)

    if (editingId) {
      const { error: updateError } = await supabase.from('maintenance_records').update(payload).eq('id', editingId)
      if (updateError) return setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล')
      await logActivity({
        action: 'edit',
        details,
        machine_code: mach?.machine_id,
        machine_name: mach?.machine_name,
      })
      setSuccess('อัปเดตข้อมูลซ่อมบำรุงสำเร็จ!')
    } else {
      const { error: insertError } = await supabase.from('maintenance_records').insert([payload])
      if (insertError) return setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      await logActivity({
        action: 'add',
        details,
        machine_code: mach?.machine_id,
        machine_name: mach?.machine_name,
        alarm_code: prefillAlarmCode || undefined,
      })
      setSuccess('เพิ่มประวัติการซ่อมบำรุงสำเร็จ!')

      // ถ้าเข้ามาในโหมดปิดงาน (มี alarm ต่อท้าย URL) → ปิด Alarm + ซิงก์สถานะเครื่อง
      if (prefillAlarmId) {
        await supabase.from('alarms').update({ status: 'Closed', resolved_at: new Date().toISOString() }).eq('id', prefillAlarmId)
        await syncMachineStatus(selectedMachine)
        window.history.replaceState({}, '', '/dashboard/maintenance')
        setPrefillAlarmId('')
        setPrefillAlarmCode('')
        setNotice('')
        setSuccess('ปิดงานเรียบร้อย! บันทึกการซ่อมถูกบันทึกและ Alarm ถูกปิดอัตโนมัติ')
      }
    }

    resetForm()
    fetchRecords()
  }

  // ซิงก์สถานะเครื่องตาม Alarm ที่ค้างอยู่
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

  const handleEdit = (record: any) => {
    setEditingId(record.id)
    setSelectedMachine(record.machine_id)
    setDetails(record.details)
  }

  const resetForm = () => {
    setEditingId(null)
    setSelectedMachine('')
    setDetails('')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Maintenance Records</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}
      {notice && (
        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-md">
          <p className="font-black text-blue-800 uppercase tracking-wide text-sm">โหมดปิดงาน</p>
          <p className="text-blue-700 text-sm font-semibold mt-1">{notice}</p>
        </div>
      )}

      {/* ส่วนฟอร์มบันทึกข้อมูล */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-t-4 border-blue-500">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'แก้ไขข้อมูลการซ่อมบำรุง' : 'บันทึกการซ่อมบำรุงใหม่'}</h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Machine *</label>
            <select value={selectedMachine} onChange={e => setSelectedMachine(e.target.value)} className="w-full md:w-1/2 border p-2 rounded bg-white">
              <option value="">-- เลือกเครื่องจักร --</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.machine_id} : {m.machine_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Details (รายละเอียดการซ่อม) *</label>
            <textarea 
              value={details} 
              onChange={e => setDetails(e.target.value)} 
              className="w-full border p-2 rounded" 
              rows={4}
              placeholder="เช่น เปลี่ยนลูกปืนมอเตอร์, เติมน้ำมันหล่อลื่น..." 
            />
          </div>
          
          <div className="flex gap-2 mt-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {editingId ? 'อัปเดตบันทึก' : 'บันทึกข้อมูล'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded">ยกเลิก</button>
            )}
          </div>
        </form>
      </div>

      {/* ตารางแสดงข้อมูล */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3 w-1/4">Date/Time</th>
              <th className="p-3 w-1/4">Machine</th>
              <th className="p-3 w-2/4">Maintenance Details</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center">กำลังโหลดข้อมูล...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center">ไม่พบข้อมูลการซ่อมบำรุง</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm">{new Date(r.created_at).toLocaleString('th-TH')}</td>
                  <td className="p-3 font-medium text-blue-700">{r.machines?.machine_id}</td>
                  <td className="p-3 whitespace-pre-wrap">{r.details}</td>
                  <td className="p-3">
                    <button onClick={() => handleEdit(r)} className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded text-sm font-bold transition-colors">Edit</button>
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