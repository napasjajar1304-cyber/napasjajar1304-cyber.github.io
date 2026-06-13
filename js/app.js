// ระบบควบคุมหลักของเว็บไซต์ (Main Application Router & State Manager)
let appState = {
  currentLevel: 'level1',
  currentTopicIndex: 0,
  progress: {
    level1: { completed: false, score: 0 },
    level2: { completed: false, score: 0 },
    level3: { completed: false, score: 0 },
    level4: { completed: false, score: 0 }
  },
  badges: [],
  theme: 'light',
  playgroundRunCount: 0
};

// เริ่มต้นโหลดหน้าเว็บ
window.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  setupTheme();
  renderSidebar();
  loadTopic(appState.currentLevel, appState.currentTopicIndex);
  updateBadgesCabinet();
  updateProgressUI();

  // กำหนด console target สำหรับ playground
  const consoleEl = document.getElementById('terminal-console');
  setConsoleTarget(consoleEl);

  // ผูกตัวตรวจจับเหตุการณ์สำหรับปุ่มใน Playground
  document.getElementById('btn-run-code').addEventListener('click', async () => {
    const code = document.getElementById('code-editor').value;
    const runBtn = document.getElementById('btn-run-code');
    runBtn.disabled = true;
    runBtn.textContent = '⚡ กำลังทำงาน...';
    
    // บันทึกและปลดล็อก Badge นักทดลอง หากใช้งานครั้งแรก
    appState.playgroundRunCount++;
    if (appState.playgroundRunCount === 1) {
      unlockBadge('Playground Master 🧪');
    }
    
    await runPythonCode(code, (status) => {
      const loader = document.getElementById('py-engine-loader');
      if (status === 'loading') {
        loader.classList.remove('d-none');
        loader.textContent = '⏳ กำลังสตาร์ท Python Engine...';
      } else if (status === 'ready') {
        loader.classList.add('d-none');
      } else if (status === 'error') {
        loader.classList.remove('d-none');
        loader.textContent = '❌ โหลดไม่สำเร็จ';
      }
    });

    runBtn.disabled = false;
    runBtn.textContent = '⚡ รันรหัส (Run)';
  });

  // ปุ่มล้างคอนโซล
  document.getElementById('btn-clear-console').addEventListener('click', () => {
    clearConsole();
  });

  // พิมพ์ข้อความต้อนรับครั้งแรกในเทอร์มินัล
  writeToConsole("🐍 ระบบเทอร์มินัล Python พร้อมแล้ว\nคลิกปุ่ม 'รันรหัส' ด้านบนเพื่อประมวลผลโค้ดตัวอย่างในเบราว์เซอร์ได้ทันที", "system");
  
  // อัปโหลด Pyodide ในเบื้องหลังเงียบๆ
  initPyodide();
});

// ฟังก์ชันดึงประวัติการเรียนจาก LocalStorage
function loadProgress() {
  const stored = localStorage.getItem('python_learning_progress');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      appState.progress = parsed.progress || appState.progress;
      appState.badges = parsed.badges || appState.badges;
      appState.currentLevel = parsed.currentLevel || appState.currentLevel;
      appState.currentTopicIndex = parsed.currentTopicIndex || 0;
      appState.theme = parsed.theme || appState.theme;
      appState.playgroundRunCount = parsed.playgroundRunCount || 0;
    } catch (e) {
      console.error("Error loading localStorage progress", e);
    }
  }
}

// ฟังก์ชันเซฟความก้าวหน้า
function saveProgress() {
  localStorage.setItem('python_learning_progress', JSON.stringify({
    progress: appState.progress,
    badges: appState.badges,
    currentLevel: appState.currentLevel,
    currentTopicIndex: appState.currentTopicIndex,
    theme: appState.theme,
    playgroundRunCount: appState.playgroundRunCount
  }));
}

// ระบบจัดการธีมสีอบอุ่น (Theme Manager)
function setupTheme() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const body = document.documentElement;

  if (appState.theme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    toggleBtn.textContent = '☀️ โหมดกลางวัน';
  } else {
    body.setAttribute('data-theme', 'light');
    toggleBtn.textContent = '🌙 โหมดกลางคืน';
  }

  toggleBtn.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'dark') {
      body.setAttribute('data-theme', 'light');
      appState.theme = 'light';
      toggleBtn.textContent = '🌙 โหมดกลางคืน';
    } else {
      body.setAttribute('data-theme', 'dark');
      appState.theme = 'dark';
      toggleBtn.textContent = '☀️ โหมดกลางวัน';
    }
    saveProgress();
  });
}

