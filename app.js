// Функция отрисовки промптов
function renderToggles() {
    const container = document.getElementById('toggles-container');
    container.innerHTML = ''; 
    
    siteData.toggles.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="post-header">
                <div class="avatar toggle">T</div>
                <div class="post-meta">
                    <span class="post-author">${item.title}</span>
                    <span class="post-time">Касугай-Система • Промпт</span>
                </div>
            </div>
            <div class="post-body">
                <p>${item.description}</p>
                <button onclick="copyPrompt(this, ${index})" class="btn copy-btn">📋 Копировать Промпт</button>
                <a href="${item.regexFile}" download class="btn download-btn">💾 Скачать Regex</a>
            </div>
        `;
        container.appendChild(card);
    });
}

// Функция отрисовки ботов
function renderBots() {
    const container = document.getElementById('bots-container');
    container.innerHTML = '';
    
    siteData.bots.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="post-header">
                <div class="avatar bot">B</div>
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

// Утилита для копирования
function copyPrompt(buttonElement, index) {
    // Достаем текст напрямую из базы данных по индексу
    const textToCopy = siteData.toggles[index].promptText;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = buttonElement.innerText;
        buttonElement.innerText = "Скопировано!";
        buttonElement.classList.add('success');
        
        setTimeout(() => {
            buttonElement.innerText = originalText;
            buttonElement.classList.remove('success');
        }, 2000);
    }).catch(err => {
        console.error('Ошибка: ', err);
        alert('Браузер заблокировал буфер обмена.');
    });
}

// Функция отрисовки утилит (Добавь ее к остальным функциям)
function renderUtilities() {
    const container = document.getElementById('utilities-container');
    if (!container) return; 
    container.innerHTML = '';
    
    siteData.utilities.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let buttonsHtml = '';
        item.downloads.forEach(dl => {
            buttonsHtml += `<a href="${dl.url}" download class="btn download-btn">${dl.name}</a>`;
        });

        card.innerHTML = `
            <div class="post-header">
                <div class="avatar utility">U</div>
                <div class="post-meta">
                    <span class="post-author">${item.title}</span>
                    <span class="post-time">Модификации • Пакет</span>
                </div>
            </div>
            <div class="post-body">
                <p>${item.description}</p>
                <div class="utilities-downloads" style="margin-top: 15px;">
                    ${buttonsHtml}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    renderToggles();
    renderBots();
    renderUtilities();
});