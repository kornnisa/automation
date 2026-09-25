'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // เปลี่ยนรหัสผ่าน
  const [showPw, setShowPw] = useState(false)
  const [pwEmail, setPwEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Input Validation: ตรวจสอบว่าช่องข้อมูลไม่ว่างเปล่า
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน')
      return
    }

    setLoading(true)

    try {
      // เรียกใช้ Supabase เพื่อ Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      // ถ้ายืนยันตัวตนสำเร็จ ให้เปลี่ยนหน้าไปที่ Dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwMsg('')

    if (!pwEmail || !oldPassword || !newPassword) {
      setPwError('กรุณากรอกอีเมล รหัสผ่านเดิม และรหัสผ่านใหม่ให้ครบถ้วน')
      return
    }
    if (newPassword.length < 6) {
      setPwError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    setPwLoading(true)
    try {
      // 1) ยืนยันรหัสผ่านเดิมก่อน (จะได้ session ล่าสุดด้วย)
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: pwEmail,
        password: oldPassword,
      })
      if (signInErr) {
        setPwError('รหัสผ่านเดิมไม่ถูกต้อง หรือไม่พบอีเมลนี้ในระบบ')
        return
      }

      // 2) เปลี่ยนเป็นรหัสใหม่ (session เพิ่ง login => เปลี่ยนได้เลย)
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updateErr) {
        setPwError(updateErr.message)
        return
      }

      // 3) ออกจากระบบเพื่อให้กลับไป login ด้วยรหัสใหม่
      await supabase.auth.signOut()
      setPwMsg('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสใหม่')
      setPwEmail('')
      setOldPassword('')
      setNewPassword('')
    } catch (err: any) {
      setPwError(err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Alarm & Maintenance System
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline"
          >
            {showPw ? 'ซ่อน' : 'เปลี่ยนรหัสผ่าน'}
          </button>
        </div>

        {showPw && (
          <form onSubmit={handleChangePassword} className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 text-center">เปลี่ยนรหัสผ่าน</h3>
            {pwError && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">{pwError}</div>
            )}
            {pwMsg && (
              <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm text-center">{pwMsg}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={pwEmail}
                onChange={(e) => setPwEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านเดิม</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="New password (อย่างน้อย 6 ตัว)"
              />
            </div>
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-gray-800 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-900 transition disabled:bg-gray-400"
            >
              {pwLoading ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}