// สร้าง Sidebar และความก้าวหน้าในระดับต่างๆ
function renderSidebar() {
  const container = document.getElementById('sidebar-menu-list');
  let html = '';

  for (const [key, level] of Object.entries(LESSON_CONTENT)) {
    const isCompleted = appState.progress[key].completed;
    const isCurrent = appState.currentLevel === key;
    
    html += `
      <div class="sidebar-level ${isCurrent ? 'active' : ''}">
        <div class="sidebar-level-header" onclick="selectLevel('${key}')">
          <span class="status-dot ${isCompleted ? 'completed' : 'locked'}">
            ${isCompleted ? '✓' : '•'}
          </span>
          <span class="level-title-text">${level.title}</span>
        </div>
        <div class="sidebar-topics">
    `;

    level.topics.forEach((topic, idx) => {
      const isTopicActive = isCurrent && appState.currentTopicIndex === idx;
      html += `
        <div class="sidebar-topic-item ${isTopicActive ? 'active' : ''}" 
             onclick="selectTopic('${key}', ${idx})">
          ${topic.id} ${topic.title}
        </div>
      `;
    });

    // เพิ่มแบบทดสอบลงในเมนู Sidebar
    const isQuizActive = isCurrent && appState.currentTopicIndex === level.topics.length;
    html += `
        <div class="sidebar-topic-item sidebar-quiz-item ${isQuizActive ? 'active' : ''}" 
             onclick="selectQuiz('${key}')">
          📝 แบบทดสอบท้ายบทเรียน
        </div>
      </div>
    </div>
    `;
  }

  container.innerHTML = html;
}

// เลือกด่านใหญ่
function selectLevel(levelKey) {
  appState.currentLevel = levelKey;
  appState.currentTopicIndex = 0;
  saveProgress();
  renderSidebar();
  loadTopic(levelKey, 0);
  closeSidebarOnMobile();
}

// เลือกเรื่องย่อย
function selectTopic(levelKey, topicIdx) {
  appState.currentLevel = levelKey;
  appState.currentTopicIndex = topicIdx;
  saveProgress();
  renderSidebar();
  loadTopic(levelKey, topicIdx);
  closeSidebarOnMobile();
}

// เลือกแบบทดสอบ
function selectQuiz(levelKey) {
  appState.currentLevel = levelKey;
  appState.currentTopicIndex = LESSON_CONTENT[levelKey].topics.length; // ท้ายสุดคือด่านควิซ
  saveProgress();
  renderSidebar();
  loadQuiz(levelKey);
  closeSidebarOnMobile();
}

// ปิด Sidebar บนมือถืออัตโนมัติเมื่อกดเลือกเมนู
function closeSidebarOnMobile() {
  if (window.innerWidth < 992) {
    const wrapper = document.getElementById('app-wrapper');
    if (wrapper) wrapper.classList.remove('sidebar-open');
  }
}

// โหลดเรื่องที่เรียนลงหน้าจอ
function loadTopic(levelKey, idx) {
  const topic = LESSON_CONTENT[levelKey].topics[idx];
  const contentEl = document.getElementById('lesson-dynamic-area');
  
  if (!topic) return;

  // เส้นนำทาง Breadcrumbs
  document.getElementById('breadcrumb-path').innerHTML = `
    <li>บทเรียน</li>
    <li>${LESSON_CONTENT[levelKey].title}</li>
    <li>${topic.title}</li>
  `;

  // แปลง markdown เป็น HTML ด้วยฟังก์ชันจำลอง
  const parsedHTML = formatContent(topic.content);
  
  // นำทางด้านล่าง
  const hasPrev = idx > 0;
  const hasNext = idx < LESSON_CONTENT[levelKey].topics.length - 1;

  let navigationHTML = `<div class="content-nav-buttons">`;
  if (hasPrev) {
    navigationHTML += `<button class="btn btn-secondary" onclick="selectTopic('${levelKey}', ${idx - 1})">⬅️ ก่อนหน้า</button>`;
  } else {
    // หาปุ่มถอยกลับไปบทก่อนหน้า
    const keys = Object.keys(LESSON_CONTENT);
    const prevKeyIdx = keys.indexOf(levelKey) - 1;
    if (prevKeyIdx >= 0) {
      navigationHTML += `<button class="btn btn-secondary" onclick="selectLevel('${keys[prevKeyIdx]}')">⬅️ บทเรียนก่อนหน้า</button>`;
    } else {
      navigationHTML += `<span></span>`;
    }
  }

  if (hasNext) {
    navigationHTML += `<button class="btn btn-primary" onclick="selectTopic('${levelKey}', ${idx + 1})">ถัดไป ➡️</button>`;
  } else {
    navigationHTML += `<button class="btn btn-primary btn-accent" onclick="selectQuiz('${levelKey}')">📝 ทำแบบทดสอบท้ายบทเรียน</button>`;
  }
  navigationHTML += `</div>`;

  contentEl.innerHTML = `
    <article class="lesson-article">
      <h1 class="lesson-title">${topic.title}</h1>
      <div class="lesson-body">${parsedHTML}</div>
      <div class="card-action-paste">
        <div class="alert-box alert-tip">
          <span class="alert-icon">💡</span>
          <span class="alert-text">ต้องการทดสอบโค้ดเรื่องนี้ใช่ไหม? คลิกปุ่มด้านล่างเพื่อคัดลอกตัวอย่างเข้ากล่อง Sandbox ด้านขวาแล้วกดรันได้ทันที!</span>
        </div>
        <button class="btn btn-primary" onclick="copyExampleToPlayground('${levelKey}', ${idx})">
          📥 คัดลอกโค้ดไปยัง Sandbox
        </button>
      </div>
      ${navigationHTML}
    </article>
  `;

  // โหลดโค้ดตัวอย่างเข้า Playground อัตโนมัติ เพื่อสร้างความสะดวกสบาย
  document.getElementById('code-editor').value = topic.codeExample;
}

