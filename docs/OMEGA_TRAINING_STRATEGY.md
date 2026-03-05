# OMEGA — Стратегия обучения «умнее всех»

## Подключение к Hugging Face (без ручного QA)

| Способ | Описание |
|--------|----------|
| **Python `datasets`** | Уже используется в `train_textnet.py`. `load_dataset()` скачивает автоматически, кэш: `~/.cache/huggingface/hub`. |
| **HF CLI** | `pip install -U huggingface_hub` → `hf download <repo> <file>`. Для датасетов не нужен — Python делает всё сам. |
| **Токен** | Публичные датасеты (squad, fineweb) — без токена. Gated: `HF_TOKEN=hf_xxx` в `.env` или `$env:HF_TOKEN`. |

**Автоматизация:**
```powershell
pnpm start:all          # поднять AI Engine
pnpm train:all          # обучить из datasets_config.yaml
```

Или: `.\scripts\train-all.ps1 -Batch 16`

---

## Как устроен OMEGA (напоминание)

OMEGA **не генеративная модель** как GPT. Это **retrieval-augmented система**:

```
Текст → чанки → embeddings (sentence-transformers) → Li.learn() → Supabase
Запрос → embedding → recall (cosine similarity) → Omega синтезирует ответ
```

**Ум = качество recall.** Чем лучше Li хранит и находит релевантные куски знаний, тем умнее ответы.

---

## Почему gpt-4o-distil НЕ подходит напрямую

| Аспект | gpt-4o-distil | Что нужно OMEGA |
|--------|---------------|------------------|
| Формат | DPO (chosen vs rejected) | Текстовые чанки для recall |
| Цель | Обучить модель предпочитать ответы | Наполнить Li знаниями |
| Использование | Preference learning | Семантический поиск |

**Но:** можно **адаптировать**. Извлечь `prompt` + `chosen` как пары «вопрос–ответ» и кормить Li. Тогда OMEGA получит качественные ответы в стиле GPT-4o как знания для recall. Формат DPO сам по себе не используется.

---

## Лучшие датасеты для OMEGA

### Уровень 1 — Факты и знания (приоритет)

| Датасет | Описание | Колонка / text_from | Размер |
|--------|----------|---------------------|--------|
| **facebook/lama** (trex) | Wikidata-факты, структурированные предложения | LAMA-формат (уже есть) | ~34k |
| **rubenroy/GammaCorpus-Fact-QA-450k** | 450k пар вопрос–ответ по фактам | question + answer | 450k |
| **squad** | Вопросы + контекст + ответы | `["context","answers"]` или `["question","context"]` | 87k |
| **vaqa/rag-qa** | QA для RAG, много категорий | question/context/answer | 40k |

### Уровень 2 — Рассуждения и цепочки мыслей

| Датасет | Описание | Колонка | Размер |
|--------|----------|---------|--------|
| **openai/gsm8k** | Математика, пошаговые решения | `answer` или `question` + `answer` | 8.5k |
| **thesven/gsm8k-reasoning** | GSM8K с chain-of-thought | reasoning + answer | 8.5k |
| **allenai/arc** | Научные вопросы (ARC-Challenge) | question + choices + answerKey | 2.5k |

### Уровень 3 — Широкий текст и веб

| Датасет | Описание | Колонка | Размер |
|--------|----------|---------|--------|
| **HuggingFaceFW/fineweb** | Веб-текст, уже в config | text | streaming |
| **wikipedia** (через API) | Статьи по темам | — | по запросу |

### Уровень 4 — Мультидокумент и сложные вопросы

| Датасет | Описание | Зачем |
|--------|----------|-------|
| **allenai/MoNaCo_Benchmark** | Вопросы по 43+ документам | Сложный retrieval |
| **google/frames-benchmark** | Multi-hop по Wikipedia | Рассуждения |

---

## Стратегия «умнее всех»

### 1. Качество важнее объёма

- Сначала: **LAMA trex** + **squad** + **Wikipedia** (20–50 статей).
- Потом: **GammaCorpus-Fact-QA-450k** (выборочно, limit 50k–100k).
- Избегать: мусорный веб, дубликаты, низкокачественный текст.

### 2. Связные чанки

- Хранить **целые предложения и абзацы**, а не обрывки.
- Для QA: `"Q: {question}\nA: {answer}"` или `"Context: {context}\nQ: {question}\nA: {answer}"`.
- Для reasoning: `"Problem: {question}\nSolution: {answer}"` (с пошаговым решением).

### 3. Многоуровневое обучение

```
Фаза 1: Факты (LAMA, Wikipedia) — база
Фаза 2: QA (squad, GammaCorpus) — ответы на вопросы
Фаза 3: Reasoning (GSM8K, ARC) — рассуждения
Фаза 4: Широкий текст (FineWeb) — общая эрудиция
```

### 4. Адаптация gpt-4o-distil (опционально)

Если нужен «стиль» GPT-4o:

- Извлечь из `prompt` user content и из `chosen` assistant content.
- Сформировать чанки: `"User: {prompt}\nAssistant: {chosen}"`.
- Добавить в `train_textnet.py` парсер для DPO-формата или предобработку в JSONL.

---

## Команды для быстрого старта

```powershell
cd services\harvesters

# 1. Факты (LAMA)
python train_textnet.py --lama trex --limit 5000 --batch 8

# 2. QA (SQuAD) — question + context
python train_textnet.py --hf-dataset squad --hf-split train --limit 5000 --batch 8
# В datasets_config.yaml: text_from: [context, question] или [question, answers]

# 3. Wikipedia
python train_textnet.py --level 1 --limit 30

# 4. Широкий текст (осторожно с лимитом)
python train_textnet.py --hf-dataset HuggingFaceFW/fineweb --hf-column text --limit 10000 --streaming --batch 8
```

---

## Что добавить в datasets_config.yaml

```yaml
sources:
  # Факты
  - type: huggingface
    name: facebook/lama
    config: trex
    # через --lama trex, не через config

  # QA — полный контекст
  - type: huggingface
    name: squad
    split: train
    text_from: [context, question]  # или [question, answers] — зависит от цели
    limit: 20000

  # Фактуальные QA (450k)
  - type: huggingface
    name: rubenroy/GammaCorpus-Fact-QA-450k
    split: train
    text_from: [question, answer]
    limit: 50000

  # Reasoning
  - type: huggingface
    name: openai/gsm8k
    config: main
    split: train
    text_from: [question, answer]
    limit: 5000
```

---

## Итог

| Цель | Действие |
|------|----------|
| **Быстрый старт** | LAMA trex + squad + Wikipedia |
| **Максимум фактов** | GammaCorpus-Fact-QA-450k (limit 50k+) |
| **Рассуждения** | GSM8K, ARC |
| **Стиль GPT-4o** | Адаптировать gpt-4o-distil (prompt+chosen) |
| **Умнее всех** | Многоуровневая стратегия + качественные источники + связные чанки |

OMEGA сильна за счёт **качества recall**, а не размера модели. Лучше меньше, но точных и разнообразных знаний, чем много шума.
