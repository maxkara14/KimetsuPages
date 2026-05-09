const siteData = {
    extensions: [
        {
            title: "🛠️ BB UI Regex Manager",
            description: "Центр управления regex-модулями для SillyTavern: смартфон, lore-orbs, радио, часы, переходы, сценические карточки и cleaner-фиксы. У части модулей есть стили, авто-подключение промпта и копирование.",
            url: "https://github.com/maxkara14/BB-UI-Regex-Pack",
            btnText: "Установить с GitHub"
        },
        {
            title: "💖 BB Visual Novel Engine",
            description: "Визуальная новелла поверх чата: HUD отношений, доверие и романтика, память персонажей, карточки профилей, уведомления и три эмоционально размеченных варианта действий с reroll и Custom API.",
            url: "https://github.com/maxkara14/BB-Visual-Novel-Engine",
            btnText: "Установить с GitHub"
        },
        {
            title: "🎬 BB Scene Director",
            description: "Пульт режиссуры сцены: категории, директивы, ползунки интенсивности, пресеты и JSON-импорт/экспорт. Промпт можно вставлять автоматически или вручную через макрос {{bb_scene}}.",
            url: "https://github.com/maxkara14/BB-Scene-Director",
            btnText: "Установить с GitHub"
        },
        {
            title: "📡 BB Interactive Map",
            description: "Интерактивная 3x3 карта и пространственная память: зоны, персонажи, объекты, атмосфера и уровни угрозы. Поддерживает масштабы комнаты и здания, Custom API и макрос {{bb_map}}.",
            url: "https://github.com/maxkara14/BB-Interactive-Map",
            btnText: "Установить с GitHub"
        },
        {
            title: "🗂 BB Extension Sorter",
            description: "Органайзер меню расширений SillyTavern: папки, цвета, сворачивание и drag-and-drop сортировка между колонками. Раскладка сохраняется и применяется автоматически.",
            url: "https://github.com/maxkara14/BB-Extension-Sorter",
            btnText: "Установить с GitHub"
        },
		{
            title: "🖼️ BB Floating Avatar Viewer",
            description: "Плавающий просмотр аватаров персонажей и персоны: несколько окон, перетаскивание, масштабирование колесом, pinch-to-zoom, мобильные жесты и запоминание размера и позиции.",
            url: "https://github.com/maxkara14/BB-Floating-Avatar-Viewer",
            btnText: "Установить с GitHub"
        },
        {
            title: "✨ BB Enhance Generation",
            description: "Панель инструментов над вводом: Enhance, Improve, Event Director, Action Roll, Fast Travel и Time Skip. Кнопки можно включать отдельно, а генерацию ускорять через Custom API.",
            url: "https://github.com/maxkara14/BB-Enhance-Gen",
            btnText: "Установить с GitHub"
        },
        {
            title: "🏆 BB Collection Vault",
            description: "Коллекционная витрина для SillyTavern: сохраняет лор-орбы из чата, собирает редкие ачивки за важные моменты ролки, показывает поиск, фильтр редкости, уведомления, звук и локальное хранилище по каждому чату.",
            url: "https://github.com/maxkara14/BB-Collection-Vault",
            btnText: "Установить с GitHub",
            icon: "spark"
        }
    ],
    bots: [
        {
            title: "Kimetsu Academy 🖊️",
            description: "Альтернативная вселенная Kimetsu no Yaiba в жанре школьной комедии и повседневности. Хашира стали строгими учителями, а истребители — обычными школьниками. Содержит огромное количество канонных персонажей и проработанных авторских OC для ваших сюжетов.",
            icon: "ink",
            botFile: "files/bots/Kimetsu Academy.png"
        },
        {
            title: "Kimetsu Tokyo",
            description: "Альтернативная вселенная Kimetsu no Yaiba в жанре городской повседневности, романтики и драмы. Шумный Токио стал полем битвы амбиций: светлая Академия Кимэцу противостоит холодной элитарной школе Кибуцудзи, а магия уступила место талантам и интригам. Включает богатую сеть канонных персонажей и проработанных авторских OC для историй в ритме мегаполиса.",
            icon: "heart",
            botFile: "files/bots/Kimetsu Tokyo.png"
        },
        {
            title: "Хроники Сильвера",
            description: "Оригинальный сеттинг, объединяющий эстетику традиционной Японии и уникальную систему научно-биохимической магии. Добро пожаловать в Сильвер — скрытое молодое государство, где за изяществом старинной архитектуры и строгой дисциплиной кроются политическое напряжение и смертельная опасность. Содержит глубокий лор и колоритных авторских OC для серьезных, напряженных и драматичных сюжетов.",
            icon: "spark",
            botFile: "files/bots/Хроники Сильвера.png"
        },
        {
            title: "Эйдмар 🗺️",
            description: "Открытая фэнтези-песочница на большом континенте Эйдмар: королевства, эльфийские дворы, гномьи твердыни, орочьи кланы, свободные города, магия, фракции, NPC и последствия ваших решений. Подходит для приключений, быта, политики, романа и опасных дорог без жесткой сюжетной колеи.",
            icon: "map",
            botFile: "files/bots/Эйдмар.png"
        }

    ],
    gallery: [
        // Закидывай арты в папку img/gallery/ и просто добавляй сюда строчки:
        { src: "img/gallery/Акико.png", title: "Акико" },
        { src: "img/gallery/Каири.png", title: "Каири" },
        { src: "img/gallery/Закуро.png", title: "Закуро" },
        { src: "img/gallery/Рэйна.png", title: "Рэйна" },
		{ src: "img/gallery/Аой.png", title: "Аой" },
		{ src: "img/gallery/Шинобу.png", title: "Шинобу" },
		{ src: "img/gallery/Кай.png", title: "Кай" },
		{ src: "img/gallery/Сора.png", title: "Сора" },
		{ src: "img/gallery/Лона.png", title: "Лона" },
        { src: "img/gallery/Лона (2).png", title: "Лона (2)" },
        { src: "img/gallery/Лона (3).png", title: "Лона (3)" },
        { src: "img/gallery/Рен.png", title: "Рен" },
		{ src: "img/gallery/Миюки.png", title: "Миюки" },
        { src: "img/gallery/Юичи.png", title: "Юичи" },
        { src: "img/gallery/Хикари.png", title: "Хикари" },
        { src: "img/gallery/Рин.png", title: "Рин" },
        { src: "img/gallery/Дайя.png", title: "Дайя" },
        { src: "img/gallery/Кота.png", title: "Кота" },
        { src: "img/gallery/Мегуми.png", title: "Мегуми" },
        { src: "img/gallery/Рэй.png", title: "Рэй" },
        { src: "img/gallery/Мао.png", title: "Мао" },
        { src: "img/gallery/Токо.png", title: "Токо" },
        { src: "img/gallery/Мио.png", title: "Мио" },
        { src: "img/gallery/Эрика.png", title: "Эрика" },
        { src: "img/gallery/Нокита.png", title: "Нокита" },
        { src: "img/gallery/Рия.png", title: "Рия" },
        { src: "img/gallery/Фуюми.png", title: "Фуюми" },
        { src: "img/gallery/Яно.png", title: "Яно" },
        { src: "img/gallery/Кира.png", title: "Кира" },
        { src: "img/gallery/Каро.png", title: "Каро" },
        { src: "img/gallery/Айка.png", title: "Айка" },
    ]
};
