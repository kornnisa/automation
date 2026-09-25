'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/activity'

// ไอคอนสามเหลี่ยมเตือน (SVG สไตล์อุตสาหกรรม)
function IconAlert({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 3 2.5 19.5h19L12 3Z" />
      <path d="M12 9.5v4.5" />
    </svg>
  )
}

export default function MachineMasterPage() {
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form States
  const [machineId, setMachineId] = useState('')
  const [machineName, setMachineName] = useState('')
  const [machineType, setMachineType] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('Stop')
  
  const [editingId, setEditingId] = useState<string | null>(null)

  // --- เพิ่ม State สำหรับ Search & Filter ---
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // --- สถานะสำหรับ Modal ยืนยันการลบ ---
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMachines()
  }, [searchTerm, filterStatus]) // ดึงข้อมูลใหม่ทุกครั้งที่พิมพ์ค้นหาหรือเปลี่ยนตัวกรอง

  const fetchMachines = async () => {
    setLoading(true)
    
    let query = supabase.from('machines').select('*').order('machine_id', { ascending: true })

    // ใช้งาน Filter และ Search
    if (filterStatus) {
      query = query.eq('status', filterStatus)
    }
    if (searchTerm) {
      // ค้นหาทั้งจาก ID และ ชื่อเครื่องจักร
      query = query.or(`machine_id.ilike.%${searchTerm}%,machine_name.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching machines:', error)
    } else {
      setMachines(data || [])
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!machineId || !machineName) {
      setError('กรุณากรอก Machine ID และ Machine Name ให้ครบถ้วน')
      return
    }

    if (editingId) {
      const { error: updateError } = await supabase
        .from('machines')
        .update({ machine_name: machineName, machine_type: machineType, location: location, status: status })
        .eq('id', editingId)

      if (updateError) return setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล')
      await logActivity({
        action: 'machineEdit',
        details: `แก้ไขข้อมูล ${machineId} (${machineName})`,
        machine_code: machineId,
        machine_name: machineName,
      })
      setSuccess('อัปเดตข้อมูลสำเร็จ!')
    } else {
      const { data: existing } = await supabase.from('machines').select('id').eq('machine_id', machineId)
      if (existing && existing.length > 0) {
        setError(`Machine ID "${machineId}" มีอยู่ในระบบแล้ว ห้ามซ้ำ`)
        return
      }

      const { error: insertError } = await supabase
        .from('machines')
        .insert([{ machine_id: machineId, machine_name: machineName, machine_type: machineType, location: location, status: status }])

      if (insertError) return setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      await logActivity({
        action: 'machine',
        details: `เพิ่มเครื่องจักรใหม่ ${machineId} (${machineName})`,
        machine_code: machineId,
        machine_name: machineName,
      })
      setSuccess('เพิ่มข้อมูลเครื่องจักรสำเร็จ!')
    }

    resetForm()
    fetchMachines()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    setError('')
    setSuccess('')

    const id = deleteTarget.id
    // ลบข้อมูลที่ผูกอยู่กับเครื่องก่อน (เพราะมี Foreign Key ค้าง)
    const { error: alarmErr } = await supabase.from('alarms').delete().eq('machine_id', id)
    const { error: maintErr } = await supabase.from('maintenance_records').delete().eq('machine_id', id)

    if (alarmErr || maintErr) {
      setError('ไม่สามารถลบข้อมูลที่เกี่ยวข้องได้ (Alarm / Maintenance)')
      setDeleting(false)
      setDeleteTarget(null)
      return
    }

    const { error } = await supabase.from('machines').delete().eq('id', id)
    if (error) {
      setError('ไม่สามารถลบเครื่องจักรได้')
    } else {
      await logActivity({
        action: 'machineDelete',
        details: `ลบเครื่องจักร ${deleteTarget.machine_id} (${deleteTarget.machine_name})`,
        machine_code: deleteTarget.machine_id,
        machine_name: deleteTarget.machine_name,
      })
      setSuccess(`ลบเครื่องจักร ${deleteTarget.machine_id} แล้ว`)
      fetchMachines()
    }

    setDeleting(false)
    setDeleteTarget(null)
  }

  const handleEdit = (machine: any) => {
    setEditingId(machine.id)
    setMachineId(machine.machine_id)
    setMachineName(machine.machine_name)
    setMachineType(machine.machine_type || '')
    setLocation(machine.location || '')
    setStatus(machine.status)
  }

  const resetForm = () => {
    setEditingId(null)
    setMachineId('')
    setMachineName('')
    setMachineType('')
    setLocation('')
    setStatus('Stop')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Machine Master</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-300">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-300">{success}</div>}

      {/* ฟอร์มกรอกข้อมูล (ซ่อนรายละเอียดไว้เหมือนเดิม) */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'แก้ไขข้อมูลเครื่องจักร' : 'เพิ่มเครื่องจักรใหม่'}</h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Machine ID *</label>
            <input type="text" value={machineId} onChange={e => setMachineId(e.target.value)} disabled={!!editingId} className="w-full border p-2 rounded disabled:bg-gray-200" placeholder="e.g. MCH-001" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Machine Name *</label>
            <input type="text" value={machineName} onChange={e => setMachineName(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. CNC Machine A" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={machineType} onChange={e => setMachineType(e.target.value)} className="w-full border p-2 rounded bg-white">
              <option value="">-- เลือกประเภท --</option>
              <option value="CNC">CNC</option>
              <option value="Robot Arm">Robot Arm</option>
              <option value="Conveyor">Conveyor</option>
              <option value="Packaging">Packaging</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select value={location} onChange={e => setLocation(e.target.value)} className="w-full border p-2 rounded bg-white">
              <option value="">-- เลือกโซน --</option>
              <option value="Zone A">Zone A</option>
              <option value="Zone B">Zone B</option>
              <option value="Zone C">Zone C</option>
              <option value="Warehouse">Warehouse</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border p-2 rounded bg-white">
              <option value="Running">Running</option>
              <option value="Stop">Stop</option>
              <option value="Alarm">Alarm</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2 mt-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {editingId ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                ยกเลิก
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- ส่วนหัวของตาราง พร้อมกล่อง Search & Filter มุมขวาบน --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">รายการเครื่องจักรทั้งหมด</h2>
        
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="ค้นหา ID หรือ ชื่อเครื่องจักร..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-full md:w-64 shadow-sm"
          />
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border p-2 rounded w-full md:w-40 shadow-sm bg-white"
          >
            <option value="">ทุกสถานะ</option>
            <option value="Running">Running</option>
            <option value="Stop">Stop</option>
            <option value="Alarm">Alarm</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* ตารางแสดงข้อมูล */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3">Machine ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Location</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center">กำลังโหลดข้อมูล...</td></tr>
            ) : machines.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center">ไม่พบข้อมูลเครื่องจักรที่ค้นหา</td></tr>
            ) : (
              machines.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{m.machine_id}</td>
                  <td className="p-3">{m.machine_name}</td>
                  <td className="p-3">{m.machine_type || '-'}</td>
                  <td className="p-3">{m.location || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs text-white ${
                      m.status === 'Running' ? 'bg-green-500' : 
                      m.status === 'Stop' ? 'bg-gray-500' : 
                      m.status === 'Alarm' ? 'bg-red-500' : 'bg-orange-500'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <div className="flex gap-2">
                    <button onClick={() => handleEdit(m)} className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded text-sm font-bold transition-colors">Edit</button>
                    <button onClick={() => setDeleteTarget(m)} className="bg-red-600 text-white hover:bg-red-700 px-3 py-1 rounded text-sm font-bold transition-colors">Delete</button>
                  </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- Modal ยืนยันการลบ --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border-t-4 border-red-600">
            {/* หัว Modal */}
            <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <IconAlert className="h-5 w-5 text-red-600 shrink-0" />
              <h3 className="text-lg font-black text-red-700 uppercase tracking-wide">ลบเครื่องจักร</h3>
            </div>

            {/* เนื้อหา */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-gray-700 font-semibold">
                ต้องการลบเครื่อง
                <span className="mx-1.5 px-2 py-0.5 bg-gray-900 text-white font-black rounded text-sm tracking-wide">{deleteTarget.machine_id}</span>
                ({deleteTarget.machine_name}) หรือไม่?
              </p>
            </div>

            {/* ปุ่ม */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="bg-gray-500 hover:bg-gray-600 disabled:opacity-40 text-white font-black uppercase tracking-wide px-5 py-2 rounded text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-black uppercase tracking-wide px-5 py-2 rounded text-sm"
                >
                  {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}