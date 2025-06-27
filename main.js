// Timer State
let isRunning = false;
let frameCount = 0;
let startTime = null;
let fps = 25;
let animationFrameId = null;
let totalComments = 0;
const undoStack = []; // สำหรับเก็บแถวที่ถูกเพิ่มล่าสุด

const timerDisplayParts = document.querySelectorAll('#timer-display .time-part');
const toggleButton = document.getElementById('toggle-timer');
const fpsSelect = document.querySelector('.fps-select');
const tableBody = document.querySelector('#timestamp-table tbody');
const clearButton = document.querySelector('.table-footer button');
const logStartEl = document.getElementById('log-session-start');
const logTotalComment = document.getElementById('log-total-comment');

// Warn before refresh/close
window.addEventListener('beforeunload', function (e) {
  e.preventDefault();
  e.returnValue = 'มีการบันทึกข้อมูลไว้ หากรีเฟรชหรือปิดหน้าจะสูญหาย';
});

// Utils
function formatTimestamp(frame, fps) {
  const totalSeconds = Math.floor(frame / fps);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  const f = String(frame % fps).padStart(2, '0');
  return `${h}:${m}:${s}:${f}`;
}

function updateTimerDisplay() {
  const parts = formatTimestamp(frameCount, fps).split(':');
  timerDisplayParts.forEach((el, i) => el.textContent = parts[i]);
}

function tick() {
  const now = Date.now();
  frameCount = Math.floor((now - startTime) / 1000 * fps);
  updateTimerDisplay();
  animationFrameId = requestAnimationFrame(tick);
}

function startTimer() {
  startTime = Date.now() - (frameCount / fps) * 1000;
  animationFrameId = requestAnimationFrame(tick);
  toggleButton.textContent = 'Stop';
  toggleButton.style.backgroundColor = '#ff4d4d'; // ✅ เปลี่ยนสีเป็นแดง
  isRunning = true;
  logStartEl.textContent = new Date().toLocaleTimeString();
}

function stopTimer() {
  cancelAnimationFrame(animationFrameId);
  toggleButton.textContent = 'Record';
  toggleButton.style.backgroundColor = ''; // ✅ คืนค่าสีเดิม
  isRunning = false;
}

// Events
toggleButton.addEventListener('click', () => {
  isRunning ? stopTimer() : startTimer();
});

fpsSelect.addEventListener('change', () => {
  const wasRunning = isRunning;
  if (wasRunning) stopTimer();
  fps = parseInt(fpsSelect.value);
  if (wasRunning) startTimer();
});

function addComment(text) {
  const row = document.createElement('tr');
  const timeCell = document.createElement('td');
  const commentCell = document.createElement('td');

  timeCell.textContent = formatTimestamp(frameCount, fps);
  commentCell.textContent = text;
  commentCell.contentEditable = true;

  row.appendChild(timeCell);
  row.appendChild(commentCell);

  if (tableBody.firstChild) {
    tableBody.insertBefore(row, tableBody.firstChild);
  } else {
    tableBody.appendChild(row);
  }

  undoStack.push(row); // บันทึกแถวล่าสุดไว้สำหรับ Undo


  totalComments++;
  logTotalComment.textContent = totalComments;
}

document.querySelectorAll('#comment-section button[id$="-comment"]').forEach(button => {
  button.addEventListener('click', () => {
    const label = button.textContent;
    addComment(label);
  });
});

const customInput = document.querySelector('#comment-section input[type="text"]');
const sendButton = document.querySelector('#comment-section .comment-group button');
sendButton.addEventListener('click', () => {
  const value = customInput.value.trim();
  if (value) {
    addComment(value);
    customInput.value = '';
  }
});

clearButton.addEventListener('click', () => {
  showConfirmModal('คุณต้องการล้างข้อมูลทั้งหมดและรีเซ็ตเวลาหรือไม่?', () => {
    tableBody.innerHTML = '';
    totalComments = 0;
    logTotalComment.textContent = '0';
    frameCount = 0;
    updateTimerDisplay();
    stopTimer();
  });
});

const undoButton = document.querySelectorAll('.table-footer button')[1];
undoButton.addEventListener('click', () => {
  const lastRow = undoStack.pop();
  if (lastRow && tableBody.contains(lastRow)) {
    tableBody.removeChild(lastRow);
    totalComments--;
    logTotalComment.textContent = totalComments;
  }
});


