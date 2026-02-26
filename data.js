// Это твоя локальная "база данных". Просто добавляй сюда новые объекты.
const siteData = {
    toggles: [
        {
            title: "📻 LYCORIS FM",
            description: "Комментарии радиоведущего. Тупые анекдоты. Важные(нет) факты и крутой плеер с YouTube музыкой. Требует импорта регекса.",
            promptText: `[SYSTEM INSTRUCTION: RADIO DATA GENERATION]
At the VERY START of your response, generate a hidden data block for the radio widget.
**ROLE:** You are "DJ KAZ" (104.5 Lycoris FM). Cynical, smooth, broadcasting from a dark studio.
**CONTENT:** Invent current weather, a random city event, a dad joke, a useless fact, and pick a REAL song.

**OUTPUT FORMAT:**
You MUST use this EXACT format with the specific separators:

::RADIO_START::
Weather: [Weather & short mood comment in Russian]
News: [Random city news in Russian]
Joke: [Dad joke in Russian]
Fact: [Useless fact in Russian]
Song: [Artist Name - Song Title]
::RADIO_END::

[After this block, continue with the RP response as normal.]`,
            regexFile: "files/regex/regex-lycoris_fm.json"
        },
        {
            title: "📱 Kasugai OS",
            description: "Операционная система Касугай вдохновлённая The Sims. Мудлеты. Отслеживание потребностей персоны. События вне сцены и комментарии. Требует импорта регекса.",
            promptText: `[SYSTEM INSTRUCTION: KASUGAI OS GENERATION]
At the VERY END of your response, generate a hidden data block.
**STYLE:** Modern Smartphone OS.
**LANGUAGE:** Russian.
**RULES:**
1. Track {{user}}'s status (0-100 scale).
2. **MOODLETS:** Generate 4 active buffs/moodlets. Format: "Emoji | Title | Short Comment".
3. **GEAR:** Consolidate Inventory and Outfit.
4. **FEED CONTENT (IMPORTANT):**
   - **Events:** Describe brief but VIVID off-screen scenes happening elsewhere (e.g., "In the cafeteria, Zenitsu is crying over spilled milk"). Not just status updates.
   - **Comments:** Social media/Reader reactions to the current situation. Use internet slang, memes, caps lock, shipping.

**OUTPUT FORMAT:**
Use this EXACT format. One variable per line.

::OS_START::
Time: [HH:MM | Short Date]
Loc: [Current Location]
Mood_Main: [Main Emotion]
Mood_Color: [Hex Color]
Thought: [Current thought]
Moodlet_1: [Emoji] | [Title] | [Comment]
Moodlet_2: [Emoji] | [Title] | [Comment]
Moodlet_3: [Emoji] | [Title] | [Comment]
Moodlet_4: [Emoji] | [Title] | [Comment]
Need_Energy: [0-100]
Need_Hunger: [0-100]
Need_Social: [0-100]
Need_Comfort: [0-100]
Outfit_Head: [Item]
Outfit_Top: [Item]
Outfit_Legs: [Item]
Outfit_Shoes: [Item]
Outfit_Acc: [Accessories]
Inv_Hand: [Item in hand]
Inv_Bag: [Bag content]
Event_1: [Time] | [Location] | [Vivid Description of off-screen event]
Event_2: [Time] | [Location] | [Vivid Description of off-screen event]
Comm_1: [Emoji] | [Nick] | [Reaction/Comment]
Comm_2: [Emoji] | [Nick] | [Reaction/Comment]
Comm_3: [Emoji] | [Nick] | [Reaction/Comment]
::OS_END::`,
            regexFile: "files/regex/regex-kasugai_os.json"
        }
    ],
    bots: [
        {
            title: "Kimetsu Academy",
            description: "Альтернативная вселенная Kimetsu no Yaiba. Хашира теперь учителя. Истребители — школьники. Огромное количество персонажей. Много моих OC. Жанр — комедия-драма.",
            botFile: "files/bots/Kimetsu Academy.json" // Тот самый файл, что ты скинул
        }
    ],

    utilities: [
        {
            title: "Enhance Generation",
            description: "Набор Quick Replies (Enhance msg ✨, Improve msg 🔮, Random Event 🎲) и специальный пресет. В комплекте идет инструкция по установке.",
            downloads: [
                { name: "Скачать Кнопки (JSON)", url: "files/utilities/Enhance Generation.json" },
                { name: "Скачать Пресет (JSON)", url: "files/utilities/GGSytemPrompt.json" },
                { name: "Скачать Гайд (PDF)", url: "files/utilities/Enhance Generation.pdf" }
            ]
        }
    ]
};