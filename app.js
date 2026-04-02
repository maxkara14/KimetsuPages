// Отрисовка расширений
function renderExtensions() {
    const container = document.getElementById('extensions-container');
    container.innerHTML = ''; 
    
    siteData.extensions.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="post-header">
                <div class="avatar utility">E</div>
                <div class="post-meta">
                    <span class="post-author">${item.title}</span>
                    <span class="post-time">SillyTavern Extension</span>
                </div>
            </div>
            <div class="post-body">
                <p>${item.description}</p>
                <a href="${item.url}" target="_blank" class="btn download-btn">🔗 ${item.btnText}</a>
            </div>
        `;
        container.appendChild(card);
    });
}

// Отрисовка ботов
function renderBots() {
    const container = document.getElementById('bots-container');
    container.innerHTML = '';
    
    siteData.bots.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="post-header">
                <div class="avatar bot">C</div>
                <div class="post-meta">
                    <span class="post-author">${item.title}</span>
                    <span class="post-time">Архив Персонажей • JSON</span>
                </div>
            </div>
            <div class="post-body">
                <p>${item.description}</p>
                <a href="${item.botFile}" download class="btn download-btn">💾 Скачать персонажа</a>
            </div>
        `;
        container.appendChild(card);
    });
}

// Отрисовка Галереи (v2.0 - Кликабельная)
function renderGallery() {
    const container = document.getElementById('gallery-container');
    if (!container) return;

    container.innerHTML = ''; 
    
    siteData.gallery.forEach(img => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.title = img.title;
        
        item.innerHTML = `
            <img src="${img.src}" alt="${img.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzZjJjMmMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iI2Q0YWYzNyIgZm9udC1zaXplPSIxOHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QXJ0IEhlcmU8L3RleHQ+PC9zdmc+'" loading="lazy">
        `;

        item.addEventListener('click', () => {
            openGalleryModal(img.src, img.title);
        });

        container.appendChild(item);
    });
}

// === ЛОГИКА МОДАЛЬНОГО ОКНА ===
function openGalleryModal(src, title) {
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-img');
    const captionText = document.getElementById('modal-caption');

    if (!modal || !modalImg || !captionText) return;

    modal.classList.add('active');
    modalImg.src = src;
    captionText.innerText = title;

    // Закрытие при клике на оверлей (но не на картинку)
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeGalleryModal();
        }
    };
}

function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.classList.remove('active');
}

// Инициализация кнопок закрытия модалки
function initModalEvents() {
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = closeGalleryModal;
    }

    // Закрытие на ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeGalleryModal();
    });
}

// 🔧 Движок для спойлеров (с гидравликой)
function setupToggles() {
    const sections = [
        { id: 'extensions-section', contentId: 'extensions-container', collapseDefault: false },
        { id: 'bots-section', contentId: 'bots-container', collapseDefault: false },
        { id: 'gallery-section', contentId: 'gallery-container', collapseDefault: true } 
    ];

    sections.forEach(sec => {
        const sectionEl = document.getElementById(sec.id);
        if (!sectionEl) return;

        const header = sectionEl.querySelector('h2'); 
        const content = document.getElementById(sec.contentId); 

        if (!header || !content) return;

        header.classList.add('toggle-header');

        const wrapper = document.createElement('div');
        wrapper.className = 'toggle-wrapper';
        
        const inner = document.createElement('div');
        inner.className = 'toggle-inner';

        content.parentNode.insertBefore(wrapper, content);
        wrapper.appendChild(inner);
        inner.appendChild(content);

        if (sec.collapseDefault) {
            header.classList.add('collapsed');
            wrapper.classList.add('collapsed');
        }

        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            wrapper.classList.toggle('collapsed');
        });
    });
}

