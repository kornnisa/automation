import { redirect } from 'next/navigation'

export default function Home() {
  // สั่งให้เมื่อเข้ามาที่หน้าเว็บหลัก ให้เด้งไปที่หน้า login ทันที
  redirect('/login')
}