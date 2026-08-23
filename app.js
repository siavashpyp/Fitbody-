const STORAGE_KEY = 'fitbody_workouts';

function getWorkouts() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}
function saveWorkouts(workouts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

const titles = {
  dashboard: 'داشبورد',
  workouts: 'تمرینات',
  progress: 'پیشرفت',
  coach: 'مربی AI'
};

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add('active');
  const btn = document.querySelector(`.side-btn[data-section="${id}"]`);
  if (btn) btn.classList.add('active');
  document.getElementById('pageTitle').textContent = titles[id] || id;
  document.getElementById('sidebar').classList.remove('open');
  if (id === 'progress') { updateCharts(); updateProgressStats(); }
  if (id === 'dashboard') updateDashboard();
}

document.querySelectorAll('.side-btn').forEach(btn => {
  btn.addEventListener('click', () => showSection(btn.dataset.section));
});

document.getElementById('mobileMenu')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

document.getElementById('workoutDate').valueAsDate = new Date();

document.getElementById('workoutForm').addEventListener('submit', e => {
  e.preventDefault();
  const workout = {
    id: Date.now(),
    date: document.getElementById('workoutDate').value,
    muscle: document.getElementById('muscleGroup').value,
    exercise: document.getElementById('exerciseName').value.trim(),
    sets: +document.getElementById('sets').value,
    reps: +document.getElementById('reps').value,
    weight: +document.getElementById('weight').value,
    notes: document.getElementById('notes').value.trim(),
    volume: (+document.getElementById('sets').value) * (+document.getElementById('reps').value) * (+document.getElementById('weight').value)
  };
  const list = getWorkouts();
  list.unshift(workout);
  saveWorkouts(list);
  document.getElementById('exerciseName').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('sets').value = 3;
  document.getElementById('reps').value = 10;
  document.getElementById('weight').value = 20;
  renderWorkoutsList();
  updateDashboard();
  alert('✅ تمرین ذخیره شد!');
});

function renderWorkoutsList() {
  const el = document.getElementById('workoutsList');
  const list = getWorkouts();
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>هنوز تمرینی ثبت نشده</p></div>`;
    return;
  }
  el.innerHTML = list.map(w => `
    <div class="workout-item">
      <div class="workout-info">
        <h4>${w.exercise}</h4>
        <div class="workout-meta">
          <span class="muscle-badge">${w.muscle}</span>
          <span><i class="fas fa-calendar"></i> ${formatDate(w.date)}</span>
          <span>${w.sets}×${w.reps}</span>
          <span>${w.weight} kg</span>
          <span>حجم: ${w.volume.toLocaleString()}</span>
        </div>
        ${w.notes ? `<p style="font-size:0.78rem;color:#64748b;margin-top:4px">${w.notes}</p>` : ''}
      </div>
      <div class="workout-actions">
        <button onclick="deleteWorkout(${w.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function deleteWorkout(id) {
  if (!confirm('حذف بشه؟')) return;
  saveWorkouts(getWorkouts().filter(w => w.id !== id));
  renderWorkoutsList();
  updateDashboard();
}

