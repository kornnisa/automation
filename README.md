
## 1. ชื่อโครงการและวัตถุประสงค์
- ชื่อโครงการ :  Management System
- วัตถุประสงค์ : พัฒนา Web Application สำหรับใช้สนับสนุนงานด้าน Automation และงานบำรุงรักษาเครื่องจักรในโรงงาน

## 2. Function หลักและ Technology ที่ใช้
Function หลัก :
- ระบบ Authentication และ Role-based access (Admin / Technician)
- ระบบจัดการข้อมูลเครื่องจักร (Machine Master - CRUD)
- ระบบบันทึกและจัดการสถานะ Alarm และ Maintenance
- ระบบค้นหาและกรองข้อมูล (Search & Filter)
- หน้า Dashboard สรุปข้อมูลเครื่องจักรและงานซ่อมบำรุง

Technology ที่ใช้ :
- Frontend = Next.js, Tailwind CSS
- Database & Auth = Supabase
- Version Control = GitHub
- CI/CD = GitHub Actions, Vercel

## 3. Database Structure
ระบบใช้ฐานข้อมูล Relational Database (PostgreSQL) ผ่าน Supabase ประกอบด้วย 4 ตารางหลัก:
- profiles = เก็บสิทธิ์ผู้ใช้งาน (`id` ผูกกับระบบ Auth, `role` แยก admin/technician)
- machines = ทะเบียนเครื่องจักร (`id`, `machine_id`, `machine_name`, `machine_type`, `location`, `status`)
- alarms = บันทึกข้อผิดพลาด (`id`, `machine_id`, `alarm_code`, `status`, `details`, `created_at`)
- maintenance_records = บันทึกงานซ่อมบำรุง (`id`, `machine_id`, `details`, `created_at`)

## 4. วิธีติดตั้งหรือใช้งาน (Getting Started)
1. โคลนโปรเจกต์ลงเครื่อง: `git clone <your-github-repo-url>`
2. รันคำสั่ง `npm install` เพื่อติดตั้ง dependencies
3. ตั้งค่าไฟล์ `.env.local` สำหรับเชื่อมต่อ Supabase (NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. รันคำสั่ง `npm run dev` เพื่อเปิดเซิร์ฟเวอร์
5. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

## 5. Vercel URL
Live Web Application : 'https://automation-inky-gamma.vercel.app/login'

## 6. รายละเอียดการใช้ AI ในการพัฒนา และส่วนที่ AI ช่วยสนับสนุน
ในการพัฒนาโปรเจกต์นี้ ได้มีการประยุกต์ใช้ AI Assistant (Gemini) เข้ามาช่วยสนับสนุนในขั้นตอนต่างๆ ดังนี้:
- Database Design = ใช้ AI ช่วยวิเคราะห์ความต้องการและออกแบบโครงสร้างตาราง (Table Schema) ให้รองรับระบบ Role-Based Access Control (RBAC)
- Code Generation = ใช้ AI ช่วยเขียนโครงร่าง (Boilerplate) ของ Next.js App Router และจัดหน้าต่าง UI ด้วย Tailwind CSS ให้ได้สไตล์ 
- Debugging & Error Handling = ใช้ AI ช่วยวิเคราะห์และแก้ไขปัญหา (Bug) เช่น ปัญหา WebSocket ใน Supabase Auth และปัญหาเวอร์ชันของ Node.js 
- CI/CD Setup = ใช้ AI ช่วยแนะนำการเขียนไฟล์ Workflow (`build.yml`) สำหรับ GitHub Actions และขั้นตอนการตั้งค่า Environment Variables บน Vercel
