#!/bin/bash

# สคริปต์สำหรับอัปโหลดโค้ดขึ้น GitHub Pages อัตโนมัติ
echo "🚀 เริ่มต้นกระบวนการอัปโหลดโค้ดสู่ GitHub..."

# 1. ตรวจสอบว่ามี Git หรือไม่
if ! command -v git &> /dev/null
then
    echo "❌ ไม่พบ Git ในระบบ กรุณาติดตั้ง Git หรือ Xcode Command Line Tools ก่อนรันสคริปต์นี้"
    exit 1
fi

# 2. เริ่มต้น Git repository
if [ ! -d ".git" ]; then
    echo "📦 กำลังเริ่มต้นระบบ Git Local Repository..."
    git init
    git remote add origin https://github.com/napasjajar1304-cyber/napasjajar1304-cyber.github.io.git
    git branch -M main
fi

# 3. เพิ่มไฟล์และทำการ Commit
echo "💾 กำลังบันทึกข้อมูลการเปลี่ยนแปลง (Commit)..."
git add index.html css/ js/
git commit -m "Upload Python learning web app for GitHub Pages deployment"

# 4. Push ข้อมูลขึ้น GitHub
echo "📤 กำลังอัปโหลดไฟล์ไปยัง repository ปลายทาง..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ อัปโหลดโค้ดเสร็จสมบูรณ์! เว็บไซต์ของคุณจะออนไลน์ในไม่ช้าที่:"
    echo "🔗 https://napasjajar1304-cyber.github.io/"
else
    echo "❌ เกิดข้อผิดพลาดในขณะอัปโหลด (Push) โค้ด กรุณาตรวจสอบสิทธิ์การเข้าถึงหรืออินเทอร์เน็ต"
fi
