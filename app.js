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
    if (!container) return; // Защита на случай, если блока нет

    container.innerHTML = ''; 
    
    siteData.gallery.forEach(img => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        // Оборачиваем картинку в ссылку на саму себя
        item.innerHTML = `
            <a href="${img.src}" target="_blank" rel="noopener noreferrer" title="Открыть оригинал: ${img.title}">
                <img src="${img.src}" alt="${img.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzZjJjMmMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iI2Q0YWYzNyIgZm9udC1zaXplPSIxOHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QXJ0IEhlcmU8L3RleHQ+PC9zdmc+'" loading="lazy">
            </a>
        `;
        container.appendChild(item);
    });
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    renderExtensions();
    renderBots();
    renderGallery();
});