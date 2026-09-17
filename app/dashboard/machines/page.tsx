'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function MachineMasterPage() {
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form States
  const [machineId, setMachineId] = useState('')
  const [machineName, setMachineName] = useState('')
  const [machineType, setMachineType] = useState('') // เปลี่ยนเป็น Dropdown
  const [location, setLocation] = useState('')       // เปลี่ยนเป็น Dropdown
  const [status, setStatus] = useState('Stop')
  
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMachines()
  }, [])

  // [READ] ดึงข้อมูลเครื่องจักรทั้งหมด (แก้บั๊ก order by created_at ออก)
  const fetchMachines = async () => {
    setLoading(true)
    // เปลี่ยนมาเรียงตาม machine_id แทน
    const { data, error } = await supabase.from('machines').select('*').order('machine_id', { ascending: true })
    if (error) {
      console.error('Error fetching machines:', error)
    } else {
      setMachines(data || [])
    }
    setLoading(false)
  }

  // [CREATE & UPDATE] บันทึกข้อมูล
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

      if (updateError) {
        setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล')
        return
      }
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

      if (insertError) {
        setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
        return
      }
      setSuccess('เพิ่มข้อมูลเครื่องจักรสำเร็จ!')
    }

    resetForm()
    fetchMachines()
  }

  // [DELETE] ลบข้อมูล
  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบเครื่องจักรนี้?')) return
    
    const { error } = await supabase.from('machines').delete().eq('id', id)
    if (error) {
      alert('ไม่สามารถลบได้ (อาจมีข้อมูล Alarm/Maintenance ผูกอยู่)')
    } else {
      fetchMachines()
    }
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
          
          {/* ส่วนที่เปลี่ยนเป็น Dropdown สำหรับ Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={machineType} onChange={e => setMachineType(e.target.value)} className="w-full border p-2 rounded bg-white">
              <option value="">-- เลือกประเภทเครื่องจักร --</option>
              <option value="CNC">CNC</option>
              <option value="Robot Arm">Robot Arm</option>
              <option value="Conveyor">Conveyor</option>
              <option value="Packaging">Packaging</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* ส่วนที่เปลี่ยนเป็น Dropdown สำหรับ Location */}
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select value={location} onChange={e => setLocation(e.target.value)} className="w-full border p-2 rounded bg-white">
              <option value="">-- เลือกโซน/พื้นที่ --</option>
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
              <tr><td colSpan={6} className="p-4 text-center">ยังไม่มีข้อมูลเครื่องจักร</td></tr>
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
                    <button onClick={() => handleEdit(m)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:underline">Delete</button>
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