// ระบบ Playground รัน Python ผ่าน Pyodide WebAssembly
let pyInstance = null;
let isLoadingPy = false;
let consoleTarget = null; // DOM Element ที่จะใช้พ่นข้อมูลออกจอ

// ฟังก์ชันระบุ Console DOM
function setConsoleTarget(element) {
  consoleTarget = element;
}

// ฟังก์ชันล้างจอ Console
function clearConsole() {
  if (consoleTarget) {
    consoleTarget.innerHTML = '';
  }
}

// ฟังก์ชันเขียน Log ลงใน Console จอภาพจำลอง
function writeToConsole(text, type = 'normal') {
  if (!consoleTarget) return;

  const line = document.createElement('div');
  line.classList.add('console-line');
  if (type === 'error') line.classList.add('text-danger');
  if (type === 'success') line.classList.add('text-success');
  if (type === 'system') line.classList.add('text-warning');
  
  line.textContent = text;
  consoleTarget.appendChild(line);
  consoleTarget.scrollTop = consoleTarget.scrollHeight; // เลื่อนหน้าจอลงล่างสุดอัตโนมัติ
}

// ฟังก์ชันโหลด Pyodide
async function initPyodide(statusCallback) {
  if (pyInstance) {
    if (statusCallback) statusCallback('ready');
    return pyInstance;
  }
  if (isLoadingPy) return;

  isLoadingPy = true;
  if (statusCallback) statusCallback('loading');

  try {
    writeToConsole("⏳ กำลังเตรียมสภาพแวดล้อม Python Engine (รันบนเบราว์เซอร์ครั้งแรกอาจใช้เวลา 10-15 วินาที)...", "system");
    
    // เรียกโหลด Pyodide
    pyInstance = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
      stdout: (msg) => {
        writeToConsole(msg, 'normal');
      },
      stderr: (msg) => {
        writeToConsole(msg, 'error');
      }
    });

    isLoadingPy = false;
    writeToConsole("✅ Python Engine พร้อมใช้งานแล้ว! คุณสามารถพิมพ์และรันโค้ดได้เลย", "success");
    if (statusCallback) statusCallback('ready');
    return pyInstance;
  } catch (error) {
    isLoadingPy = false;
    writeToConsole("❌ เกิดข้อผิดพลาดในการโหลด Python Engine: " + error.message, "error");
    if (statusCallback) statusCallback('error', error);
  }
}

// ฟังก์ชันเรียกใช้โค้ด Python
async function runPythonCode(code, statusCallback) {
  if (!pyInstance) {
    writeToConsole("⚠️ กรุณารอให้ระบบโหลด Python Engine เสร็จสิ้นก่อนรันโค้ด", "system");
    await initPyodide(statusCallback);
    if (!pyInstance) return;
  }

  try {
    writeToConsole("🏃 กำลังประมวลผลโค้ด...", "system");
    
    // ดักจับและทำความสะอาดโค้ด
    // Pyodide รันโค้ดแบบ Async ได้ เพื่อไม่ให้เว็บบล็อกการทำงาน
    let result = await pyInstance.runPythonAsync(code);
    
    // ถ้ารันผ่านและมีข้อมูลคืนค่ากลับมา (ที่ไม่ใช่ None) ให้ปริ้นแสดง
    if (result !== undefined && result !== null) {
      // ตรวจสอบว่าไม่ใช่ object หรือฟังก์ชันภายในของ Pyodide
      if (typeof result !== 'object') {
        writeToConsole(`[ค่าส่งคืนจากโปรแกรม: ${result}]`, 'success');
      }
    }
    writeToConsole("✨ ทำงานเสร็จสมบูรณ์", "system");
  } catch (err) {
    // ปรับแต่งการแสดงข้อผิดพลาด Python ให้ดูง่ายขึ้นสำหรับนักศึกษาปี 1
    let errorMsg = err.message;
    // ตัดทอน Traceback ส่วนในของ JavaScript ออกให้เหลือน้อยที่สุด
    if (errorMsg.includes("Traceback")) {
      const parts = errorMsg.split("Traceback (most recent call last):");
      errorMsg = parts[parts.length - 1].trim();
    }
    writeToConsole("❌ เกิดข้อผิดพลาดตอนรันโปรแกรม:\n" + errorMsg, "error");
  }
}
