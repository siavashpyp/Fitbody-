// ===== Fit Body App =====
// Data Storage
const STORAGE_KEY = 'fitbody_workouts';

function getWorkouts() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveWorkouts(workouts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

// ===== Navigation =====
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');
    
    const btn = document.querySelector(`[data-section="${sectionId}"]`);
    if (btn) btn.classList.add('active');
    
    // Close mobile menu
    document.querySelector('.nav').classList.remove('open');
    
    // Update charts when progress is shown
    if (sectionId === 'progress') {
        updateCharts();
        updateProgressStats();
    }
    
    if (sectionId === 'dashboard') {
        updateDashboard();
    }
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showSection(btn.dataset.section);
    });
});

document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.querySelector('.nav').classList.toggle('open');
});

// ===== Workout Form =====
document.getElementById('workoutDate').valueAsDate = new Date();

document.getElementById('workoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const workout = {
        id: Date.now(),
        date: document.getElementById('workoutDate').value,
        muscle: document.getElementById('muscleGroup').value,
        exercise: document.getElementById('exerciseName').value.trim(),
        sets: parseInt(document.getElementById('sets').value),
        reps: parseInt(document.getElementById('reps').value),
        weight: parseFloat(document.getElementById('weight').value),
        notes: document.getElementById('notes').value.trim(),
        volume: parseInt(document.getElementById('sets').value) * 
                parseInt(document.getElementById('reps').value) * 
                parseFloat(document.getElementById('weight').value)
    };
    
    const workouts = getWorkouts();
    workouts.unshift(workout);
    saveWorkouts(workouts);
    
    // Reset form
    document.getElementById('exerciseName').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('sets').value = 3;
    document.getElementById('reps').value = 10;
    document.getElementById('weight').value = 20;
    
    renderWorkoutsList();
    updateDashboard();
    
    // Feedback
    alert('✅ تمرین با موفقیت ذخیره شد!');
});

