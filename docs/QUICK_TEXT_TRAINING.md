# Быстрое базовое обучение TextNet

## 1. Запуск сервисов

**Один скрипт — всё сразу:**

```powershell
# Из корня проекта
pnpm start:all
```

Или через PowerShell:
```powershell
.\scripts\start-all.ps1
```

Или через BAT (двойной клик):
```cmd
scripts\start-all.bat
```

> **Если окна закрываются или localhost не отвечает** — см. [SESSION_2026-03-04.md](SESSION_2026-03-04.md). Запусти вручную в 3 терминалах:
> 1. `pnpm --filter @omega/core dev`
> 2. `pnpm --filter @omega/web dev`
> 3. `cd services\harvesters; python -m uvicorn main:app --port 8000 --reload`

Откроются 3 окна терминала:
- AI Engine    → http://localhost:4000
- Web          → http://localhost:3001
- Harvesters   → http://localhost:8000

**Админка:** http://localhost:3001/admin

> Если 404 — проверь порт в терминале (Next.js пишет `Local: http://localhost:XXXX`).

---

## 2. Вариант A — через админку (самый простой)

1. Открой **http://localhost:3001/admin/harvesters**
2. Вставь URL, например:
   - `https://en.wikipedia.org/wiki/Artificial_intelligence`
   - `https://ru.wikipedia.org/wiki/Искусственный_интеллект`
3. Выбери тип **text**
4. Нажми **Launch**
5. Обнови страницу — увидишь статус и сколько элементов собрано

---

## 3. Вариант B — скрипт train_textnet.py (массово)

```powershell
cd C:\Users\Admin\Desktop\Cee\services\harvesters
```

### Быстрый старт (5–10 статей Wikipedia)

```powershell
python train_textnet.py --level 1
```

### Только одна тема (быстрее)

```powershell
python train_textnet.py --topic "Artificial intelligence"
python train_textnet.py --topic "Physics"
python train_textnet.py --topic "Математика" --lang ru
```

### Один конкретный URL

```powershell
python train_textnet.py --url https://en.wikipedia.org/wiki/Neural_network
```

### Больше данных (уровень 2 = +новости, блоги)

```powershell
python train_textnet.py --level 2
```

### Ограничить количество статей

```powershell
python train_textnet.py --level 1 --limit 20
```

---

## 4. Почему Wikipedia харвестер собрал 0?

1. **AI Engine должен быть запущен** — харвестер шлёт данные на `POST /learn`. Если core не работает, все элементы отбрасываются.
2. **Порог качества** — по умолчанию 0.5 (раньше 0.7 отсекал много текста). В `services/harvesters/.env` можно задать `DATA_QUALITY_THRESHOLD=0.4`.
3. **API ключ** — в `.env` и `harvesters/.env` должен быть один и тот же `AI_ENGINE_API_KEY`.
4. **Проверка** — смотри логи Harvesters в терминале. Если видишь `[WebHarvester] GET ... status=200` и `harvest done: N blocks`, но `items_collected=0`, значит либо AI Engine недоступен, либо порог качества слишком высокий.

---

## 5. Hugging Face — массовое обучение

### Через админку
1. Открой **http://localhost:3001/admin/training**
2. В блоке **Hugging Face** введи датасет, например:
   - `HuggingFaceFW/fineweb` — веб-текст (streaming)
   - `squad` — вопросы-ответы
   - `facebook/lama` — факты (укажи config: trex в колонке или через CLI)
3. Колонка: `text` (или `content`, `question` — зависит от датасета)
4. Лимит: 1000–10000 для теста
5. Нажми **Запустить HF**

### Через CLI
```powershell
cd services\harvesters

# FineWeb (streaming, много текста)
python train_textnet.py --hf-dataset HuggingFaceFW/fineweb --hf-column text --limit 5000 --streaming --batch 8

# SQuAD (вопросы-ответы)
python train_textnet.py --hf-dataset squad --hf-split train --limit 3000 --batch 8

# LAMA (факты)
python train_textnet.py --lama trex --limit 5000
```

---

## 6. Проверка

- **Admin Chat:** http://localhost:3001/admin/chat — задай вопрос по теме
- **Stats:** http://localhost:3001/admin/stats — смотри Li Knowledge
- **Harvesters:** http://localhost:3001/admin/harvesters — статистика сбора

---

## 7. Что происходит внутри

1. Текст разбивается на чанки (~200–500 символов)
2. Каждый чанк → sentence-transformers → 384-dim вектор
3. Вектор + raw текст → POST /learn → Li центры
4. Li сохраняет в Supabase (li_knowledge)
5. При запросе: recall по cosine similarity → Omega синтезирует ответ