function showConfirmModal(message, onConfirm) {
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.background = 'rgba(0, 0, 0, 0.6)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999';

  const box = document.createElement('div');
  box.style.background = '#fff';
  box.style.padding = '20px 30px';
  box.style.borderRadius = '12px';
  box.style.textAlign = 'center';
  box.style.fontFamily = 'Montserrat';

  const msg = document.createElement('p');
  msg.textContent = message;
  msg.style.marginBottom = '20px';
  msg.style.color = '#333';

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.justifyContent = 'center';
  btnContainer.style.gap = '12px';

  const yesBtn = document.createElement('button');
  yesBtn.textContent = 'ยืนยัน';
  yesBtn.style.background = '#6a47ff';
  yesBtn.style.color = '#fff';
  yesBtn.style.border = 'none';
  yesBtn.style.padding = '8px 20px';
  yesBtn.style.borderRadius = '8px';
  yesBtn.style.cursor = 'pointer';

  const noBtn = document.createElement('button');
  noBtn.textContent = 'ยกเลิก';
  noBtn.style.background = '#ccc';
  noBtn.style.border = 'none';
  noBtn.style.padding = '8px 20px';
  noBtn.style.borderRadius = '8px';
  noBtn.style.cursor = 'pointer';

  yesBtn.onclick = () => {
    onConfirm();
    document.body.removeChild(modal);
  };
  noBtn.onclick = () => {
    document.body.removeChild(modal);
  };

  btnContainer.appendChild(yesBtn);
  btnContainer.appendChild(noBtn);
  box.appendChild(msg);
  box.appendChild(btnContainer);
  modal.appendChild(box);
  document.body.appendChild(modal);
}

// เพิ่มฟังก์ชัน Fullscreen Toggle
function toggleFullScreen() {
  const elem = document.documentElement; // หรือ document.body ก็ได้

  if (!document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen(); // iOS Safari
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen(); // IE/Edge
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen(); // iOS Safari
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen(); // IE/Edge
    }
  }
}


// ผูกปุ่มกับฟังก์ชัน
const fullscreenBtn = document.getElementById('fullscreen-actions');
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', toggleFullScreen);
}



/**
 *ตัดที่ตรงนี้
 */

const exportButton = document.querySelector('.export-button');
const importButton = document.querySelector('.import-button');

exportButton.addEventListener('click', () => {
  showExportOptions();
});

function showExportOptions() {
  showConfirmModal('เลือกประเภทการ Export', null, [
    { label: 'CSV', action: exportCSV },
    { label: 'SRT (Final Cut)', action: exportSRT },
    { label: 'PDF', action: exportPDF },
    { label: 'JSON', action: exportJSON },
    { label: 'ยกเลิก', action: () => {} } // 👈 เพิ่มปุ่ม Cancel
  ]);
}

function getExportFilename(ext) {
  const date = new Date().toISOString().split('T')[0];
  const name = document.querySelector('#projectName')?.value?.trim().replace(/\s+/g, '_') || 'Unnamed';
  const videographer = document.querySelector('[name="videographer"]')?.value?.trim().replace(/\s+/g, '_') || 'Unknown';
  return `${date}_${name}_${videographer}.${ext}`;
}

/**
 * Export เป็น CSV:
 * - รวมข้อมูลจากฟอร์ม Project Setting
 * - รวมความคิดเห็นจากตาราง
 * - รวมข้อมูล Log (เวลาเริ่มและจำนวนคอมเมนต์)
 */
function exportCSV() {
  const data = [];
  const rows = tableBody.querySelectorAll('tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    data.push(`${cells[0].textContent},${cells[1].textContent}`);
  });
  const settings = Array.from(document.querySelectorAll('#projectForm input, #projectForm select')).map(el => `${el.name || el.id},${el.value}`).join('\n');
  const log = `Session Start,${logStartEl.textContent}\nTotal Comment,${logTotalComment.textContent}`;
  const csv = `Project Settings:\n${settings}\n\nComments:\n${data.join('\n')}\n\nLog:\n${log}`;

  downloadFile(csv, getExportFilename('csv'), 'text/csv');
}

/**
 * Export เป็น SRT (สำหรับ Final Cut Pro):
 * - ดึงคอมเมนต์ทั้งหมดจากตาราง
 * - แปลง timestamp เป็นรูปแบบ SRT และเพิ่มเวลา +1 วินาที
 */
function exportSRT() {
  const rows = Array.from(tableBody.querySelectorAll('tr')).reverse();
  let count = 1;
  const srt = rows.map(row => {
    const [h, m, s, f] = row.children[0].textContent.split(':').map(Number);
    const totalStart = ((h * 3600 + m * 60 + s + (f / fps)));
    const totalEnd = totalStart + 1;
    const format = t => {
      const hr = String(Math.floor(t / 3600)).padStart(2, '0');
      const mn = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
      const sc = String(Math.floor(t % 60)).padStart(2, '0');
      const ms = String(Math.floor((t % 1) * 1000)).padStart(3, '0');
      return `${hr}:${mn}:${sc},${ms}`;
    };
    return `${count++}\n${format(totalStart)} --> ${format(totalEnd)}\n${row.children[1].textContent}\n`;
  }).join('\n');
  downloadFile(srt, getExportFilename('srt'), 'text/plain');
}

/**
 * Export เป็น PDF:
 * - รวมข้อมูล Project Setting, Comments และ Log
 * - ใช้ Blob เพื่อสร้างไฟล์ PDF อย่างง่าย
 */