// คัดลอกตัวอย่างโค้ดไปสู่ Playground
function copyExampleToPlayground(levelKey, idx) {
  const topic = LESSON_CONTENT[levelKey].topics[idx];
  if (topic && topic.codeExample) {
    document.getElementById('code-editor').value = topic.codeExample;
    // เลื่อนหน้าจอไปหา Playground บนอุปกรณ์หน้าจอเล็ก
    if (window.innerWidth < 992) {
      document.getElementById('code-playground-card').scrollIntoView({ behavior: 'smooth' });
    }
  }
}

// โหลดระบบควิซท้ายบทเรียน
function loadQuiz(levelKey) {
  document.getElementById('breadcrumb-path').innerHTML = `
    <li>บทเรียน</li>
    <li>${LESSON_CONTENT[levelKey].title}</li>
    <li>แบบทดสอบวัดผลสัมฤทธิ์</li>
  `;

  renderQuiz(levelKey, 'lesson-dynamic-area');
}

// ฟังก์ชันปลดล็อกระดับถัดไป (ถูกเรียกโดย quiz.js)
function unlockLevelProgress(levelKey, quizScore) {
  appState.progress[levelKey].completed = true;
  appState.progress[levelKey].score = quizScore;

  // ปลดล็อกเกียรติยศระดับบทเรียน
  const levelBadge = LESSON_CONTENT[levelKey].badge;
  unlockBadge(levelBadge);

  // ปลดล็อกเกียรติยศอัจฉริยะหากคะแนนเต็ม 4
  if (quizScore === 4) {
    unlockBadge("อัจฉริยะยอดเพชร 🌟");
  }

  // หาลำดับบทถัดไป
  const keys = Object.keys(LESSON_CONTENT);
  const currentKeyIndex = keys.indexOf(levelKey);
  
  if (currentKeyIndex < keys.length - 1) {
    const nextLevelKey = keys[currentKeyIndex + 1];
    // ปลดล็อกให้เรียนระดับถัดไปได้
    writeToConsole(`🎉 ปลดล็อกบทเรียนถัดไปแล้ว: ${LESSON_CONTENT[nextLevelKey].title}`, "success");
  } else {
    // จบการศึกษา
    unlockBadge("ผู้สำเร็จยอดวิชา Python 🏆");
  }

  saveProgress();
  renderSidebar();
  updateProgressUI();
  updateBadgesCabinet();
}

// ระบบสะสมเหรียญตรา (Badge Cabinet)
function unlockBadge(badgeName) {
  if (!appState.badges.includes(badgeName)) {
    appState.badges.push(badgeName);
    showFloatingBadgeNotification(badgeName);
    saveProgress();
  }
}

// แสดงแจ้งเตือนตราความดีแบบลอยขึ้น
function showFloatingBadgeNotification(badgeName) {
  const container = document.getElementById('floating-alerts');
  const alert = document.createElement('div');
  alert.className = 'badge-achievement-toast animate-toast';
  alert.innerHTML = `
    <div class="toast-title">🎖️ คุณได้รับตราเกียรติยศใหม่!</div>
    <div class="toast-name">${badgeName}</div>
  `;
  container.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 4000);
}

// ปรับปรุงผลคะแนนความก้าวหน้าและการแสดงผลในหน้าเว็บ
function updateProgressUI() {
  const keys = Object.keys(LESSON_CONTENT);
  let completedCount = 0;
  
  keys.forEach(k => {
    if (appState.progress[k].completed) completedCount++;
  });

  const percent = Math.round((completedCount / keys.length) * 100);
  
  // อัปเดต Progress bar ใน Sidebar
  document.getElementById('overall-progress-bar').style.width = `${percent}%`;
  document.getElementById('progress-percentage-text').textContent = `${percent}%`;
}