document.getElementById('clearAllBtn')?.addEventListener('click', () => {
  if (!confirm('همه پاک بشن؟')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderWorkoutsList();
  updateDashboard();
});

function updateDashboard() {
  const list = getWorkouts();
  document.getElementById('totalWorkouts').textContent = list.length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = list.filter(w => new Date(w.date) >= weekAgo).length;
  document.getElementById('thisWeek').textContent = thisWeek;

  const vol = list.reduce((s, w) => s + (w.volume || 0), 0);
  document.getElementById('totalVolume').textContent = vol.toLocaleString();
  document.getElementById('streak').textContent = calcStreak(list);

  // Ring (goal = 4 workouts/week)
  const pct = Math.min(100, Math.round((thisWeek / 4) * 100));
  document.getElementById('weekPercent').textContent = pct + '%';
  const ring = document.getElementById('weekRing');
  if (ring) {
    const offset = 327 - (327 * pct / 100);
    ring.style.strokeDashoffset = offset;
  }

  const recent = document.getElementById('recentWorkouts');
  if (!list.length) {
    recent.innerHTML = `<div class="empty-state"><i class="fas fa-dumbbell"></i><p>هنوز تمرینی ثبت نکردی</p><button class="btn btn-sm btn-primary" onclick="showSection('workouts')">شروع کن</button></div>`;
  } else {
    recent.innerHTML = list.slice(0, 5).map(w => `
      <div class="workout-item">
        <div class="workout-info">
          <h4>${w.exercise}</h4>
          <div class="workout-meta">
            <span class="muscle-badge">${w.muscle}</span>
            <span>${formatDate(w.date)}</span>
            <span>${w.sets}×${w.reps} @ ${w.weight}kg</span>
          </div>
        </div>
      </div>
    `).join('');
  }
  updateTip();
}

function calcStreak(list) {
  if (!list.length) return 0;
  const dates = [...new Set(list.map(w => w.date))].sort().reverse();
  let streak = 0;
  let cur = new Date(); cur.setHours(0,0,0,0);
  for (const d of dates) {
    const wd = new Date(d); wd.setHours(0,0,0,0);
    const diff = Math.floor((cur - wd) / 86400000);
    if (diff === streak) { streak++; cur.setDate(cur.getDate() - 1); }
    else if (diff > streak) break;
  }
  return streak;
}

function updateTip() {
  const tips = [
    'امروز روی فرم حرکات تمرکز کن. کیفیت مهم‌تر از کمیته!',
    'قبل از تمرین گرم کن و بعدش سرد کن.',
    'خواب کافی = ریکاوری بهتر. حداقل ۷ ساعت.',
    'پروتئین بعد از تمرین رو فراموش نکن.',
    'اگه انرژی نداری، تمرین سبک‌تر انجام بده ولی متوقف نشو!',
    'هر هفته کمی سنگین‌تر کن (Progressive Overload).',
    'تنفس درست: موقع فشار بازدم، موقع پایین دم.',
    'امروز فول‌بادی کار کن تا همه عضله‌ها درگیر بشن!'
  ];
  document.getElementById('dailyTip').innerHTML = `<p>${tips[new Date().getDate() % tips.length]}</p>`;
}

let volumeChart, muscleChart;

function updateCharts() {
  const list = getWorkouts();
  const byDate = {};
  list.forEach(w => { byDate[w.date] = (byDate[w.date] || 0) + (w.volume || 0); });
  const dates = Object.keys(byDate).sort();
  const vols = dates.map(d => byDate[d]);

  const ctx1 = document.getElementById('volumeChart')?.getContext('2d');
  if (ctx1) {
    if (volumeChart) volumeChart.destroy();
    volumeChart = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: dates.map(formatDate),
        datasets: [{
          label: 'حجم (kg)',
          data: vols,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.1)',
          fill: true, tension: 0.35,
          pointBackgroundColor: '#22c55e', pointRadius: 5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Vazirmatn' } } } },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  const byMuscle = {};
  list.forEach(w => { byMuscle[w.muscle] = (byMuscle[w.muscle] || 0) + (w.volume || 0); });
  const muscles = Object.keys(byMuscle);
  const mVols = Object.values(byMuscle);
  const colors = ['#22c55e','#06b6d4','#a855f7','#f97316','#ec4899','#eab308','#3b82f6','#14b8a6'];

  const ctx2 = document.getElementById('muscleChart')?.getContext('2d');
  if (ctx2) {
    if (muscleChart) muscleChart.destroy();
    muscleChart = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: muscles,
        datasets: [{ data: mVols, backgroundColor: colors.slice(0, muscles.length), borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Vazirmatn' }, padding: 12 } } }
      }
    });
  }
}

function updateProgressStats() {
  const list = getWorkouts();
  const el = document.getElementById('progressStats');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><p>برای دیدن آمار چند تمرین ثبت کن</p></div>`;
    return;
  }
  const totalVol = list.reduce((s,w) => s + (w.volume||0), 0);
  const avg = Math.round(totalVol / list.length);
  const maxW = Math.max(...list.map(w => w.weight||0));
  const ex = new Set(list.map(w => w.exercise)).size;
  el.innerHTML = `
    <div class="mini-stat"><div class="val">${totalVol.toLocaleString()}</div><div class="lbl">حجم کل</div></div>
    <div class="mini-stat"><div class="val">${avg.toLocaleString()}</div><div class="lbl">میانگین جلسه</div></div>
    <div class="mini-stat"><div class="val">${maxW}</div><div class="lbl">سنگین‌ترین</div></div>
    <div class="mini-stat"><div class="val">${ex}</div><div class="lbl">حرکت‌ها</div></div>
  `;
}

/* ===== AI Coach ===== */
const responses = {
  'فول': `💪 <strong>برنامه فول‌بادی (۳ روز):</strong><br><br>
<b>روز ۱:</b> اسکوات ۳×۸ · پرس سینه ۳×۱۰ · زیربغل ۳×۱۰ · پرس شانه ۳×۱۲ · پلانک ۳×۴۵ث<br><br>
<b>روز ۲:</b> ددلیفت ۳×۶ · پرس بالاسینه ۳×۱۰ · بارفیکس ۳×۱۰ · لانگ ۳×۱۰ · کرانچ ۳×۱۵<br><br>
<b>روز ۳:</b> اسکوات بلغاری ۳×۱۰ · پرس نظامی ۳×۱۰ · روئینگ ۳×۱۲ · پشت پا ۳×۱۲ · فیله کمر ۳×۱۵<br><br>
بین ست‌ها ۹۰ ثانیه استراحت. Progressive Overload فراموش نشه!`,
  'سینه': `🔥 <strong>برنامه سینه:</strong><br>۱. پرس سینه هالتر ۴×۶-۸<br>۲. پرس بالاسینه دمبل ۳×۱۰<br>۳. فلای سیم‌کش ۳×۱۲-۱۵<br>۴. پرس زیرسینه ۳×۱۰<br>۵. دیپ ۳×۸-۱۲<br><br>آرنج‌ها حدود ۴۵ درجه.`,
  'پشت': `🏋️ <strong>برنامه پشت:</strong><br>۱. ددلیفت ۳×۵-۶<br>۲. بارفیکس/لت ۴×۸-۱۰<br>۳. روئینگ هالتر ۳×۸-۱۰<br>۴. زیربغل تک‌دمبل ۳×۱۰<br>۵. فیله کمر ۳×۱۲-۱۵`,
  'پا': `🦵 <strong>برنامه پا:</strong><br>۱. اسکوات ۴×۶-۸<br>۲. لانگ ۳×۱۰<br>۳. پشت پا ۳×۱۲<br>۴. جلو پا ۳×۱۲-۱۵<br>۵. ساق پا ۴×۱۵-۲۰<br>۶. هیپ تراست ۳×۱۲`,
  'شانه': `🏔️ <strong>برنامه شانه:</strong><br>۱. پرس نظامی ۴×۸<br>۲. نشر جانب ۳×۱۲-۱۵<br>۳. نشر جلو ۳×۱۲<br>۴. نشر خم ۳×۱۲-۱۵<br>۵. شراگ ۳×۱۲`,
  'بازو': `💪 <strong>بازو:</strong><br>جلوبازو هالتر ۳×۱۰ · چکشی ۳×۱۲ · سیم‌کش ۳×۱۲<br>پشت‌بازو سیم‌کش ۳×۱۲ · اسکال‌کراشر ۳×۱۰ · دیپ نیمکت ۳×۱۲`,
  'شکم': `🔥 <strong>شکم:</strong><br>کرانچ ۳×۱۵-۲۰ · لگ‌ریز ۳×۱۲-۱۵ · پلانک ۳×۴۵-۶۰ث · بایسکل ۳×۲۰ · وودچاپ ۳×۱۲`,
  'فرم': `📝 <strong>نکات فرم:</strong><br>• کنترل کامل روی وزنه<br>• ستون فقرات خنثی<br>• بازدم موقع فشار<br>• دامنه کامل<br>• اگه فرم خراب شد وزنه کم کن`,
  'انگیزه': `🚀 قهرمان! هر کسی که الان بدنشو دوست داره از صفر شروع کرده.<br>تو داری کاری می‌کنی که ۹۰٪ مردم فقط حرفش رو می‌زنن.<br>فقط همین یک ست دیگه. من بهت اعتقاد دارم. برو بترکون! 💪🔥`,
  'تغذیه': `🍗 پروتئین ۱.۶–۲.۲ گرم به ازای هر کیلو وزن · کالری کمی بیشتر از مصرف · کربوهیدرات حول تمرین · آب ۳–۴ لیتر`,
  'ریکاوری': `😴 خواب ۷–۹ ساعت اولویت شماره ۱ · استراحت فعال · فوم رولر · عضله توی باشگاه خراب می‌شه، توی ریکاوری ساخته می‌شه!`
};

function getResponse(msg) {
  const m = msg.toLowerCase();
  if (m.includes('فول') || m.includes('کل بدن')) return responses['فول'];
  if (m.includes('سینه')) return responses['سینه'];
  if (m.includes('پشت') || m.includes('زیربغل')) return responses['پشت'];
  if (m.includes('پا') || m.includes('اسکوات')) return responses['پا'];
  if (m.includes('شانه')) return responses['شانه'];
  if (m.includes('بازو')) return responses['بازو'];
  if (m.includes('شکم')) return responses['شکم'];
  if (m.includes('فرم') || m.includes('تکنیک')) return responses['فرم'];
  if (m.includes('انگیزه') || m.includes('خسته')) return responses['انگیزه'];
  if (m.includes('تغذیه') || m.includes('غذا') || m.includes('پروتئین')) return responses['تغذیه'];
  if (m.includes('ریکاوری') || m.includes('خواب')) return responses['ریکاوری'];
  if (m.includes('سلام') || m.includes('درود')) return `سلام قهرمان! 💪 بگو امروز کدوم عضله یا برنامه می‌خوای؟`;
  return `سوال خوبیه! دقیق‌تر بگو دنبال چی هستی:<br>• برنامه فول بادی / سینه / پا<br>• نکته فرم<br>• انگیزه یا تغذیه`;
}

function addMsg(text, isUser = false) {
  const win = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.className = `msg ${isUser ? 'user' : 'bot'}`;
  div.innerHTML = `<div class="bubble">${isUser ? `<p>${text}</p>` : text}</div>`;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  addMsg(msg, true);
  input.value = '';
  setTimeout(() => addMsg(getResponse(msg)), 500 + Math.random() * 400);
}

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
document.querySelectorAll('.chip').forEach(c => {
  c.addEventListener('click', () => {
    document.getElementById('chatInput').value = c.dataset.msg;
    sendMessage();
  });
});

function formatDate(d) {
  return new Date(d).toLocaleDateString('fa-IR');
}

document.addEventListener('DOMContentLoaded', () => {
  renderWorkoutsList();
  updateDashboard();
});