// ===== Render Workouts =====
function renderWorkoutsList() {
    const list = document.getElementById('workoutsList');
    const workouts = getWorkouts();
    
    if (workouts.length === 0) {
        list.innerHTML = '<p class="empty-msg">هنوز تمرینی ثبت نشده.</p>';
        return;
    }
    
    list.innerHTML = workouts.map(w => `
        <div class="workout-item">
            <div class="workout-info">
                <h4>${w.exercise}</h4>
                <div class="workout-meta">
                    <span class="muscle-badge">${w.muscle}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(w.date)}</span>
                    <span><i class="fas fa-redo"></i> ${w.sets} ست × ${w.reps}</span>
                    <span><i class="fas fa-weight-hanging"></i> ${w.weight} کیلو</span>
                    <span><i class="fas fa-bolt"></i> حجم: ${w.volume.toLocaleString()} kg</span>
                </div>
                ${w.notes ? `<p style="font-size:0.8rem;color:#64748b;margin-top:0.4rem">${w.notes}</p>` : ''}
            </div>
            <div class="workout-actions">
                <button onclick="deleteWorkout(${w.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function deleteWorkout(id) {
    if (!confirm('این تمرین حذف بشه؟')) return;
    let workouts = getWorkouts();
    workouts = workouts.filter(w => w.id !== id);
    saveWorkouts(workouts);
    renderWorkoutsList();
    updateDashboard();
}

document.getElementById('clearAllBtn')?.addEventListener('click', () => {
    if (!confirm('همه تمرینات پاک بشن؟ این عمل برگشت‌ناپذیره!')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderWorkoutsList();
    updateDashboard();
});

// ===== Dashboard =====
function updateDashboard() {
    const workouts = getWorkouts();
    
    // Total workouts
    document.getElementById('totalWorkouts').textContent = workouts.length;
    
    // This week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = workouts.filter(w => new Date(w.date) >= oneWeekAgo).length;
    document.getElementById('thisWeek').textContent = thisWeek;
    
    // Total volume
    const totalVol = workouts.reduce((sum, w) => sum + (w.volume || 0), 0);
    document.getElementById('totalVolume').textContent = totalVol.toLocaleString();
    
    // Streak (simple consecutive days)
    document.getElementById('streak').textContent = calculateStreak(workouts);
    
    // Recent workouts
    const recent = document.getElementById('recentWorkouts');
    if (workouts.length === 0) {
        recent.innerHTML = '<p class="empty-msg">هنوز تمرینی ثبت نکردی. برو به بخش تمرینات!</p>';
    } else {
        recent.innerHTML = workouts.slice(0, 5).map(w => `
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
    
    // Daily tip
    updateDailyTip();
}

function calculateStreak(workouts) {
    if (workouts.length === 0) return 0;
    
    const dates = [...new Set(workouts.map(w => w.date))].sort().reverse();
    let streak = 0;
    let current = new Date();
    current.setHours(0,0,0,0);
    
    for (let d of dates) {
        const workoutDate = new Date(d);
        workoutDate.setHours(0,0,0,0);
        const diff = Math.floor((current - workoutDate) / (1000 * 60 * 60 * 24));
        
        if (diff === streak) {
            streak++;
            current.setDate(current.getDate() - 1);
        } else if (diff > streak) {
            break;
        }
    }
    return streak;
}

function updateDailyTip() {
    const tips = [
        "امروز روی فرم حرکات تمرکز کن. کیفیت مهم‌تر از کمیته!",
        "یادت نره قبل از تمرین گرم کنی و بعد ازش سرد کنی.",
        "خواب کافی = ریکاوری بهتر. حداقل ۷ ساعت بخواب.",
        "پروتئین بعد از تمرین رو فراموش نکن (۳۰-۴۰ گرم).",
        "اگه امروز انرژی نداری، یه تمرین سبک‌تر انجام بده ولی متوقف نشو!",
        "پیشرفت تدریجیه. هر هفته فقط کمی سنگین‌تر کن (Progressive Overload).",
        "تنفس درست: موقع فشار بازدم، موقع پایین اومدن دم.",
        "امروز فول‌بادی کار کن تا همه عضله‌ها درگیر بشن!"
    ];
    const tip = tips[new Date().getDate() % tips.length];
    document.getElementById('dailyTip').innerHTML = `<p>${tip}</p>`;
}

// ===== Charts =====
let volumeChart = null;
let muscleChart = null;

function updateCharts() {
    const workouts = getWorkouts();
    
    // Volume over time
    const byDate = {};
    workouts.forEach(w => {
        if (!byDate[w.date]) byDate[w.date] = 0;
        byDate[w.date] += w.volume || 0;
    });
    
    const sortedDates = Object.keys(byDate).sort();
    const volumes = sortedDates.map(d => byDate[d]);
    
    const ctx1 = document.getElementById('volumeChart').getContext('2d');
    if (volumeChart) volumeChart.destroy();
    
    volumeChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: sortedDates.map(formatDate),
            datasets: [{
                label: 'حجم تمرین (کیلو)',
                data: volumes,
                borderColor: '#00e676',
                backgroundColor: 'rgba(0, 230, 118, 0.1)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#00e676',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#a0aec0', font: { family: 'Vazirmatn' } } }
            },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
                y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }
            }
        }
    });
    
    // Muscle distribution
    const byMuscle = {};
    workouts.forEach(w => {
        if (!byMuscle[w.muscle]) byMuscle[w.muscle] = 0;
        byMuscle[w.muscle] += w.volume || 0;
    });
    
    const muscles = Object.keys(byMuscle);
    const muscleVolumes = Object.values(byMuscle);
    
    const colors = ['#00e676', '#00b0ff', '#ffb300', '#ff5252', '#e040fb', '#7c4dff', '#18ffff', '#ff6e40'];
    
    const ctx2 = document.getElementById('muscleChart').getContext('2d');
    if (muscleChart) muscleChart.destroy();
    
    muscleChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: muscles,
            datasets: [{
                data: muscleVolumes,
                backgroundColor: colors.slice(0, muscles.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { color: '#a0aec0', font: { family: 'Vazirmatn' }, padding: 15 }
                }
            }
        }
    });
}

function updateProgressStats() {
    const workouts = getWorkouts();
    const container = document.getElementById('progressStats');
    
    if (workouts.length === 0) {
        container.innerHTML = '<p class="empty-msg">برای دیدن آمار، حداقل چند تمرین ثبت کن.</p>';
        return;
    }
    
    const totalVolume = workouts.reduce((s, w) => s + (w.volume || 0), 0);
    const avgVolume = Math.round(totalVolume / workouts.length);
    const maxWeight = Math.max(...workouts.map(w => w.weight || 0));
    const uniqueExercises = new Set(workouts.map(w => w.exercise)).size;
    const uniqueMuscles = new Set(workouts.map(w => w.muscle)).size;
    
    container.innerHTML = `
        <div class="progress-stat-item">
            <div class="value">${totalVolume.toLocaleString()}</div>
            <div class="label">حجم کل (کیلو)</div>
        </div>
        <div class="progress-stat-item">
            <div class="value">${avgVolume.toLocaleString()}</div>
            <div class="label">میانگین حجم هر جلسه</div>
        </div>
        <div class="progress-stat-item">
            <div class="value">${maxWeight}</div>
            <div class="label">سنگین‌ترین وزنه (کیلو)</div>
        </div>
        <div class="progress-stat-item">
            <div class="value">${uniqueExercises}</div>
            <div class="label">حرکت‌های مختلف</div>
        </div>
        <div class="progress-stat-item">
            <div class="value">${uniqueMuscles}</div>
            <div class="label">گروه عضلانی پوشش‌داده‌شده</div>
        </div>
        <div class="progress-stat-item">
            <div class="value">${workouts.length}</div>
            <div class="label">کل جلسات تمرینی</div>
        </div>
    `;
}

