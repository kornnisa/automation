'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalMachines: 0,
    running: 0,
    stop: 0,
    alarmStatus: 0,
    maintenanceStatus: 0,
    totalAlarms: 0,
    totalMaintenance: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)

    // 1. ดึงข้อมูลเครื่องจักรเพื่อมานับสถานะ
    const { data: machines } = await supabase.from('machines').select('status')
    
    // 2. นับจำนวน Alarm ทั้งหมด
    const { count: alarmsCount } = await supabase
      .from('alarms')
      .select('*', { count: 'exact', head: true })
    
    // 3. นับจำนวนประวัติการซ่อมบำรุงทั้งหมด
    const { count: maintenanceCount } = await supabase
      .from('maintenance_records')
      .select('*', { count: 'exact', head: true })

    if (machines) {
      setStats({
        totalMachines: machines.length,
        running: machines.filter(m => m.status === 'Running').length,
        stop: machines.filter(m => m.status === 'Stop').length,
        alarmStatus: machines.filter(m => m.status === 'Alarm').length,
        maintenanceStatus: machines.filter(m => m.status === 'Maintenance').length,
        totalAlarms: alarmsCount || 0,
        totalMaintenance: maintenanceCount || 0
      })
    }
    
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-xl font-semibold">กำลังโหลดข้อมูล Dashboard...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">System Dashboard</h1>

      {/* ส่วนแสดงสรุปเครื่องจักร */}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">ภาพรวมเครื่องจักร (Machine Status)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-blue-500">
          <p className="text-sm text-gray-500 font-medium">Total Machines</p>
          <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalMachines}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-green-500">
          <p className="text-sm text-gray-500 font-medium">Running</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{stats.running}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-gray-500">
          <p className="text-sm text-gray-500 font-medium">Stop</p>
          <p className="text-4xl font-bold text-gray-600 mt-2">{stats.stop}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-red-500">
          <p className="text-sm text-gray-500 font-medium">Alarm</p>
          <p className="text-4xl font-bold text-red-600 mt-2">{stats.alarmStatus}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-orange-500">
          <p className="text-sm text-gray-500 font-medium">Maintenance</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">{stats.maintenanceStatus}</p>
        </div>
      </div>

      {/* ส่วนแสดงสรุปงาน Alarm & Maintenance */}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">ภาพรวมงานซ่อมบำรุง (Work Records)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 flex items-center justify-between">
          <div>
            <p className="text-lg text-gray-500 font-medium">Total Alarms Recorded</p>
            <p className="text-sm text-gray-400 mt-1">ประวัติการแจ้งเตือนทั้งหมด</p>
          </div>
          <p className="text-5xl font-bold text-red-600">{stats.totalAlarms}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 flex items-center justify-between">
          <div>
            <p className="text-lg text-gray-500 font-medium">Total Maintenance Jobs</p>
            <p className="text-sm text-gray-400 mt-1">ประวัติการซ่อมบำรุงทั้งหมด</p>
          </div>
          <p className="text-5xl font-bold text-blue-600">{stats.totalMaintenance}</p>
        </div>
      </div>
    </div>
  )
}