// ปรับปรุงการเรนเดอร์ตู้เกียรติยศ (Badge Cabinet)
function updateBadgesCabinet() {
  const cabinet = document.getElementById('badges-box');
  if (!cabinet) return;

  if (appState.badges.length === 0) {
    cabinet.innerHTML = '<span class="empty-badge-msg">ยังไม่มีตราเกียรติยศ (ผ่านบทเรียนและทดสอบเพื่อสะสม)</span>';
    return;
  }

  let html = '';
  appState.badges.forEach(badge => {
    html += `<span class="badge-item-tag" title="เกียรติยศวิชาการ">${badge}</span>`;
  });
  cabinet.innerHTML = html;
}

// ฟังก์ชันล้างความจำการเรียนรู้
function resetLearningProgress() {
  if (confirm("⚠️ คุณต้องการรีเซ็ตข้อมูลความก้าวหน้า คะแนนสอบ และตราเกียรติยศทั้งหมดใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)")) {
    localStorage.removeItem('python_learning_progress');
    appState = {
      currentLevel: 'level1',
      currentTopicIndex: 0,
      progress: {
        level1: { completed: false, score: 0 },
        level2: { completed: false, score: 0 },
        level3: { completed: false, score: 0 },
        level4: { completed: false, score: 0 }
      },
      badges: [],
      theme: 'light',
      playgroundRunCount: 0
    };
    
    // รีเฟรชหน้าเว็บใหม่
    window.location.reload();
  }
}

// ==================== ตัววิเคราะห์ข้อความ Markdown เป็น HTML (Custom Compiler) ====================
function formatContent(text) {
  let lines = text.split('\n');
  let inList = false;
  let html = '';
  let inCode = false;
  let codeBuffer = '';

  for (let line of lines) {
    // บล็อกโค้ดภาษา Python
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html += `<pre class="code-block-python"><code>${codeBuffer.trim()}</code></pre>`;
        codeBuffer = '';
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    
    if (inCode) {
      codeBuffer += escapeHTML(line) + '\n';
      continue;
    }

    let trimmed = line.trim();

    // หัวข้อหลัก
    if (trimmed.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h3>${parseInlineMarkdown(trimmed.substring(4))}</h3>`;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2>${parseInlineMarkdown(trimmed.substring(3))}</h2>`;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h1>${parseInlineMarkdown(trimmed.substring(2))}</h1>`;
      continue;
    }

    // เส้นคั่นเส้นแบ่งบทเรียน
    if (trimmed === '---') {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<hr class="divider">`;
      continue;
    }

    // กล่องข้อความแจ้งเตือน (Alert Boxes)
    if (trimmed.startsWith('> ')) {
      if (inList) { html += '</ul>'; inList = false; }
      let alertContent = trimmed.substring(2);
      let alertClass = 'alert-normal';
      let icon = '📝';
      
      if (alertContent.startsWith('💡')) {
        alertClass = 'alert-tip';
        icon = '💡';
        alertContent = alertContent.substring(2).trim();
      } else if (alertContent.startsWith('⚠️')) {
        alertClass = 'alert-warning';
        icon = '⚠️';
        alertContent = alertContent.substring(2).trim();
      } else if (alertContent.startsWith('🚨')) {
        alertClass = 'alert-caution';
        icon = '🚨';
        alertContent = alertContent.substring(2).trim();
      }
      
      html += `<div class="alert-box ${alertClass}"><span class="alert-icon">${icon}</span><span class="alert-text">${parseInlineMarkdown(alertContent)}</span></div>`;
      continue;
    }

    // รายการแบบมีหัวข้อ (List Items)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!inList) {
        html += '<ul class="lesson-list">';
        inList = true;
      }
      html += `<li>${parseInlineMarkdown(trimmed.substring(2))}</li>`;
      continue;
    }

    // บรรทัดว่างเปล่า
    if (trimmed === '') {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      continue;
    }

    // บรรทัดข้อความปกติ
    if (inList) {
      html += '</ul>';
      inList = false;
    }
    html += `<p>${parseInlineMarkdown(line)}</p>`;
  }

  if (inList) {
    html += '</ul>';
  }

  return html;
}

// ตกแต่งตัวเอียง ตัวหนา โค้ดอินไลน์
function parseInlineMarkdown(text) {
  return escapeHTML(text)
    // จัดการ code แบบ inline ย่อยๆ
    .replace(/`([^`]+)`/g, '<code class="code-inline">$1</code>')
    // ตัวเน้นความเข้มแบบหนา **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

// ป้องกันโค้ดแปลกปลอมและแก้ปัญหารูปลักษณ์ในหน้า HTML
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