// === КАСТОМНЫЙ ПЛЕЕР ===
function initCustomPlayer() {
    const audio = document.getElementById('lofi-audio');
    const playBtn = document.getElementById('lofi-play-btn');
    const prevBtn = document.getElementById('lofi-prev-btn');
    const nextBtn = document.getElementById('lofi-next-btn');
    const volSlider = document.getElementById('lofi-vol');

    const statusEl = document.getElementById('lofi-status');
    const freqEl = document.getElementById('lofi-freq');
    const marqueeEl = document.getElementById('lofi-marquee');

    if (!audio || !playBtn || !prevBtn || !nextBtn || !volSlider || !statusEl || !freqEl || !marqueeEl) return;

    const stations =[
        {
            name: 'LYCORIS FM',
            freq: '104.5',
            genre: '24/7 LO-FI',
            stream: 'https://radiorecord.hostingradio.ru/lofi96.aacp'
        },
        {
            name: 'MOONLIGHT FM',
            freq: '98.7',
            genre: 'CHILL LO-FI',
            stream: 'https://ice1.somafm.com/groovesalad-128-mp3'
        },
        {
            name: 'AURORA FM',
            freq: '92.3',
            genre: 'RELAX & AMBIENT',
            stream: 'https://ice1.somafm.com/dronezone-128-mp3'
        }
    ];

    let currentStation = 0;
    let isPlaying = false;

    function updateStationUI(station) {
        statusEl.textContent = `${station.name} • ${station.genre}`;
        freqEl.textContent = `FM ${station.freq} // STEREO`;
        marqueeEl.textContent = `♪ ${station.freq} ${station.name} • ${station.genre} ♪ ${station.freq} ${station.name} • ${station.genre} ♪`;
    }

    function updatePlayButton() {
    if (isPlaying) {
        playBtn.classList.add('is-playing');
        playBtn.style.background = '#fff';
        playBtn.style.color = '#1c1e1c';
        playBtn.setAttribute('aria-label', 'Pause');
        playBtn.title = 'Pause';
    } else {
        playBtn.classList.remove('is-playing');
        playBtn.style.background = 'var(--accent-gold)';
        playBtn.style.color = '#1c1e1c';
        playBtn.setAttribute('aria-label', 'Play');
        playBtn.title = 'Play';
    }
}

    function loadStation(index) {
        const station = stations[index];
        audio.src = station.stream;
        updateStationUI(station);
    }

    async function playCurrentStation() {
        try {
            await audio.play();
            isPlaying = true;
            updatePlayButton();
        } catch (err) {
            console.error('Ошибка воспроизведения потока:', err);
            showLoFiToast('⚠️ Не удалось запустить станцию. Возможно, поток временно недоступен.');
            isPlaying = false;
            updatePlayButton();
        }
    }

    function pauseCurrentStation() {
        audio.pause();
        isPlaying = false;
        updatePlayButton();
    }

    async function togglePlay() {
        if (audio.paused) {
            await playCurrentStation();
        } else {
            pauseCurrentStation();
        }
    }

    async function switchStation(direction) {
        const shouldResume = isPlaying;

        audio.pause();
        isPlaying = false;

        currentStation = (currentStation + direction + stations.length) % stations.length;
        loadStation(currentStation);
        updatePlayButton();

        showLoFiToast(`📻 Переключено на ${stations[currentStation].name} — FM ${stations[currentStation].freq}`);

        if (shouldResume) {
            await playCurrentStation();
        }
    }

    volSlider.addEventListener('input', (e) => {
        audio.volume = parseFloat(e.target.value);
    });

    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', () => switchStation(-1));
    nextBtn.addEventListener('click', () => switchStation(1));

    audio.addEventListener('pause', () => {
        if (!audio.ended) {
            isPlaying = false;
            updatePlayButton();
        }
    });

    audio.addEventListener('playing', () => {
        isPlaying = true;
        updatePlayButton();
    });

    audio.addEventListener('error', () => {
        isPlaying = false;
        updatePlayButton();
        showLoFiToast('⚠️ У этой станции сейчас проблемы с потоком.');
    });

    audio.volume = parseFloat(volSlider.value);
    loadStation(currentStation);
    updatePlayButton();
}

// === ТАМАГОЧИ: КОШКА АСЯ ===
function initAsyaCat() {
    const playerBody = document.querySelector('.l-podcast-body');
    if (!playerBody) return;

    // Создаем кошку
    const cat = document.createElement('div');
    cat.id = 'bruniik-cat-widget'; // ID в CSS оставляем старым, чтобы не переписывать стили
    cat.title = 'Погладить Асю'; 
    
    // Создаем пузырь с рыбкой (голод)
    const bubble = document.createElement('div');
    bubble.className = 'cat-hungry-bubble';
    bubble.innerText = '🐟';
    cat.appendChild(bubble);

    playerBody.appendChild(cat);

    // Ищем чекбокс в стикерах (сработает и на "Покормить кошку", и на "Покормить Асю")
    const listItems = document.querySelectorAll('.sticky-list li');
    let catCheckbox = null;
    listItems.forEach(li => {
        if (li.innerText.includes('Покормить кошку') || li.innerText.includes('Покормить Асю')) {
            catCheckbox = li.querySelector('input[type="checkbox"]');
        }
    });

    let isHungry = false;
    let hungerTimer;
    let wakeTimer; 

    // Функция: Ася проголодалась
    function makeHungry() {
        isHungry = true;
        cat.classList.add('awake'); // Просыпается!
        bubble.classList.add('show');
        if (catCheckbox) catCheckbox.checked = false; // Снимаем галочку
        showLoFiToast('🐈 Ася проснулась и смотрит на пустую миску!');
    }

    // Запускаем цикл голода (раз в 15 минут)
    function resetHunger() {
        clearTimeout(hungerTimer);
        hungerTimer = setTimeout(makeHungry, 15 * 60 * 1000); 
    }

    // Функция поглаживания / кормления
    cat.addEventListener('click', (e) => {
        // Создаем сердечко
        const heart = document.createElement('div');
        heart.className = 'cat-heart';
        heart.innerText = '❤';
        
        const rect = cat.getBoundingClientRect();
        heart.style.left = (e.clientX - rect.left) + 'px';
        heart.style.top = (e.clientY - rect.top) + 'px';
        
        cat.appendChild(heart);
        setTimeout(() => heart.remove(), 1000);

        if (isHungry) {
            // Кормим
            isHungry = false;
            bubble.classList.remove('show');
            if (catCheckbox) catCheckbox.checked = true;
            showLoFiToast('🐈 Ням-ням! Ася сыта и ложится спать.', '#ef4444');
            
            // Засыпает обратно через 2 секунды
            setTimeout(() => { cat.classList.remove('awake'); }, 2000);
            resetHunger();
        } else {
            // Если просто гладим
            clearTimeout(wakeTimer);
            cat.classList.add('awake'); // Открывает глаза
            cat.style.transform = 'scale(1.05) translateY(-4px)';
            
            setTimeout(() => cat.style.transform = '', 150);
            
            // Засыпает обратно через 3 секунды, если больше не гладить
            wakeTimer = setTimeout(() => {
                if (!isHungry) cat.classList.remove('awake');
            }, 3000);
        }
    });

    // Связь с желтой запиской
    if (catCheckbox) {
        catCheckbox.addEventListener('change', (e) => {
            if (e.target.checked && isHungry) {
                isHungry = false;
                bubble.classList.remove('show');
                showLoFiToast('🐈 Ася покормлена через блокнот!', '#10b981');
                setTimeout(() => { cat.classList.remove('awake'); }, 2000);
                resetHunger();
            } else if (!e.target.checked) {
                makeHungry();
            }
        });
    }

    // === Старт: проверяем изначальное состояние блокнота ===
    if (catCheckbox && !catCheckbox.checked) {
        // Галочки нет -> Ася изначально голодная!
        isHungry = true;
        cat.classList.add('awake');
        bubble.classList.add('show');
        
        setTimeout(() => {
            showLoFiToast('🐈 Ася ждет свой завтрак! Кликни по ней!');
        }, 2500);
    } else {
        resetHunger();
    }
}