// ===== AI Coach Chat =====
const coachResponses = {
    // Programs
    'فول بادی': `💪 <strong>برنامه فول‌بادی پیشنهادی (۳ روز در هفته):</strong><br><br>
    <b>روز ۱:</b><br>
    • اسکوات هالتر ۳×۸-۱۰<br>
    • پرس سینه دمبل ۳×۱۰<br>
    • زیربغل هالتر ۳×۱۰<br>
    • پرس سرشانه دمبل ۳×۱۲<br>
    • پلانک ۳×۴۵ ثانیه<br><br>
    <b>روز ۲:</b><br>
    • ددلیفت ۳×۶-۸<br>
    • پرس بالاسینه ۳×۱۰<br>
    • بارفیکس یا لت‌پول‌داون ۳×۱۰<br>
    • اسکوات بلغاری ۳×۱۰ هر پا<br>
    • کرانچ ۳×۱۵<br><br>
    <b>روز ۳:</b><br>
    • لانگ هالتر ۳×۱۰<br>
    • پرس نظامی ۳×۱۰<br>
    • روئینگ دمبل ۳×۱۲<br>
    • پشت پا دستگاه ۳×۱۲<br>
    • فیله کمر ۳×۱۵<br><br>
    بین ست‌ها ۹۰ ثانیه استراحت کن. Progressive Overload رو فراموش نکن!`,

    'سینه': `🔥 <strong>برنامه سینه حرفه‌ای:</strong><br><br>
    ۱. پرس سینه هالتر ۴×۶-۸<br>
    ۲. پرس بالاسینه دمبل ۳×۱۰<br>
    ۳. فلای سیم‌کش ۳×۱۲-۱۵<br>
    ۴. پرس زیرسینه ۳×۱۰<br>
    ۵. دیپ (با وزنه اگر ممکنه) ۳×۸-۱۲<br><br>
    نکته: آرنج‌ها رو خیلی باز نکن، زاویه حدود ۴۵ درجه نگه دار.`,

    'پشت': `🏋️ <strong>برنامه پشت کامل:</strong><br><br>
    ۱. ددلیفت ۳×۵-۶<br>
    ۲. بارفیکس یا لت‌پول‌داون ۴×۸-۱۰<br>
    ۳. روئینگ هالتر ۳×۸-۱۰<br>
    ۴. زیربغل تک‌دمبل ۳×۱۰ هر طرف<br>
    ۵. فیله کمر ۳×۱۲-۱۵<br><br>
    تمرکز روی جمع کردن کتف‌ها در هر تکرار!`,

    'پا': `🦵 <strong>برنامه پا و باسن:</strong><br><br>
    ۱. اسکوات هالتر ۴×۶-۸<br>
    ۲. لانگ راه رفتنی ۳×۱۰ هر پا<br>
    ۳. پشت پا خوابیده ۳×۱۲<br>
    ۴. جلو پا دستگاه ۳×۱۲-۱۵<br>
    ۵. ساق پا ایستاده ۴×۱۵-۲۰<br>
    ۶. هیپ تراست ۳×۱۲<br><br>
    پاها پایه قدرت بدن هستن. سنگین کار کن ولی فرم رو حفظ کن!`,

    'شانه': `🏔️ <strong>برنامه شانه:</strong><br><br>
    ۱. پرس نظامی (ایستاده یا نشسته) ۴×۸<br>
    ۲. نشر جانب دمبل ۳×۱۲-۱۵<br>
    ۳. نشر جلو ۳×۱۲<br>
    ۴. نشر خم (پشت شانه) ۳×۱۲-۱۵<br>
    ۵. شراگ هالتر ۳×۱۲<br><br>
    شانه آسیب‌پذیره، وزنه سنگین الکی نزن.`,

    'بازو': `💪 <strong>برنامه جلوبازو و پشت‌بازو:</strong><br><br>
    <b>جلوبازو:</b><br>
    • جلوبازو هالتر ۳×۱۰<br>
    • جلوبازو دمبل چکشی ۳×۱۲<br>
    • جلوبازو سیم‌کش ۳×۱۲<br><br>
    <b>پشت‌بازو:</b><br>
    • پشت‌بازو سیم‌کش ۳×۱۲<br>
    • اسکال‌کراشر ۳×۱۰<br>
    • دیپ نیمکت ۳×۱۲<br><br>
    بازو رو آخر تمرین کار کن تا خسته نباشی.`,

    'شکم': `🔥 <strong>تمرین شکم (۳-۴ بار در هفته):</strong><br><br>
    • کرانچ ۳×۱۵-۲۰<br>
    • لگ‌ریز ۳×۱۲-۱۵<br>
    • پلانک ۳×۴۵-۶۰ ثانیه<br>
    • بایسکل کرانچ ۳×۲۰<br>
    • وودچاپ سیم‌کش ۳×۱۲ هر طرف<br><br>
    شکم توی آشپزخونه ساخته می‌شه! تغذیه مهم‌تره.`,

    // Tips
    'فرم': `📝 <strong>نکات مهم فرم حرکت:</strong><br><br>
    • همیشه کنترل کامل روی وزنه داشته باش (نه فقط بالا بردن)<br>
    • کمر رو قوس نده و ستون فقرات خنثی نگه دار<br>
    • نفس‌گیری: موقع فشار بازدم، موقع پایین اومدن دم<br>
    • دامنه کامل حرکت رو رعایت کن<br>
    • اگه فرم خراب شد، وزنه رو کم کن<br><br>
    کدوم حرکت رو می‌خوای دقیق‌تر بدونم؟`,

    'انگیزه': `🚀 <strong>پیام انگیزشی از مربی:</strong><br><br>
    قهرمان! هر کسی که الان بدنشو دوست داره، یه روزی از صفر شروع کرده.<br><br>
    تو داری کاری می‌کنی که ۹۰٪ مردم فقط در موردش حرف می‌زنن.<br>
    امروز سخت‌ترین روز نیست، ولی اگه امروز تسلیم شی، فردا سخت‌تر می‌شه.<br><br>
    فقط همین یک ست دیگه. فقط همین یک جلسه دیگه.<br>
    من بهت اعتقاد دارم. حالا برو بترکون! 💪🔥`,

    'پیشرفت': `📈 برای پیشرفت مداوم این اصول رو رعایت کن:<br><br>
    ۱. <b>Progressive Overload</b>: هر هفته کمی وزنه یا تکرار اضافه کن<br>
    ۲. ریکاوری: خواب ۷-۹ ساعت + تغذیه مناسب<br>
    ۳. ثبات: بهتره ۳ جلسه سبک منظم داشته باشی تا ۱ جلسه خیلی سنگین نامنظم<br>
    ۴. ثبت کن: همه چیز رو تو Fit Body بنویس تا ببینی چی کار می‌کنه<br>
    ۵. صبور باش: تغییرات واقعی ۸-۱۲ هفته طول می‌کشه`,

    'تغذیه': `🍗 <strong>نکات تغذیه برای عضله‌سازی:</strong><br><br>
    • کالری کمی بیشتر از مصرف روزانه (surplus ۲۰۰-۳۰۰)<br>
    • پروتئین: ۱.۶ تا ۲.۲ گرم به ازای هر کیلو وزن بدن<br>
    • کربوهیدرات حول تمرین برای انرژی<br>
    • چربی سالم (آووکادو، مغزها، روغن زیتون)<br>
    • آب کافی: حداقل ۳-۴ لیتر در روز<br><br>
    بعد از تمرین تا ۱ ساعت پنجره طلایی داری!`,

    'ریکاوری': `😴 <strong>ریکاوری حرفه‌ای:</strong><br><br>
    • خواب باکیفیت اولویت شماره ۱<br>
    • روزهای استراحت فعال (پیاده‌روی، کشش)<br>
    • ماساژ یا فوم رولر<br>
    • مدیریت استرس<br>
    • اگه درد مفصلی داری، استراحت کن نه اینکه تحمل کنی<br><br>
    عضله توی باشگاه خراب می‌شه، توی ریکاوری ساخته می‌شه!`
};

