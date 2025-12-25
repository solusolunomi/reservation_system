document.addEventListener("DOMContentLoaded", () => {
  initDateHeader();
  initSchedule();
});

/* =========================
   Header Date
========================= */
function initDateHeader() {
  const trigger = document.getElementById("dateTrigger");
  const picker = document.getElementById("datePicker");

  const yearEl = document.getElementById("yearText");
  const mdEl = document.getElementById("mdText");
  const weekEl = document.getElementById("weekText");

  const prevBtn = document.querySelector(".date-btn.prev");
  const nextBtn = document.querySelector(".date-btn.next");

  if (!trigger || !picker || !yearEl || !mdEl || !weekEl || !prevBtn || !nextBtn) return;

  const week = ["日", "月", "火", "水", "木", "金", "土"];
  let currentDate = new Date();

  function render(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");

    yearEl.textContent = `${y}`;
    mdEl.textContent = `${m}/${d}`;
    weekEl.textContent = `曜日：(${week[dateObj.getDay()]})`;
    picker.value = `${y}-${m}-${d}`;
  }

  render(currentDate);

  trigger.addEventListener("click", () => {
    if (picker.showPicker) picker.showPicker();
    else picker.click();
  });

  picker.addEventListener("change", () => {
    if (!picker.value) return;
    currentDate = new Date(picker.value);
    render(currentDate);
  });

  prevBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 1);
    render(currentDate);
  });

  nextBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 1);
    render(currentDate);
  });
}

/* =========================
   Schedule (Drag)
========================= */
function initSchedule() {
  const header = document.getElementById("timelineHeader");
  const dragInfo = document.getElementById("dragInfo");
  const lanes = document.querySelectorAll(".lane");

  // 画面にスケジュール要素がないページでは何もしない
  if (!header || !dragInfo || lanes.length === 0) return;

  // ★時間はCSS変数から読む（これでズレない）
  const rootStyle = getComputedStyle(document.documentElement);
  const START_HOUR = Number(rootStyle.getPropertyValue("--start-hour").trim());
  const END_HOUR = Number(rootStyle.getPropertyValue("--end-hour").trim());

  const SNAP_MINUTES = 5;

  renderTimeHeader(header, START_HOUR, END_HOUR);

  let dragging = null; // { lane, room, startMinutes, blockEl }

  lanes.forEach((lane) => {
    lane.addEventListener("pointerdown", (e) => {
      lane.setPointerCapture(e.pointerId);

      const rect = lane.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left, 0, rect.width);

      const start = snapXToMinutes(x, rect.width, START_HOUR, END_HOUR, SNAP_MINUTES);

      const block = document.createElement("div");
      block.className = "block";
      lane.appendChild(block);

      dragging = { lane, room: lane.dataset.room, startMinutes: start, blockEl: block };
      updateBlock(dragging, start, START_HOUR, END_HOUR);
      updateDragInfo(dragInfo, dragging, start, START_HOUR);
    });

    lane.addEventListener("pointermove", (e) => {
      if (!dragging || dragging.lane !== lane) return;

      const rect = lane.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left, 0, rect.width);
      const current = snapXToMinutes(x, rect.width, START_HOUR, END_HOUR, SNAP_MINUTES);

      updateBlock(dragging, current, START_HOUR, END_HOUR);
      updateDragInfo(dragInfo, dragging, current, START_HOUR);
    });

    lane.addEventListener("pointerup", (e) => {
      if (!dragging || dragging.lane !== lane) return;

      const rect = lane.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left, 0, rect.width);
      const end = snapXToMinutes(x, rect.width, START_HOUR, END_HOUR, SNAP_MINUTES);

      const { from, to } = normalizeRange(dragging.startMinutes, end);

      // 0分の予約は作らない
      if (to - from < SNAP_MINUTES) {
        dragging.blockEl.remove();
        dragging = null;
        clearDragInfo(dragInfo);
        return;
      }

      dragging.blockEl.classList.add("is-reserved");
      dragging.blockEl.dataset.from = from;
      dragging.blockEl.dataset.to = to;

      dragging = null;
      clearDragInfo(dragInfo);
    });

    lane.addEventListener("pointercancel", () => {
      if (!dragging || dragging.lane !== lane) return;
      dragging.blockEl.remove();
      dragging = null;
      clearDragInfo(dragInfo);
    });
  });
}

function renderTimeHeader(container, START_HOUR, END_HOUR) {
  container.innerHTML = "";
  const hours = END_HOUR - START_HOUR;

  for (let i = 0; i <= hours; i++) {
    const hour = START_HOUR + i;

    const el = document.createElement("div");
    el.className = "time-label";
    el.textContent = String(hour);

    el.style.left = `${(i / hours) * 100}%`;
    el.style.width = `${(1 / hours) * 100}%`;

    container.appendChild(el);
  }
}

function snapXToMinutes(x, width, START_HOUR, END_HOUR, SNAP_MINUTES) {
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const minutes = (x / width) * totalMinutes;
  const snapped = Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
  return clamp(snapped, 0, totalMinutes);
}

function minutesToPercent(min, START_HOUR, END_HOUR) {
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  return (min / totalMinutes) * 100;
}

function updateBlock(state, currentMinutes, START_HOUR, END_HOUR) {
  const { from, to } = normalizeRange(state.startMinutes, currentMinutes);
  state.blockEl.style.left = `${minutesToPercent(from, START_HOUR, END_HOUR)}%`;
  state.blockEl.style.width =
    `${minutesToPercent(to, START_HOUR, END_HOUR) - minutesToPercent(from, START_HOUR, END_HOUR)}%`;
}

function normalizeRange(a, b) {
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function minutesToTimeString(minutes, START_HOUR) {
  const totalMinutes = minutes + START_HOUR * 60;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour}時${String(minute).padStart(2, "0")}分`;
}

function updateDragInfo(dragInfoEl, state, currentMinutes, START_HOUR) {
  const { from, to } = normalizeRange(state.startMinutes, currentMinutes);
  const fromTime = minutesToTimeString(from, START_HOUR);
  const toTime = minutesToTimeString(to, START_HOUR);

  dragInfoEl.textContent = `${state.room}の${fromTime}から${toTime}までがドラッグされました。`;
  dragInfoEl.classList.add("active");
}

function clearDragInfo(dragInfoEl) {
  dragInfoEl.classList.remove("active");
  dragInfoEl.textContent = "";
}

/* ===== 選択クリア ===== */
const clearBtn = document.getElementById("clearSelectionBtn");

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    // 予約・仮予約ブロックを全削除
    document.querySelectorAll(".lane .block").forEach(block => {
      block.remove();
    });

    // ドラッグ中状態もリセット
    dragging = null;
    clearDragInfo();
  });
}
