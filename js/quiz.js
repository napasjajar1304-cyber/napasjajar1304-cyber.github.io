// ระบบทำแบบทดสอบ (Bloom's Taxonomy Quiz Engine)
let currentQuizData = [];
let userAnswers = {};

// ฟังก์ชันสำหรับเรนเดอร์ข้อสอบท้ายบทเรียน
function renderQuiz(levelKey, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const quizSet = LESSON_CONTENT[levelKey].quizzes;
  currentQuizData = quizSet;
  userAnswers = {}; // เคลียร์คำตอบเก่า

  let html = `
    <div class="quiz-header">
      <h3>📝 แบบทดสอบวัดระดับความรู้ท้ายบทเรียน (${LESSON_CONTENT[levelKey].title})</h3>
      <p class="text-muted">คำถามครอบคลุมทักษะความรู้ตามหลัก Bloom's Taxonomy (จำ, เข้าใจ, ประยุกต์ใช้, วิเคราะห์)</p>
    </div>
    <form id="quiz-form" onsubmit="event.preventDefault(); submitQuiz('${levelKey}');">
  `;

  quizSet.forEach((q, qIndex) => {
    // แปลง Markdown Code block ในโจทย์คำถามแบบง่ายๆ
    let questionText = q.question
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
      
    // ตรวจสอบถ้ามี code blocks ในโจทย์ข้อสอบ ให้ใส่ pre/code tags
    if (questionText.includes("```python")) {
      questionText = questionText.replace(/```python([\s\S]*?)```/g, '<pre class="code-block-inline"><code>$1</code></pre>');
    } else {
      questionText = questionText.replace(/`([^`]+)`/g, '<code class="code-inline">$1</code>');
    }

    html += `
      <div class="quiz-card" id="quiz-card-${qIndex}">
        <div class="quiz-level-badge">${q.level}</div>
        <div class="quiz-question">${questionText}</div>
        <div class="quiz-options">
    `;

    q.options.forEach((opt, optIndex) => {
      html += `
        <label class="option-container" id="option-label-${qIndex}-${optIndex}">
          <input type="radio" name="question-${qIndex}" value="${optIndex}" required onclick="selectOption(${qIndex}, ${optIndex})">
          <span class="custom-radio"></span>
          <span class="option-text">${opt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>
        </label>
      `;
    });

    html += `
        </div>
        <div class="quiz-explanation-box d-none" id="explanation-${qIndex}">
          <strong>💡 อธิบายเพิ่มเติม (${q.level}):</strong> ${q.explanation}
        </div>
      </div>
    `;
  });

  html += `
      <div class="quiz-action-bar">
        <button type="submit" class="btn btn-primary" id="btn-submit-quiz">
          📤 ส่งคำตอบเพื่อประเมินผล
        </button>
      </div>
    </form>
    <div id="quiz-result-summary" class="quiz-result-summary d-none"></div>
  `;

  container.innerHTML = html;
}

// เลือกตัวเลือก (เปลี่ยนสีการเลือกเพื่อความลื่นไหลของ UI)
function selectOption(qIndex, optIndex) {
  const optionsCount = currentQuizData[qIndex].options.length;
  for (let i = 0; i < optionsCount; i++) {
    const label = document.getElementById(`option-label-${qIndex}-${i}`);
    if (label) {
      if (i === optIndex) {
        label.classList.add('selected');
      } else {
        label.classList.remove('selected');
      }
    }
  }
  userAnswers[qIndex] = optIndex;
}

// ตรวจข้อสอบและคำนวณคะแนน
function submitQuiz(levelKey) {
  const quizSet = LESSON_CONTENT[levelKey].quizzes;
  let score = 0;

  // ตรวจคำตอบแต่ละข้อ
  quizSet.forEach((q, qIndex) => {
    const selected = userAnswers[qIndex];
    const correct = q.answer;
    
    // แสดงกล่องอธิบาย
    const expBox = document.getElementById(`explanation-${qIndex}`);
    if (expBox) expBox.classList.remove('d-none');

    // ปิดช่องห้ามแก้ไขหลังจากส่งคำตอบ
    const inputs = document.querySelectorAll(`input[name="question-${qIndex}"]`);
    inputs.forEach(input => input.disabled = true);

    // ตกแต่งสีข้อที่ถูก/ผิด
    q.options.forEach((opt, optIndex) => {
      const label = document.getElementById(`option-label-${qIndex}-${optIndex}`);
      if (label) {
        label.classList.remove('selected');
        if (optIndex === correct) {
          label.classList.add('correct'); // สีเขียว
        } else if (optIndex === parseInt(selected)) {
          label.classList.add('wrong'); // สีแดง
        }
      }
    });

    if (parseInt(selected) === correct) {
      score++;
    }
  });

  // ซ่อนปุ่มส่งคำตอบ
  document.getElementById('btn-submit-quiz').style.display = 'none';

  // เลื่อนหน้าจอขึ้นไปดูผลสรุปผล
  const summaryBox = document.getElementById('quiz-result-summary');
  summaryBox.classList.remove('d-none');
  
  const percentage = (score / quizSet.length) * 100;
  const isPassed = percentage >= 75; // เกณฑ์ผ่าน 75% (ตอบถูก 3 ใน 4 ข้อขึ้นไป)

  let summaryHTML = `
    <div class="result-card ${isPassed ? 'passed' : 'failed'}">
      <div class="result-icon">${isPassed ? '🎉' : '✍️'}</div>
      <h4>สรุปผลการทดสอบ: ${isPassed ? 'ผ่านเกณฑ์!' : 'ยังไม่ผ่านเกณฑ์'}</h4>
      <div class="result-score">ได้คะแนน ${score} / ${quizSet.length} คะแนน (${percentage}%)</div>
  `;

  if (isPassed) {
    summaryHTML += `
      <p>ยินดีด้วย! คุณผ่านเกณฑ์ทดสอบในบทเรียนนี้ และสามารถปลดล็อกเนื้อหาหรือเหรียญเกียรติยศถัดไปได้แล้ว</p>
    `;
    // เรียกใช้ระบบบันทึกความก้าวหน้าใน app.js
    if (typeof unlockLevelProgress === 'function') {
      unlockLevelProgress(levelKey, score);
    }
  } else {
    summaryHTML += `
      <p>คุณตอบถูกน้อยกว่า 75% ลองทบทวนบทเรียนด้านบนและทดสอบใหม่อีกครั้งเพื่อสะสมคะแนนเพิ่มกันเถอะ!</p>
      <button onclick="retryQuiz('${levelKey}')" class="btn btn-secondary mt-2">🔁 ลองใหม่อีกครั้ง</button>
    `;
  }

  summaryHTML += `</div>`;
  summaryBox.innerHTML = summaryHTML;
  summaryBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// เริ่มทำข้อสอบใหม่
function retryQuiz(levelKey) {
  renderQuiz(levelKey, 'quiz-container');
}
