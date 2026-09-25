'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function IconFactory({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <path d="M9 9h1.5M13.5 9h1.5M9 13h1.5M13.5 13h1.5M9 17h1.5M13.5 17h1.5" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-300 via-slate-100 to-blue-200 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border-t-[12px] border-blue-600 p-8 md:p-10">
          {/* หัวบล็อก — รวมแบรนด์ + ฟอร์มในชิ้นเดียว */}
          <div className="flex flex-col items-center text-center mb-8">
            <span className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-200">
              <IconFactory className="h-8 w-8 text-white" />
            </span>
            <h1 className="mt-4 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-500 uppercase tracking-widest">
              Login
            </h1>
            <p className="mt-2 text-sm text-gray-500 flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              เข้าสู่ระบบ Alarm &amp; Maintenance
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="รหัสผ่านของคุณ"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-lg transition disabled:bg-gray-400"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Alarm & Maintenance System
        </p>
      </div>
    </div>
  )
}