function getCoachResponse(userMsg) {
    const msg = userMsg.toLowerCase().trim();
    
    // Keyword matching
    if (msg.includes('فول') || msg.includes('کل بدن') || msg.includes('همه عضله')) {
        return coachResponses['فول بادی'];
    }
    if (msg.includes('سینه') || msg.includes('سینه')) {
        return coachResponses['سینه'];
    }
    if (msg.includes('پشت') || msg.includes('زیربغل') || msg.includes('لت')) {
        return coachResponses['پشت'];
    }
    if (msg.includes('پا') || msg.includes('اسکوات') || msg.includes('ران')) {
        return coachResponses['پا'];
    }
    if (msg.includes('شانه') || msg.includes('سرشانه')) {
        return coachResponses['شانه'];
    }
    if (msg.includes('بازو') || msg.includes('جلوبازو') || msg.includes('پشت بازو') || msg.includes('پشت‌بازو')) {
        return coachResponses['بازو'];
    }
    if (msg.includes('شکم') || msg.includes('کرانچ') || msg.includes('پلانک')) {
        return coachResponses['شکم'];
    }
    if (msg.includes('فرم') || msg.includes('تکنیک') || msg.includes('نکته')) {
        return coachResponses['فرم'];
    }
    if (msg.includes('انگیزه') || msg.includes('خسته') || msg.includes('نمی‌تونم') || msg.includes('سخت')) {
        return coachResponses['انگیزه'];
    }
    if (msg.includes('پیشرفت') || msg.includes('چطور پیشرفت') || msg.includes('بهتر بشم')) {
        return coachResponses['پیشرفت'];
    }
    if (msg.includes('تغذیه') || msg.includes('غذا') || msg.includes('پروتئین') || msg.includes('رژیم')) {
        return coachResponses['تغذیه'];
    }
    if (msg.includes('ریکاوری') || msg.includes('استراحت') || msg.includes('خواب') || msg.includes('درد')) {
        return coachResponses['ریکاوری'];
    }
    if (msg.includes('سلام') || msg.includes('درود') || msg.includes('هی')) {
        return `سلام قهرمان! 💪 خوش اومدی. بگو امروز می‌خوای روی چی کار کنیم؟ می‌تونی بگی:<br>• برنامه فول بادی<br>• برنامه سینه / پا / پشت<br>• نکته فرم<br>• انگیزه<br>یا هر سوال دیگه‌ای!`;
    }
    if (msg.includes('ممنون') || msg.includes('مرسی') || msg.includes('دمت گرم')) {
        return `خواهش می‌کنم قهرمان! 🔥 هر وقت نیاز داشتی من اینجام. حالا برو تمرین کن و پیشرفتت رو ثبت کن!`;
    }
    
    // Default intelligent-ish response
    const defaults = [
        `سوال خوبیه! بذار کمکت کنم.<br><br>می‌تونی دقیق‌تر بگی دنبال چی هستی؟ مثلاً:<br>• برنامه تمرینی برای یه عضله خاص<br>• نکته فرم حرکت<br>• راهنمایی تغذیه یا ریکاوری<br>• یا فقط یه انگیزه قوی! 💪`,
        `متوجه شدم. برای اینکه بهتر راهنمایی‌ت کنم، بگو:<br>امروز کدوم عضله رو می‌خوای کار کنی؟ یا چه هدفی داری (چربی‌سوزی، عضله‌سازی، قدرت)؟`,
        `عالی که داری پیگیری می‌کنی! 👏<br>اگه می‌خوای برنامه کامل بدم، بگو سطح تجربه‌ت چقدره (مبتدی، متوسط، پیشرفته) و چند روز در هفته وقت داری.`
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
}

function addChatMessage(text, isUser = false) {
    const window = document.getElementById('chatWindow');
    const div = document.createElement('div');
    div.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    div.innerHTML = `
        <div class="avatar"><i class="fas fa-${isUser ? 'user' : 'robot'}"></i></div>
        <div class="message-content">${isUser ? `<p>${text}</p>` : text}</div>
    `;
    window.appendChild(div);
    window.scrollTop = window.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    
    addChatMessage(msg, true);
    input.value = '';
    
    // Simulate thinking
    setTimeout(() => {
        const response = getCoachResponse(msg);
        addChatMessage(response, false);
    }, 600 + Math.random() * 400);
}

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('chatInput').value = btn.dataset.msg;
        sendMessage();
    });
});

// ===== Helpers =====
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fa-IR');
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    renderWorkoutsList();
    updateDashboard();
});
