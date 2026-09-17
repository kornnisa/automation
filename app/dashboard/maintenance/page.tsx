'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

  useEffect(() => {
    fetchMachines()
    fetchRecords()
  }, [])

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

    const payload = {
      machine_id: selectedMachine,
      details: details,
      // หมายเหตุ: ในระบบจริง อาจจะมีการดึง ID ของ Technician ที่ล็อกอินอยู่มาใส่ด้วย 
      // แต่เพื่อให้ทดสอบ CRUD ได้ง่าย เราจะโฟกัสที่รายละเอียดและเครื่องจักรก่อนครับ
    }

    if (editingId) {
      const { error: updateError } = await supabase.from('maintenance_records').update(payload).eq('id', editingId)
      if (updateError) return setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล')
      setSuccess('อัปเดตข้อมูลซ่อมบำรุงสำเร็จ!')
    } else {
      const { error: insertError } = await supabase.from('maintenance_records').insert([payload])
      if (insertError) return setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      setSuccess('เพิ่มประวัติการซ่อมบำรุงสำเร็จ!')
    }

    resetForm()
    fetchRecords()
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
                    <button onClick={() => handleEdit(r)} className="text-blue-600 hover:underline">Edit</button>
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