"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, Zap, Network, Database, Server, Cloud,
  CheckCircle, AlertCircle, ChevronDown, ChevronRight,
  Terminal, Globe, Cpu, HardDrive, GitBranch, Play
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Collapsible section ────────────────────────────────────────────────────────
function Section({
  icon: Icon, title, color = "text-accent", children, defaultOpen = false,
}: {
  icon: React.ElementType; title: string; color?: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="omega-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-bg-hover transition-colors text-left"
      >
        <Icon className={cn("w-4 h-4 flex-shrink-0", color)} />
        <span className="font-semibold text-sm flex-1">{title}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-text-muted" />
          : <ChevronRight className="w-4 h-4 text-text-muted" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">{children}</div>}
    </div>
  );
}

function Badge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono",
      ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
    )}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code className="block bg-bg-primary border border-border rounded px-3 py-2 text-xs font-mono text-text-secondary whitespace-pre">
      {children}
    </code>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text-secondary leading-relaxed">{children}</p>;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GuidePage() {
  const [status, setStatus] = useState<{ core?: Record<string, unknown>; encoder?: { ok: boolean } } | null>(null);
  const [harvesterOk, setHarvesterOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/status")
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setStatus(data));
    fetch("/api/admin/harvesters/health")
      .then(r => r.ok && r.json().then(d => d.ok))
      .then(ok => setHarvesterOk(ok ?? false))
      .catch(() => setHarvesterOk(false));
  }, []);

  const coreOk = !status?.core?.error;
  const encoderOk = status?.encoder?.ok ?? false;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-bold">Инструкция по OMEGA AI</h1>
        </div>
        <p className="text-text-secondary text-sm">Как работает система, что подключено, и что делать дальше</p>
      </div>

      {/* Status bar — live */}
      <div className="omega-card p-4 flex flex-wrap gap-3 items-center">
        <span className="text-xs text-text-muted font-mono mr-1">Статус:</span>
        <Badge label="Next.js · работает" ok={true} />
        <Badge label="AI Engine" ok={coreOk} />
        <Badge label="Encoder Service (5001)" ok={encoderOk} />
        <Badge label="Harvesters (8000)" ok={harvesterOk ?? false} />
        <Badge label="Supabase · настроен" ok={true} />
      </div>

      {/* Section 1 — How it works */}
      <Section icon={Zap} title="Как работает OMEGA AI" defaultOpen={true}>
        <P>
          OMEGA основан на <strong className="text-text-primary">Зеркальном Принципе</strong>: каждый элемент существует
          в двух зеркальных копиях, которые обрабатывают одни данные с противоположных позиций и приходят к консенсусу.
        </P>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {[
            { icon: Network, label: "gX Нейроны", color: "text-accent",  desc: "1 бит = 1 нейрон. const gX1 ↔ const gX2. Никогда не меняются. Встроенная коррекция ошибок." },
            { icon: Cpu,     label: "Li Центры",   color: "text-info",   desc: "let Li1 ↔ let Li2. Обрабатывают данные параллельно. Растут автоматически при обучении." },
            { icon: Zap,     label: "Ω Omega",     color: "text-success", desc: "Центр истины. Собирает выходы всех Li, повторяет Ω(Ω(x)) до стабилизации → const ответ." },
          ].map(({ icon: Icon, label, color, desc }) => (
            <div key={label} className="bg-bg-primary rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", color)} />
                <span className="text-sm font-semibold">{label}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <P>
          5 нейросетей: <strong className="text-text-primary">TextNet · ImageNet · VideoNet · AudioNet · GameNet</strong> —
          каждая со своими Li-кластерами и собственным encoder/decoder.
        </P>
      </Section>

      {/* Section 2 — How to use without Docker/RunPod */}
      <Section icon={Play} title="Как пользоваться прямо сейчас (без Docker и RunPod)" defaultOpen={true} color="text-success">
        <P>Система полностью работает без Docker и RunPod — всё запускается на обычном Node.js.</P>
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">Шаг 1 — Запустить AI Engine (core)</p>
          <Code>{`cd C:\\Users\\Admin\\Desktop\\Cee
pnpm --filter @omega/core start`}</Code>
          <p className="text-xs text-text-secondary">→ Запускается на <strong>http://localhost:4000</strong></p>

          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mt-3">Шаг 2 — Запустить веб-интерфейс</p>
          <Code>{`pnpm --filter @omega/web start -- -p 3001`}</Code>
          <p className="text-xs text-text-secondary">→ Открыть <strong>http://localhost:3001</strong></p>

          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mt-3">Шаг 3 — Открыть Admin Panel</p>
          <Code>{`http://localhost:3001/admin`}</Code>
          <p className="text-xs text-text-secondary">
            ADMIN_BYPASS=true в .env.local — авторизация отключена. Все настройки, статистика и параметры обучения доступны сразу.
          </p>
        </div>
      </Section>

      {/* Encoder Service */}
      <Section icon={Server} title="Encoder Service — семантический поиск" color="text-info">
        <P>
          Encoder Service (порт 5001) — единая точка энкодирования для core. Преобразует text, image, video, audio
          в векторы для семантического поиска в Li центрах.
        </P>
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">Запуск</p>
          <Code>{`cd C:\\Users\\Admin\\Desktop\\Cee\\services\\harvesters
uvicorn encoder_service:app --port 5001`}</Code>
          <P>
            Endpoints: <code className="text-accent text-xs">/encode</code> (text), <code className="text-accent text-xs">/encode-clip-text</code>, <code className="text-accent text-xs">/encode-clip-image</code>,
            <code className="text-accent text-xs"> /encode-clap-text</code>, <code className="text-accent text-xs">/encode-clap-audio</code>, <code className="text-accent text-xs">/transcribe</code>, <code className="text-accent text-xs">/caption-image</code>.
          </P>
        </div>
      </Section>

      {/* Section 3 — Admin panel guide */}
      <Section icon={Server} title="Что делать в Admin Panel" color="text-info">
        <div className="space-y-4">
          {[
            {
              href: "/admin",
              label: "Overview",
              desc: "Статистика системы: запросы, уверенность Omega, активные тренировки и харвесторы. Обновляется в реальном времени из Supabase."
            },
            {
              href: "/admin/neurons",
              label: "Neurons",
              desc: "Визуализация gX нейронов и Li центров для каждой из 5 сетей. Показывает количество слоёв, нейронов, базу знаний и среднюю резонансность."
            },
            {
              href: "/admin/training",
              label: "Training",
              desc: "35 параметров обучения: скорость обучения, глубина слоёв, пороги конвергенции Omega, параметры зеркального принципа. Изменяются на лету через API."
            },
            {
              href: "/admin/stats",
              label: "Statistics",
              desc: "История сессий обучения и метрики по каждой сети. Графики через Recharts."
            },
            {
              href: "/admin/harvesters",
              label: "Harvesters",
              desc: "Запуск Python-скриптов сбора данных (web, image, audio, video). Данные попадают в Li.learn() и расширяют базу знаний AI."
            },
          ].map(({ href, label, desc }) => (
            <div key={href} className="flex gap-3">
              <a href={href} className="text-accent text-xs font-mono hover:underline whitespace-nowrap pt-0.5">{href}</a>
              <div>
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Section — TextNet training */}
      <Section icon={Cpu} title="Как обучить TextNet — пошаговая инструкция" defaultOpen={true} color="text-success">
        <div className="bg-bg-primary border border-success/20 rounded-lg p-3 mb-3">
          <p className="text-xs text-success font-semibold mb-1">Реалистичное сравнение с Google AI</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Google Gemini обучен на петабайтах данных с сотнями миллиардов параметров трансформерной архитектуры.
            OMEGA использует другой подход: <strong className="text-text-primary">зеркальный принцип gX·Li·Ω</strong> — это не LLM,
            это pattern-resonance система. Она может быть лучше Google в <strong className="text-text-primary">узкой специализированной нише</strong>
            (конкретная область науки, бизнеса, игр), если правильно обучить на качественных данных этой ниши.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-1">Шаг 1 — Установить Python зависимости</p>
            <Code>{`cd C:\\Users\\Admin\\Desktop\\Cee\\services\\harvesters
pip install -r requirements.txt`}</Code>
            <p className="text-xs text-text-secondary mt-1">
              Ключевое: <code className="text-accent text-xs">sentence-transformers</code> — скачает модель
              <code className="text-accent text-xs"> all-MiniLM-L6-v2</code> (~80MB).
              Она заменяет примитивный n-gram хэшинг на <strong className="text-text-primary">384-мерные семантические векторы</strong> —
              слова с похожим смыслом (cat ≈ feline) будут рядом в пространстве.
            </p>
          </div>

          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-1">Шаг 2 — Убедиться что AI Engine запущен</p>
            <Code>{`pnpm --filter @omega/core start   # port 4000`}</Code>
          </div>

          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-1">Шаг 3 — Запустить обучение</p>
            <div className="space-y-2">
              <Code>{`# Быстрый старт — Wikipedia (40 тем, EN+RU, ~15 мин)
python train_textnet.py --level 1`}</Code>

              <Code>{`# Расширенный — Wikipedia + качественные сайты (~1 час)
python train_textnet.py --level 2`}</Code>

              <Code>{`# Полный — всё + AI research papers (~2 часа)
python train_textnet.py --level 3`}</Code>

              <Code>{`# Обучить на конкретной теме
python train_textnet.py --topic "Quantum mechanics"
python train_textnet.py --topic "Квантовая механика" --lang ru`}</Code>

              <Code>{`# Обучить на своём сайте или базе знаний
python train_textnet.py --url https://your-knowledge-base.com`}</Code>

              <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mt-3">Hugging Face датасеты</p>
              <Code>{`# Любой датасет по имени
python train_textnet.py --hf-dataset HuggingFaceFW/fineweb --hf-column text --limit 10000 --streaming --batch 8

# С конфигом (несколько источников)
python train_textnet.py --config datasets_config.yaml --batch 8`}</Code>
            </div>
          </div>

          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-1">Шаг 4 — Консолидация памяти (после обучения)</p>
            <Code>{`curl -X POST http://localhost:4000/consolidate ^
  -H "x-api-key: generate-a-strong-random-key"`}</Code>
            <p className="text-xs text-text-secondary mt-1">Очищает слабые паттерны, усиливает сильные. Запускай после каждого большого обучения.</p>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-2">Стратегия "умнее в нише"</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "Медицина", tip: "PubMed, Mayo Clinic, WebMD" },
                { label: "Право",    tip: "КонсультантПлюс, Garant.ru, court decisions" },
                { label: "Финансы",  tip: "SEC filings, Bloomberg, Investopedia" },
                { label: "Наука",    tip: "ArXiv, Nature, Wikipedia + level 3" },
                { label: "Игры",     tip: "Wikis, guides, GameNet (свой движок)" },
                { label: "Бизнес",   tip: "Harvard Business Review, Statista" },
              ].map(({ label, tip }) => (
                <div key={label} className="bg-bg-primary border border-border rounded p-2">
                  <p className="text-xs font-semibold text-text-primary">{label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Section 4 — Docker */}
      <Section icon={HardDrive} title="Docker — как установить и запустить" color="text-warning">
        <P>
          Docker нужен для продакшн-деплоя и изоляции сервисов. Для разработки — необязателен.
        </P>
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">Установка (Windows)</p>
          <P>Скачать <strong className="text-text-primary">Docker Desktop</strong> с <a href="https://www.docker.com/products/docker-desktop" target="_blank" rel="noreferrer" className="text-accent hover:underline">docker.com/products/docker-desktop</a></P>

          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mt-3">Запуск всей системы в Docker</p>
          <Code>{`cd C:\\Users\\Admin\\Desktop\\Cee
docker compose up --build`}</Code>
          <p className="text-xs text-text-secondary">Запустит: веб (3000) + AI Engine (4000) + Harvesters (8000)</p>

          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mt-3">Запуск только AI Engine</p>
          <Code>{`docker compose up ai-engine`}</Code>
        </div>
      </Section>

      {/* Section 5 — RunPod */}
      <Section icon={Cloud} title="RunPod — подключение GPU" color="text-warning">
        <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 mb-3">
          <p className="text-xs text-success flex items-center gap-1">
            <CheckCircle className="w-3 h-3 flex-shrink-0" />
            RunPod API ключ добавлен. Следующий шаг — создать Endpoint и добавить RUNPOD_ENDPOINT_ID.
          </p>
        </div>
        <P>
          RunPod даёт доступ к GPU (A100/H100) по требованию. Нужен для <strong className="text-text-primary">VideoNet</strong> и <strong className="text-text-primary">GameNet</strong> при больших нагрузках.
        </P>
        <div className="space-y-2 mt-3">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">Шаг 1 — Получить API ключ</p>
          <P>Зарегистрируйся на <a href="https://runpod.io" target="_blank" rel="noreferrer" className="text-accent hover:underline">runpod.io</a> → Settings → API Keys → New Key</P>

          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mt-3">Шаг 2 — Добавить в .env.local</p>
          <Code>{`RUNPOD_API_KEY=your_key_here
RUNPOD_ENDPOINT_ID=your_endpoint_id`}</Code>

          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mt-3">Шаг 3 — Задеплоить core на RunPod Pod</p>
          <Code>{`# В RunPod: создай Pod с образом
docker pull your-registry/omega-core:latest

# Или использай RunPod Serverless с Dockerfile из:
# C:\\Users\\Admin\\Desktop\\Cee\\core\\Dockerfile`}</Code>

          <p className="text-xs text-text-secondary">После подключения AI Engine автоматически переключится на GPU-ускоренные вычисления для VideoNet и GameNet.</p>
        </div>
      </Section>

      {/* Multimodal */}
      <Section icon={Zap} title="Multimodal — объединение text/image/video/audio" color="text-success">
        <P>
          В запросах к core можно передать <code className="text-accent text-xs">multimodal: true</code> — тогда Omega
          объединяет ответы из всех сетей (text, image, video, audio) для более полного результата.
        </P>
        <Code>{`POST /query
{ "type": "text", "input": "...", "multimodal": true }`}</Code>
      </Section>

      {/* Section 6 — Harvesters */}
      <Section icon={Globe} title="Харвесторы — обучение на реальных данных" color="text-info">
        <P>
          Харвесторы — Python-сервисы которые собирают данные из интернета и вызывают <code className="text-accent text-xs">Li.learn()</code> через REST API.
        </P>
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">Запуск харвесторов локально</p>
          <Code>{`cd C:\\Users\\Admin\\Desktop\\Cee\\services\\harvesters
pip install -r requirements.txt
uvicorn main:app --port 8000`}</Code>

          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mt-3">Запуск через Admin Panel</p>
          <P>Перейди в <a href="/admin/harvesters" className="text-accent hover:underline">/admin/harvesters</a> → выбери тип (web/image/audio/video) или train_textnet → нажми <strong className="text-text-primary">Launch</strong>.</P>

          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mt-3">Типы харвесторов</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: "WebHarvester",   desc: "Тексты с сайтов → TextNet" },
              { label: "ImageHarvester", desc: "Картинки → ImageNet" },
              { label: "AudioHarvester", desc: "Аудио (yt-dlp) → AudioNet" },
              { label: "VideoHarvester", desc: "Видео → VideoNet" },
              { label: "train_textnet",  desc: "HF, LAMA, Wikipedia, URL — массовое обучение TextNet" },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-bg-primary border border-border rounded p-2">
                <p className="text-xs font-mono text-accent">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Section 7 — Deployment */}
      <Section icon={GitBranch} title="Деплой в продакшн" color="text-success">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-1">Vercel — фронтенд</p>
            <Code>{`# Подключи репозиторий на vercel.com
# Root: apps/web
# Build: pnpm build
# Env: скопируй переменные из .env.local`}</Code>
          </div>
          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-1">Render — AI Engine</p>
            <Code>{`# New Web Service на render.com
# Root: core/
# Build: npm install && npm run build
# Start: node dist/server.js
# Port: 4000`}</Code>
          </div>
          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-1">Перед деплоем — обязательно</p>
            <Code>{`# В .env.local (и на Vercel/Render):
ADMIN_BYPASS=false          # отключить bypass!
NEXTAUTH_URL=https://your-domain.com
AI_ENGINE_URL=https://your-engine.render.com`}</Code>
          </div>
        </div>
      </Section>

      {/* Section 8 — Quick reference */}
      <Section icon={Terminal} title="Шпаргалка — частые команды" color="text-text-secondary">
        <div className="space-y-2">
          {[
            ["Установить зависимости",        "pnpm install"],
            ["Запустить dev режим (всё)",      "pnpm dev"],
            ["Билд core (TypeScript)",         "pnpm --filter @omega/core build"],
            ["Билд web (Next.js)",             "pnpm --filter @omega/web build"],
            ["Запустить core",                 "pnpm --filter @omega/core start"],
            ["Запустить web (prod)",           "pnpm --filter @omega/web start -- -p 3001"],
            ["Проверить типы web",             "pnpm --filter @omega/web type-check"],
            ["Docker: запустить всё",          "docker compose up --build"],
            ["Docker: только AI Engine",       "docker compose up ai-engine"],
          ].map(([label, cmd]) => (
            <div key={cmd} className="flex gap-3 items-baseline">
              <span className="text-xs text-text-muted w-52 flex-shrink-0">{label}</span>
              <code className="text-xs font-mono text-accent">{cmd}</code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
