// Timer State
let isRunning = false;
let frameCount = 0;
let startTime = null;
let fps = 25;
let animationFrameId = null;
let totalComments = 0;

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
  toggleButton.textContent = 'Pause';
  isRunning = true;
  logStartEl.textContent = new Date().toLocaleTimeString();
}

function stopTimer() {
  cancelAnimationFrame(animationFrameId);
  toggleButton.textContent = 'Start';
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

  // Limit to 5 rows with scroll
  const tableSection = document.getElementById('table-section');
  tableSection.style.maxHeight = '150px';
  tableSection.style.overflowY = 'auto';

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
