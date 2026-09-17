'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  
  // เพิ่ม State สำหรับเก็บ Role ของผู้ใช้
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    // 1. ดึงข้อมูลว่าใคร Login อยู่
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // 2. เอา ID ไปเทียบในตาราง profiles เพื่อดึงสิทธิ์ (role)
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setUserRole(data.role) // เช่น 'admin' หรือ 'technician'
      }
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 font-bold text-xl border-b border-gray-800 text-center text-blue-400">
          Automation Web
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link 
            href="/dashboard" 
            className={`block p-3 rounded transition-colors ${isActive('/dashboard') ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            📊 Dashboard
          </Link>
          
          {/* เงื่อนไข: จะแสดงเมนูนี้ก็ต่อเมื่อ userRole เป็น 'admin' เท่านั้น */}
          {userRole?.toLowerCase() === 'admin' && (
            <Link 
              href="/dashboard/machines" 
              className={`block p-3 rounded transition-colors ${isActive('/dashboard/machines') ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            >
              ⚙️ Machine Master
            </Link>
          )}

          <Link 
            href="/dashboard/alarms" 
            className={`block p-3 rounded transition-colors ${isActive('/dashboard/alarms') ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            🚨 Alarms
          </Link>
          <Link 
            href="/dashboard/maintenance" 
            className={`block p-3 rounded transition-colors ${isActive('/dashboard/maintenance') ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            🔧 Maintenance
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          {/* แสดง Role ให้รู้ว่าล็อกอินด้วยสิทธิ์อะไรอยู่ */}
          {!loading && (
            <div className="mb-4 text-center text-sm text-gray-400">
              Logged in as: <span className="font-semibold text-white uppercase">{userRole}</span>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}