// === ПОМОДОРО ТАЙМЕР (С КАСТОМНЫМ ВВОДОМ) ===
function initPomodoro() {
    let defaultMins = 25;
    let timeLeft = defaultMins * 60; 
    let timerId = null;
    let isRunning = false;
    let completedCycles = 0; 
    
    const display = document.getElementById('pomo-display');
    const startBtn = document.getElementById('pomo-start');
    const resetBtn = document.getElementById('pomo-reset');
    
    if (!display || !startBtn || !resetBtn) return;

    function updateDisplay() {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        display.innerText = `${m}:${s}`;
    }

    // Тюнинг: Кастомный ввод времени по клику!
    display.style.cursor = 'pointer';
    display.title = 'Кликни, чтобы изменить время';
    display.addEventListener('click', () => {
        if (isRunning) {
            showLoFiToast("⏸ Сначала поставь на паузу, гонщик!");
            return;
        }
        let mins = prompt("Сколько минут заводим?", Math.floor(timeLeft / 60));
        // Защита от кривого ввода (букв, минусов)
        if (mins && !isNaN(mins) && mins > 0) {
            defaultMins = parseInt(mins);
            timeLeft = defaultMins * 60;
            updateDisplay();
            showLoFiToast(`⏱ Таймер перенастроен на ${defaultMins} мин.`);
        }
    });

    startBtn.addEventListener('click', () => {
        if (isRunning) {
            clearInterval(timerId);
            startBtn.innerText = '▶ Старт';
        } else {
            timerId = setInterval(() => {
                if (timeLeft > 0) { 
                    timeLeft--; 
                    updateDisplay(); 
                } else { 
                    clearInterval(timerId); 
                    isRunning = false;
                    completedCycles++;
                    
                    // Фейерверк из светлячков по центру
                    for(let i = 0; i < 20; i++) {
                        setTimeout(() => {
                            const boomX = window.innerWidth / 2 + (Math.random() * 300 - 150);
                            const boomY = window.innerHeight / 2 + (Math.random() * 300 - 150);
                            if (typeof createFireflyExplosion === 'function') createFireflyExplosion(boomX, boomY);
                        }, i * 150); 
                    }
                    
                    showLoFiToast(`🍅 Цикл завершен! Всего помидорок за сегодня: ${completedCycles}`);
                    
                    timeLeft = 5 * 60; // 5 минут отдыха
                    updateDisplay();
                    startBtn.innerText = '☕ Отдых';
                }
            }, 1000);
            startBtn.innerText = '⏸ Пауза';
        }
        isRunning = !isRunning;
    });

    resetBtn.addEventListener('click', () => {
        clearInterval(timerId);
        isRunning = false;
        timeLeft = defaultMins * 60; // Сбрасываем к последнему заданному времени
        startBtn.innerText = '▶ Старт';
        updateDisplay();
    });
}
// === ДВИЖОК DRAG & DROP (С СЕНСОРНЫМ ПРИВОДОМ) ===
function initDraggableWidgets() {
    const widgets = [
        { el: document.querySelector('.widget-left'), handle: document.querySelector('.pomo-title') },
        { el: document.querySelector('.widget-right'), handle: document.querySelector('.sticky-title') }
    ];

    widgets.forEach(widget => {
        if (!widget.el || !widget.handle) return;
        
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        function dragStart(e) {
            const evt = e.type.includes('touch') ? e.touches[0] : e;
            if (!e.type.includes('touch')) e.preventDefault(); 
            
            widget.el.classList.add('is-dragging');
            
            const rect = widget.el.getBoundingClientRect();
            
            // --- ФИКС ТЕЛЕПОРТАЦИИ НА МОБИЛКАХ ---
            // Жестко переводим в плавающий режим и сбрасываем margin
            widget.el.style.position = 'fixed';
            widget.el.style.margin = '0'; 
            
            widget.el.style.left = rect.left + 'px';
            widget.el.style.top = rect.top + 'px';
            widget.el.style.right = 'auto'; 
            widget.el.style.bottom = 'auto';

            pos3 = evt.clientX;
            pos4 = evt.clientY;
            
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('touchend', dragEnd);
            document.addEventListener('touchmove', dragMove, { passive: false }); 
        }

        function dragMove(e) {
            e.preventDefault(); // Глушим системный скролл
            const evt = e.type.includes('touch') ? e.touches[0] : e;
            pos1 = pos3 - evt.clientX;
            pos2 = pos4 - evt.clientY;
            pos3 = evt.clientX;
            pos4 = evt.clientY;
            
            widget.el.style.top = (widget.el.offsetTop - pos2) + "px";
            widget.el.style.left = (widget.el.offsetLeft - pos1) + "px";
        }

        function dragEnd() {
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('touchend', dragEnd);
            document.removeEventListener('touchmove', dragMove);
            widget.el.classList.remove('is-dragging');
        }

        // Цепляем и мышку, и пальцы
        widget.handle.addEventListener('mousedown', dragStart);
        widget.handle.addEventListener('touchstart', dragStart, { passive: false });
    });
}
// === СИСТЕМА УВЕДОМЛЕНИЙ (АЧИВКИ) ===
function showLoFiToast(message, color = 'var(--accent-gold)') {
    let container = document.getElementById('lofi-toasts');
    if (!container) {
        container = document.createElement('div');
        container.id = 'lofi-toasts';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'lofi-toast';
    toast.innerHTML = message;
    toast.style.borderLeftColor = color;
    container.appendChild(toast);
    
    // Самоуничтожение через 4.5 секунды
    setTimeout(() => { if(toast.parentNode) toast.remove(); }, 4500);
}
// === ДВИЖОК ЧАСТИЦ (ВЗРЫВ СВЕТЛЯЧКА) ===
function createFireflyExplosion(x, y) {
    const particleCount = 8; // Количество осколков при взрыве
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'firefly-particle';
        document.body.appendChild(particle);

        // Ставим частицу в координаты лопнувшего светлячка
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';

        // Вычисляем случайное направление разлета по кругу (360 градусов)
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 40 + 20; // Улетят на расстояние от 20 до 60px
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        // Запускаем анимацию через requestAnimationFrame (чтобы браузер не тупил)
        requestAnimationFrame(() => {
            particle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
            particle.style.opacity = '0';
        });

        // Убираем мусор (осколки) из памяти через полсекунды
        setTimeout(() => { if (particle.parentNode) particle.remove(); }, 500);
    }
}
// === ГЕНЕРАТОР СВЕТЛЯЧКОВ (МИНИ-ИГРА) ===
function initFireflyMinigame() {
    let score = 0;
    let idleTimer; // Наш датчик холостого хода
    let reminderCount = 0; // Предохранитель от бесконечного спама

    // База забавных фраз для AFK
    const afkPhrases = [
        "✨ Эй, ты тут? Светлячки совсем расслабились!",
        "✨ Ты там уснул под Lo-Fi? Искры наглеют!",
        "✨ Приём, база! Плотность светлячков превышает норму!",
        "✨ АФК-режим обнаружен. Возвращайся к ловле!",
        "✨ Не зевай, а то все золотые жуки разлетятся!"
    ];

    const scoreBoard = document.createElement('div');
    scoreBoard.id = 'firefly-score-board';
    scoreBoard.innerHTML = '✨ Поймано: <span>0</span>';
    document.body.appendChild(scoreBoard);

    // Умная функция сброса таймера
    function resetIdleTimer() {
        clearTimeout(idleTimer); 
        
        // Заводим новый на 30 секунд (30000 миллисекунд)
        idleTimer = setTimeout(() => {
            if (reminderCount < 5) { // Теперь напомнит до 5 раз, фразы-то разные!
                if (score === 0) {
                    showLoFiToast("✨ Псс... Светлячки пролетают мимо! Попробуй поймать!");
                } else {
                    // Выбираем случайную фразу из нашего "бардачка"
                    const randomPhrase = afkPhrases[Math.floor(Math.random() * afkPhrases.length)];
                    showLoFiToast(randomPhrase);
                }
                reminderCount++;
            }
        }, 30000);
    }

    // Запускаем таймер при старте двигателя
    resetIdleTimer();

    // Конвейер светлячков
    setInterval(() => {
        if(Math.random() > 0.3) return; 

        const bug = document.createElement('div');
        bug.className = 'lofi-firefly';
        
        let size = Math.random() * 5 + 3;
        bug.style.width = size + 'px';
        bug.style.height = size + 'px';
        bug.style.left = Math.random() * 95 + 'vw';
        
        // Запоминаем время анимации конкретно этого жука
        let animDurationSec = Math.random() * 15 + 10;
        bug.style.animationDuration = animDurationSec + 's';

        bug.onclick = function() {
            if (this.dataset.dead) return;
            this.dataset.dead = true;

            score++;
            scoreBoard.querySelector('span').innerText = score;
            
            if(score === 1) scoreBoard.classList.add('active');
            
            // --- РАЗДАЧА АЧИВОК ---
            if (score === 1) showLoFiToast("🏆 Первая искра! Так держать!");
            if (score === 10) showLoFiToast("🏆 10 светлячков! Да ты в прайме, чел!", "#6b8c6c");
            if (score === 25) showLoFiToast("🔥 25 искр! А ты хорош, мужик, хороош!", "#e8d087");
            if (score === 50) showLoFiToast("👑 50! Хокаге светлячков!", "#c084fc");
            if (score === 100) showLoFiToast("💀 100 искр... Друг, может тебе траву потрогать?", "#ef4444");
            
            scoreBoard.style.transform = 'scale(1.1)';
            setTimeout(() => scoreBoard.style.transform = 'scale(1)', 150);

            const rect = this.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            createFireflyExplosion(centerX, centerY);
            this.remove();

            // СБРАСЫВАЕМ ТАЙМЕР АФК ПРИ КЛИКЕ!
            resetIdleTimer();
            // Сбрасываем счетчик спама, чтобы таймер снова мог напоминать
            reminderCount = 0; 
        };

        document.body.appendChild(bug);
        // Уничтожаем ИМЕННО когда заканчивается его личная анимация! (умножаем на 1000 для перевода в миллисекунды)
        setTimeout(() => { if(bug.parentNode) bug.remove(); }, animDurationSec * 1000);
    }, 2000);
}
// === ВИЗУАЛЬНЫЙ ЭФФЕКТ "ДЫХАНИЕ СПОКОЙНОГО ПОТОКА" ===
function initLoFiCursor() {
    const symbols = ['♪', '♫', '✧', '✦', '☕'];
    let lastEmitTime = 0;

    document.addEventListener('mousemove', function(e) {
        const now = Date.now();
        if (now - lastEmitTime < 80) return;
        if (Math.random() > 0.3) return;

        lastEmitTime = now;

        const particle = document.createElement('div');
        particle.className = 'lofi-particle';
        particle.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        
        particle.style.left = (e.pageX + offsetX) + 'px';
        particle.style.top = (e.pageY + offsetY) + 'px';
        
        if (Math.random() > 0.5) {
            particle.style.color = '#dcb97a';
            particle.style.textShadow = '0 0 8px rgba(220, 185, 122, 0.6)';
        }

        document.body.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 2000);
    });
}
// === МЕХАНИКА СКЕТЧ-ЗАПИСОК (АБСОЛЮТНЫЙ ИНСТРУМЕНТАРИЙ V5.1 - ФИКС МАСШТАБА) ===
function initCanvasNotes() {
    const btnGroup = document.createElement('div');
    btnGroup.id = 'canvas-btn-group';
    
    const spawnBtn = document.createElement('button');
    spawnBtn.innerHTML = '🎨 Новый скетч';
    spawnBtn.className = 'btn'; 
    
    const clearAllBtn = document.createElement('button');
    clearAllBtn.innerHTML = '🔥 Сжечь всё';
    clearAllBtn.className = 'btn btn-danger';
    clearAllBtn.title = "Удалить все записки навсегда";
    
    btnGroup.appendChild(spawnBtn);
    btnGroup.appendChild(clearAllBtn);
    document.body.appendChild(btnGroup);

    let highestZ = 1600;
    const pinColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#3b301a'];

    function saveAllNotesToStorage() {
        const notesData = [];
        document.querySelectorAll('.canvas-note').forEach(noteEl => {
            if (!noteEl.bbHistory) return;
            notesData.push({
                id: noteEl.dataset.id, x: noteEl.style.left, y: noteEl.style.top, z: noteEl.style.zIndex,
                history: noteEl.bbHistory, 
                historyIndex: noteEl.bbHistoryIndex
            });
        });
        localStorage.setItem('bb_sketch_notes', JSON.stringify(notesData));
    }

    function loadNotes() {
        const saved = localStorage.getItem('bb_sketch_notes');
        if (saved) JSON.parse(saved).forEach(data => createNote(data));
    }

    clearAllBtn.addEventListener('click', () => {
        if(confirm("Точно удалить все скетчи? Эту магию нельзя будет отменить!")) {
            document.querySelectorAll('.canvas-note').forEach(n => n.remove());
            localStorage.removeItem('bb_sketch_notes');
        }
    });

    function createNote(data = null) {
        const id = data && data.id ? data.id : 'note_' + Date.now();
        const note = document.createElement('div');
        note.className = 'canvas-note';
        note.dataset.id = id;
        
        highestZ++;
        note.style.zIndex = data && data.z ? data.z : highestZ;

        if (data && data.x && data.y) {
            note.style.left = data.x; note.style.top = data.y;
        } else {
            const screenWidth = document.documentElement.clientWidth || window.innerWidth;
            let startX = screenWidth - 260 - Math.random() * 50;
            if (startX < 20) startX = 20 + Math.random() * 20;
            note.style.left = startX + 'px'; note.style.top = (100 + Math.random() * 50) + 'px';
        }
        note.style.right = 'auto'; 

        note.innerHTML = `
            <div class="canvas-handle" title="Потяни меня"></div>
            <div class="canvas-pin" title="Кликни, чтобы сменить цвет"></div>
            <div class="canvas-palette-toggle" title="Открыть/Закрыть панель инструментов">🎨</div>
            <div class="canvas-close" title="Выкинуть в мусорку">✖</div>
            
            <div class="overlay-container"></div>
            <canvas width="200" height="180" class="canvas-board"></canvas>

            <div class="canvas-toolbar">
                <div class="canvas-color active" style="background: #3b301a;" data-color="#3b301a"></div>
                <div class="canvas-color" style="background: #ef4444;" data-color="#ef4444"></div>
                <div class="canvas-color" style="background: #3b82f6;" data-color="#3b82f6"></div>
                <div class="canvas-color" style="background: #10b981;" data-color="#10b981"></div>
                <div class="canvas-color" style="background: #f59e0b;" data-color="#f59e0b"></div>
                
                <input type="range" class="canvas-size" min="1" max="15" value="2.5" title="Размер кисти/шрифта">
                
                <button class="canvas-tool-btn canvas-text-btn" title="Написать текст">🔤</button>
                <button class="canvas-tool-btn canvas-check-btn" title="Добавить задачу">✅</button>
                <button class="canvas-tool-btn canvas-eraser" title="Ластик">🧽</button>
                <button class="canvas-tool-btn canvas-undo" title="Шаг назад">↩</button>
                <button class="canvas-tool-btn canvas-redo" title="Шаг вперед">↪</button>
                <button class="canvas-tool-btn canvas-clear" title="Очистить холст">🗑️</button>
            </div>
        `;
        document.body.appendChild(note);

        const canvas = note.querySelector('.canvas-board');
        const ctx = canvas.getContext('2d');
        const overlayContainer = note.querySelector('.overlay-container');
        const pin = note.querySelector('.canvas-pin');
        
        let activeOverlay = null;

        let history = data && data.history ? data.history : [];
        let historyIndex = data && data.historyIndex !== undefined ? data.historyIndex : -1;
        note.bbHistory = history;
        note.bbHistoryIndex = historyIndex;

        function saveState() {
            if (historyIndex < history.length - 1) history.length = historyIndex + 1; 
            
            const overlaysState = [];
            note.querySelectorAll('.note-checkbox-wrapper').forEach(cb => {
                overlaysState.push({ type: 'checkbox', x: cb.style.left, y: cb.style.top, text: cb.querySelector('span').innerText, checked: cb.querySelector('input').checked, fontSize: cb.style.fontSize });
            });
            note.querySelectorAll('.note-text-wrapper').forEach(txt => {
                overlaysState.push({ type: 'text', x: txt.style.left, y: txt.style.top, text: txt.innerText, color: txt.style.color, fontSize: txt.style.fontSize });
            });

            history.push({
                image: canvas.toDataURL(),
                overlays: overlaysState,
                pinIdx: parseInt(note.dataset.pinIdx || 0)
            });

            if (history.length > 30) history.shift(); else historyIndex++;
            note.bbHistory = history; note.bbHistoryIndex = historyIndex;
            saveAllNotesToStorage();
        }

        function applyState(state, isRestoring = false) {
            if (!state) return;
            if (activeOverlay) { activeOverlay.classList.remove('is-selected'); activeOverlay = null; }

            let img = new Image(); img.src = state.image;
            img.onload = () => {
                const prevMode = ctx.globalCompositeOperation;
                ctx.globalCompositeOperation = 'source-over';
                ctx.clearRect(0, 0, canvas.width, canvas.height); 
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
                ctx.globalCompositeOperation = prevMode;
                if (!isRestoring) saveAllNotesToStorage();
            };
            
            overlayContainer.innerHTML = '';
            state.overlays.forEach(ov => {
                if (ov.type === 'checkbox') createCheckboxOverlay(parseFloat(ov.x), parseFloat(ov.y), ov.text, ov.checked, true, ov.fontSize);
                else if (ov.type === 'text') createTextOverlay(parseFloat(ov.x), parseFloat(ov.y), ov.text, ov.color, ov.fontSize, true);
            });

            note.dataset.pinIdx = state.pinIdx;
            pin.style.background = pinColors[state.pinIdx];
            note.bbHistory = history; note.bbHistoryIndex = historyIndex;
        }

        note.querySelector('.canvas-undo').addEventListener('click', () => {
            if (historyIndex > 0) { historyIndex--; note.bbHistoryIndex = historyIndex; applyState(history[historyIndex]); }
        });
        note.querySelector('.canvas-redo').addEventListener('click', () => {
            if (historyIndex < history.length - 1) { historyIndex++; note.bbHistoryIndex = historyIndex; applyState(history[historyIndex]); }
        });

        if (history.length > 0 && historyIndex >= 0) {
            applyState(history[historyIndex], true);
        } else if (data && data.image) {
            let img = new Image(); img.src = data.image;
            img.onload = () => { 
                ctx.drawImage(img, 0, 0); 
                if (data.overlays) {
                    data.overlays.forEach(ov => {
                        if (ov.type === 'checkbox') createCheckboxOverlay(parseFloat(ov.x), parseFloat(ov.y), ov.text, ov.checked, true, ov.fontSize);
                        else if (ov.type === 'text') createTextOverlay(parseFloat(ov.x), parseFloat(ov.y), ov.text, ov.color, ov.fontSize, true);
                    });
                }
                note.dataset.pinIdx = data.pinIdx !== undefined ? data.pinIdx : 0;
                pin.style.background = pinColors[note.dataset.pinIdx];
                saveState(); 
            };
        } else { 
            note.dataset.pinIdx = 0; pin.style.background = pinColors[0];
            saveState(); 
        }

        function changePinColor(e) {
            e.stopPropagation(); 
            if (e && e.type.includes('touch')) e.preventDefault();
            let idx = parseInt(note.dataset.pinIdx);
            idx = (idx + 1) % pinColors.length;
            note.dataset.pinIdx = idx;
            pin.style.background = pinColors[idx];
            saveState(); 
        }
        pin.addEventListener('mousedown', e => e.stopPropagation()); 
        pin.addEventListener('click', changePinColor);
        pin.addEventListener('touchstart', changePinColor, { passive: false });

        note.querySelector('.canvas-palette-toggle').addEventListener('click', () => {
            document.querySelectorAll('.canvas-note').forEach(n => { if (n !== note) n.classList.remove('show-tools'); });
            note.classList.toggle('show-tools');
        });

        note.querySelector('.canvas-close').addEventListener('click', () => {
            note.style.transform = 'scale(0)';
            setTimeout(() => { note.remove(); saveAllNotesToStorage(); }, 200);
        });

        const handle = note.querySelector('.canvas-handle');
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        function dragStart(e) {
            const evt = e.type.includes('touch') ? e.touches[0] : e;
            if (!e.type.includes('touch')) e.preventDefault();
            highestZ++; note.style.zIndex = highestZ;
            pos3 = evt.clientX; pos4 = evt.clientY;
            document.addEventListener('mouseup', dragEnd); document.addEventListener('mousemove', dragMove);
            document.addEventListener('touchend', dragEnd); document.addEventListener('touchmove', dragMove, { passive: false });
        }
        function dragMove(e) {
            e.preventDefault(); const evt = e.type.includes('touch') ? e.touches[0] : e;
            pos1 = pos3 - evt.clientX; pos2 = pos4 - evt.clientY;
            pos3 = evt.clientX; pos4 = evt.clientY;
            note.style.top = (note.offsetTop - pos2) + "px"; note.style.left = (note.offsetLeft - pos1) + "px";
        }
        function dragEnd() {
            document.removeEventListener('mouseup', dragEnd); document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('touchend', dragEnd); document.removeEventListener('touchmove', dragMove);
            saveAllNotesToStorage(); 
        }
        handle.addEventListener('mousedown', dragStart); handle.addEventListener('touchstart', dragStart, { passive: false });

        function makeInnerDraggable(el) {
            let startX, startY, initialLeft, initialTop;
            let isDragged = false;
            
            function innerDragStart(e) {
                if (e.target.tagName === 'INPUT') return; 
                e.stopPropagation(); 
                const evt = e.type.includes('touch') ? e.touches[0] : e;
                if (!e.type.includes('touch')) e.preventDefault();
                
                if (activeOverlay) activeOverlay.classList.remove('is-selected');
                activeOverlay = el;
                activeOverlay.classList.add('is-selected');
                
                const currentSizePx = parseFloat(el.style.fontSize) || 19.5;
                note.querySelector('.canvas-size').value = (currentSizePx - 12) / 3;

                startX = evt.clientX; startY = evt.clientY;
                initialLeft = parseFloat(el.style.left) || 0; 
                initialTop = parseFloat(el.style.top) || 0;
                isDragged = false;
                
                document.addEventListener('mouseup', innerDragEnd); document.addEventListener('mousemove', innerDragMove);
                document.addEventListener('touchend', innerDragEnd); document.addEventListener('touchmove', innerDragMove, { passive: false });
            }
            function innerDragMove(e) {
                e.preventDefault();
                const evt = e.type.includes('touch') ? e.touches[0] : e;
                const dx = evt.clientX - startX;
                const dy = evt.clientY - startY;
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDragged = true; 
                
                el.style.left = (initialLeft + dx) + "px"; 
                el.style.top = (initialTop + dy) + "px";
            }
            function innerDragEnd() {
                document.removeEventListener('mouseup', innerDragEnd); document.removeEventListener('mousemove', innerDragMove);
                document.removeEventListener('touchend', innerDragEnd); document.removeEventListener('touchmove', innerDragMove);
                if (isDragged) saveState(); 
            }
            el.addEventListener('mousedown', innerDragStart); el.addEventListener('touchstart', innerDragStart, { passive: false });
        }

        function createCheckboxOverlay(x, y, text, isChecked, isRestoring = false, fontSize = "19.5px") {
            const cbWrap = document.createElement('div'); 
            cbWrap.className = 'note-checkbox-wrapper';
            cbWrap.style.left = x + 'px'; cbWrap.style.top = y + 'px';
            cbWrap.style.fontSize = fontSize;
            cbWrap.innerHTML = `<input type="checkbox" ${isChecked ? 'checked' : ''}> <span>${text}</span>`;
            
            const inputBox = cbWrap.querySelector('input');
            inputBox.addEventListener('change', () => { saveState(); }); 
            inputBox.addEventListener('mousedown', e => e.stopPropagation()); 
            inputBox.addEventListener('touchstart', e => e.stopPropagation());
            
            cbWrap.addEventListener('dblclick', () => { 
                if (activeOverlay === cbWrap) activeOverlay = null;
                cbWrap.remove(); saveState(); 
            }); 
            
            overlayContainer.appendChild(cbWrap);
            makeInnerDraggable(cbWrap); 
            if (!isRestoring) saveState();
        }

        function createTextOverlay(x, y, text, color, sizeStr, isRestoring = false) {
            const txtWrap = document.createElement('div');
            txtWrap.className = 'note-text-wrapper';
            txtWrap.style.left = x + 'px'; txtWrap.style.top = y + 'px';
            txtWrap.style.color = color; txtWrap.style.fontSize = sizeStr;
            txtWrap.innerText = text;
            
            txtWrap.addEventListener('dblclick', () => { 
                if (activeOverlay === txtWrap) activeOverlay = null;
                txtWrap.remove(); saveState(); 
            }); 
            
            overlayContainer.appendChild(txtWrap);
            makeInnerDraggable(txtWrap); 
            if (!isRestoring) saveState();
        }

        let isDrawing = false;
        let currentColor = '#3b301a';
        let currentSize = 2.5;
        let currentTool = 'draw'; 

        const toolBtns = note.querySelectorAll('.canvas-tool-btn:not(.canvas-undo):not(.canvas-redo)');
        function setActiveTool(toolName, btnElement) {
            currentTool = toolName;
            toolBtns.forEach(b => b.classList.remove('active'));
            if (btnElement) btnElement.classList.add('active');

            if (toolName === 'eraser') ctx.globalCompositeOperation = 'destination-out';
            else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = currentColor; }
        }

        function updateBrushSize() {
            ctx.lineWidth = currentSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        }
        updateBrushSize();

        const colors = note.querySelectorAll('.canvas-color');
        colors.forEach(col => {
            col.addEventListener('click', () => {
                colors.forEach(c => c.classList.remove('active')); col.classList.add('active');
                currentColor = col.dataset.color;
                setActiveTool('draw', null); updateBrushSize();
            });
        });

        const slider = note.querySelector('.canvas-size');
        slider.addEventListener('input', (e) => {
            if (activeOverlay) {
                // Изменяем ТОЛЬКО размер шрифта родительского контейнера. CSS сделает всё остальное!
                const newSize = (e.target.value * 3 + 12) + 'px';
                activeOverlay.style.fontSize = newSize;
            } else {
                currentSize = e.target.value; updateBrushSize();
            }
        });
        slider.addEventListener('change', (e) => {
            if (activeOverlay) saveState(); 
        });

        note.querySelector('.canvas-text-btn').addEventListener('click', function() { setActiveTool('text', this); });
        note.querySelector('.canvas-check-btn').addEventListener('click', function() { setActiveTool('checkbox', this); });
        note.querySelector('.canvas-eraser').addEventListener('click', function() { setActiveTool('eraser', this); });

        note.querySelector('.canvas-clear').addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            overlayContainer.innerHTML = ''; 
            saveState(); 
        });

        function setOverlaysInteractive(interactive) {
            note.querySelectorAll('.note-checkbox-wrapper, .note-text-wrapper').forEach(el => {
                el.style.pointerEvents = interactive ? 'auto' : 'none';
            });
        }

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const evt = e.type.includes('touch') ? e.touches[0] : e;
            return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
        }

        function startDraw(e) {
            if (e.type.includes('touch')) e.preventDefault(); 
            const pos = getPos(e);

            if (activeOverlay) {
                activeOverlay.classList.remove('is-selected'); activeOverlay = null;
                slider.value = currentSize; 
            }

            if (currentTool === 'text') {
                const text = prompt("Введите текст:");
                if (text) createTextOverlay(pos.x, pos.y, text, currentColor, (currentSize * 3) + 12 + 'px');
                return;
            }

            if (currentTool === 'checkbox') {
                const text = prompt("Текст задачи:");
                if (text) createCheckboxOverlay(pos.x, pos.y, text, false, false, (currentSize * 3) + 12 + 'px');
                return;
            }

            isDrawing = true;
            setOverlaysInteractive(false); 
            ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
        }

        function draw(e) {
            if (!isDrawing) return;
            if (e.type.includes('touch')) e.preventDefault(); 
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y); ctx.stroke();
        }

        function stopDraw() { 
            if (isDrawing) {
                isDrawing = false; 
                setOverlaysInteractive(true); 
                saveState(); 
            }
        }

        canvas.addEventListener('mousedown', startDraw); canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDraw); canvas.addEventListener('mouseleave', stopDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false }); canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDraw); canvas.addEventListener('touchcancel', stopDraw);
    }

    spawnBtn.addEventListener('click', () => { createNote(); saveAllNotesToStorage(); });
    loadNotes();
}
// === ЗАПУСК ВСЕХ ДВИЖКОВ ПРИ СТАРТЕ ===
document.addEventListener('DOMContentLoaded', () => {
    // Восстановленные базовые модули:
    renderExtensions(); 
    renderBots();       
    renderGallery();    
    setupToggles();     
    initCustomPlayer(); 

    // Наши новые турбины и интерактив:
    initPomodoro();     
    initLoFiCursor();   
    initDraggableWidgets(); 
    initFireflyMinigame();  
    initCanvasNotes(); 
    initAsyaCat();
    initModalEvents();
});