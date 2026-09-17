# Alarm & Maintenance Management System

## 1. ชื่อโครงการและวัตถุประสงค์
- **ชื่อโครงการ:** Alarm & Maintenance Management System
- **วัตถุประสงค์:** พัฒนา Web Application สำหรับใช้สนับสนุนงานด้าน Automation และงานบำรุงรักษาเครื่องจักรในโรงงาน

## 2. Function หลักและ Technology ที่ใช้
**Function หลัก:**
- ระบบ Authentication และ Role-based access (Admin / Technician)
- ระบบจัดการข้อมูลเครื่องจักร (Machine Master - CRUD)
- ระบบบันทึกและจัดการสถานะ Alarm และ Maintenance
- ระบบค้นหาและกรองข้อมูล (Search & Filter)
- หน้า Dashboard สรุปข้อมูลเครื่องจักรและงานซ่อมบำรุง

**Technology ที่ใช้:**
- Frontend: Next.js, Tailwind CSS
- Database & Auth: Supabase
- Version Control: GitHub
- CI/CD: GitHub Actions, Vercel

## 3. Database Structure
*(เดี๋ยวเรามาเติมโครงสร้างตาราง profiles, machines, alarms, maintenance_records ที่นี่ทีหลังครับ)*

## 4. วิธีติดตั้งหรือใช้งาน (Getting Started)
1. Clone repository นี้
2. รันคำสั่ง `npm install` เพื่อติดตั้ง dependencies
3. ตั้งค่าไฟล์ `.env.local` สำหรับเชื่อมต่อ Supabase (NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. รันคำสั่ง `npm run dev` เพื่อเปิดเซิร์ฟเวอร์
5. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

## 5. Vercel URL
*(รอใส่ Link หลังจากทำการ Deploy บน Vercel ใน Phase สุดท้ายครับ)*

## 6. รายละเอียดการใช้ AI ในการพัฒนา และส่วนที่ AI ช่วยสนับสนุน
*(อธิบายสั้นๆ ว่าใช้ AI ตัวไหน เช่น ChatGPT/Gemini/GitHub Copilot ช่วยในขั้นตอนใดบ้าง เช่น วิเคราะห์ Requirement, ออกแบบฐานข้อมูล, เขียนโค้ดหน้า Login ฯลฯ)*