function exportPDF() {
  const doc = [
    'Project Settings:',
    ...Array.from(document.querySelectorAll('#projectForm input, #projectForm select')).map(el => `${el.name || el.id}: ${el.value}`),
    '',
    'Comments:',
    ...Array.from(tableBody.querySelectorAll('tr')).map(row => {
      const cells = row.querySelectorAll('td');
      return `${cells[0].textContent} - ${cells[1].textContent}`;
    }),
    '',
    'Log:',
    `Session Start: ${logStartEl.textContent}`,
    `Total Comment: ${logTotalComment.textContent}`
  ].join('\n');

  const blob = new Blob([doc], { type: 'application/pdf' });
  downloadFile(blob, getExportFilename('pdf'));
}

/**
 * Export เป็น JSON:
 * - เก็บ session ทั้งหมด (project, comments, log, timer)
 * - เหมาะสำหรับการ Import กลับมาใช้งานต่อในอนาคต
 */
function exportJSON() {
  const json = {
    project: Object.fromEntries(Array.from(document.querySelectorAll('#projectForm input, #projectForm select')).map(el => [el.name || el.id, el.value])),
    comments: Array.from(tableBody.querySelectorAll('tr')).map(row => ({
      timestamp: row.children[0].textContent,
      comment: row.children[1].textContent
    })),
    log: {
      start: logStartEl.textContent,
      total: logTotalComment.textContent
    },
    timer: {
      fps: fps,
      frameCount: frameCount
    }
  };
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  downloadFile(blob, getExportFilename('json'));
}

function downloadFile(content, filename, mime = null) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import JSON:
 * - อ่านไฟล์ .json ที่ผู้ใช้เลือก
 * - เติมค่ากลับเข้าสู่ฟอร์ม, คอมเมนต์, log และตัวจับเวลา
 */
importButton.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = evt => {
      const data = JSON.parse(evt.target.result);
      if (!data || !data.project || !data.comments) return;

      // Restore settings
      Object.entries(data.project).forEach(([key, value]) => {
        const el = document.querySelector(`[name="${key}"]`) || document.getElementById(key);
        if (el) el.value = value;
      });

      // Restore comments
      tableBody.innerHTML = '';
      data.comments.forEach(item => {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        const commentCell = document.createElement('td');
        timeCell.textContent = item.timestamp;
        commentCell.textContent = item.comment;
        commentCell.contentEditable = true;
        row.appendChild(timeCell);
        row.appendChild(commentCell);
        tableBody.appendChild(row);
      });

      // Restore log
      logStartEl.textContent = data.log.start;
      logTotalComment.textContent = data.log.total;

      // Restore timer
      frameCount = data.timer.frameCount || 0;
      fps = data.timer.fps || 25;
      fpsSelect.value = fps;
      updateTimerDisplay();
    };
    reader.readAsText(file);
  };
  input.click();
});

function showConfirmModal(message, onConfirm, options = null) {
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.background = 'rgba(0, 0, 0, 0.6)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999';

  const box = document.createElement('div');
  box.style.background = '#fff';
  box.style.padding = '20px 30px';
  box.style.borderRadius = '12px';
  box.style.textAlign = 'center';
  box.style.fontFamily = 'Montserrat';
  box.style.minWidth = '260px';

  const msg = document.createElement('p');
  msg.textContent = message;
  msg.style.marginBottom = '20px';
  msg.style.color = '#333';

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.flexDirection = 'column';
  btnContainer.style.gap = '8px';

  if (options) {
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.style.background = '#6a47ff';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.padding = '8px 12px';
      btn.style.borderRadius = '8px';
      btn.style.cursor = 'pointer';
      btn.onclick = () => {
        opt.action();
        document.body.removeChild(modal);
      };
      btnContainer.appendChild(btn);
    });
  } else {
    const yesBtn = document.createElement('button');
    yesBtn.textContent = 'ยืนยัน';
    yesBtn.style.background = '#6a47ff';
    yesBtn.style.color = '#fff';
    yesBtn.style.border = 'none';
    yesBtn.style.padding = '8px 20px';
    yesBtn.style.borderRadius = '8px';
    yesBtn.style.cursor = 'pointer';

    const noBtn = document.createElement('button');
    noBtn.textContent = 'ยกเลิก';
    noBtn.style.background = '#ccc';
    noBtn.style.border = 'none';
    noBtn.style.padding = '8px 20px';
    noBtn.style.borderRadius = '8px';
    noBtn.style.cursor = 'pointer';

    yesBtn.onclick = () => {
      onConfirm();
      document.body.removeChild(modal);
    };
    noBtn.onclick = () => {
      document.body.removeChild(modal);
    };

    btnContainer.appendChild(yesBtn);
    btnContainer.appendChild(noBtn);
  }

  box.appendChild(msg);
  box.appendChild(btnContainer);
  modal.appendChild(box);
  document.body.appendChild(modal);
}
