# API Reference

## AI Engine API (port 4000)

All requests require the header: `x-api-key: <AI_ENGINE_API_KEY>`

---

### `GET /health`
```json
{ "ok": true, "ready": true }
```

---

### `GET /status`
Returns full MirrorAI status including all 5 networks and Omega state.

```json
{
  "version": "1.0.0",
  "ready": true,
  "omega": {
    "id": "omega",
    "activeNetworks": ["text", "image", "video", "audio", "game"],
    "totalQueries": 1234,
    "avgConfidence": 0.87,
    "avgIterations": 2.4,
    "convergeRate": 0.94
  },
  "networks": {
    "text": { "id": "textnet", "type": "text", "clusters": 3, "totalNeurons": 12288, "totalKnowledge": 5000 }
  },
  "uptime": 86400000,
  "totalQueries": 1234
}
```

---

### `POST /query`
Run inference through a specific network.

**Request:**
```json
{
  "type": "text",
  "input": "What is quantum entanglement?",
  "context": { "language": "en" }
}
```

**Response (OmegaTruth):**
```json
{
  "answer": "[TEXT] magnitude=0.7231 query=\"What is quantum entanglement?\"",
  "answerVector": [0.1, 0.8, ...],
  "confidence": 0.87,
  "converged": true,
  "iterations": 3,
  "participatingLi": ["textnet_C0_Li1", "textnet_C0_Li2", "textnet_C1_Li1", "textnet_C1_Li2"],
  "mirrorAgreement": 0.91,
  "networkType": "text",
  "timestamp": 1714000000000,
  "processingMs": 142
}
```

**Network types:**
- `"text"` — input: string
- `"image"` — input: `{ data: string (base64), task: "classify"|"describe"|"detect" }`
- `"video"` — input: `{ frames?: string[], url?: string, task: "understand"|"caption" }`
- `"audio"` — input: `{ data?: string (base64), url?: string, task: "transcribe"|"classify"|"detect-emotion" }`
- `"game"` — input: GameState object (see types)

---

### `POST /learn`
Feed training data to a specific network.

**Request:**
```json
{
  "type": "text",
  "key": "article_abc123",
  "data": [0.1, 0.8, 0.3, ...],
  "source": "https://example.com/article"
}
```

**Response:**
```json
{ "ok": true }
```

---

### `POST /consolidate`
Run memory consolidation across all networks (prune weak knowledge).

**Response:**
```json
{
  "ok": true,
  "pruned": { "text": 42, "image": 17, "video": 3, "audio": 8, "game": 1 }
}
```

---

## Harvester API (port 8000)

---

### `GET /health`
```json
{ "ok": true, "workers": 4 }
```

---

### `POST /harvest`
Start a harvest job.

**Request:**
```json
{
  "source_url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
  "network_type": "text"
}
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Harvest job 550e... queued"
}
```

---

### `GET /jobs/{job_id}`
Check job status.

```json
{
  "id": "550e...",
  "type": "text",
  "source_url": "https://...",
  "status": "completed",
  "items_collected": 247,
  "error": null,
  "started_at": "2024-01-01T12:00:00Z",
  "completed_at": "2024-01-01T12:01:30Z"
}
```

---

## Next.js API Routes

### `POST /api/query`
Authenticated wrapper around AI Engine `/query`. Requires Supabase session.
Automatically saves query to `omega_queries` table.

Same request/response as AI Engine `/query`.

### `POST /api/admin/harvest`
Launches a harvester job (admin only).

### `POST /api/admin/params`
Saves training parameter overrides to `network_configs` table.
