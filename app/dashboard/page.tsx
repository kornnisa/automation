'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    alarm: 0,
    maintenance: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { data, error } = await supabase.from('machines').select('status')
    if (error) {
      console.error('Error fetching stats:', error)
      return
    }
    
    if (data) {
      setStats({
        total: data.length,
        running: data.filter(m => m.status === 'Running').length,
        alarm: data.filter(m => m.status === 'Alarm').length,
        maintenance: data.filter(m => m.status === 'Maintenance').length
      })
    }
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-center text-gray-500 font-semibold animate-pulse">กำลังโหลดข้อมูลระบบ...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📊 Plant Overview</h1>
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full shadow-sm">
          อัปเดตข้อมูลล่าสุด: Real-time
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total */}
        <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl shadow-lg p-6 border border-gray-600 transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-300 text-lg font-medium">เครื่องจักรทั้งหมด</h3>
            <span className="text-2xl">🏭</span>
          </div>
          <p className="text-5xl font-bold text-white mt-4">{stats.total}</p>
          <p className="text-gray-400 text-sm mt-2">Total Machines</p>
        </div>

        {/* Card 2: Running */}
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 border border-green-600 transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between">
            <h3 className="text-green-100 text-lg font-medium">กำลังทำงาน</h3>
            <span className="text-2xl">⚙️</span>
          </div>
          <p className="text-5xl font-bold text-white mt-4">{stats.running}</p>
          <p className="text-green-200 text-sm mt-2">Running Status</p>
        </div>

        {/* Card 3: Alarm */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg p-6 border border-red-600 transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between">
            <h3 className="text-red-100 text-lg font-medium">แจ้งเตือนขัดข้อง</h3>
            <span className="text-2xl">🚨</span>
          </div>
          <p className="text-5xl font-bold text-white mt-4">{stats.alarm}</p>
          <p className="text-red-200 text-sm mt-2">Active Alarms</p>
        </div>

        {/* Card 4: Maintenance */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg p-6 border border-orange-500 transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between">
            <h3 className="text-orange-100 text-lg font-medium">อยู่ระหว่างซ่อม</h3>
            <span className="text-2xl">🔧</span>
          </div>
          <p className="text-5xl font-bold text-white mt-4">{stats.maintenance}</p>
          <p className="text-orange-200 text-sm mt-2">Under Maintenance</p>
        </div>
      </div>

      <div className="mt-12 bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">ระบบจัดการข้อมูลระดับโรงงาน (Industrial Grade)</h2>
        <p className="text-gray-600 leading-relaxed">
          ยินดีต้อนรับสู่ระบบ Automation Web Application เลือกเมนูด้านซ้ายเพื่อเริ่มต้นการทำงาน 
          ระบบมีการจัดการสิทธิ์ผู้ใช้งาน (RBAC) แยกส่วนระหว่าง ผู้ดูแลระบบ (Admin) และ ช่างซ่อมบำรุง (Technician) อย่างชัดเจน
        </p>
      </div>
    </div>
  )
}