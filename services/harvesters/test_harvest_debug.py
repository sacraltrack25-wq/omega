"""
Отладочный скрипт: проверить что собирает WebHarvester с Wikipedia.
Запуск: cd services/harvesters && python test_harvest_debug.py
Сохраняет все данные в harvest_debug_output.json для просмотра.
"""
import asyncio
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock

# Mock Supabase чтобы не подключаться к БД
sys.modules["supabase"] = MagicMock()

from config import DATA_QUALITY_THRESHOLD
from harvesters.web_harvester import WebHarvester


async def main():
    url = "https://en.wikipedia.org/wiki/Artificial_intelligence"
    print(f"Testing WebHarvester on: {url}\n")
    print(f"DATA_QUALITY_THRESHOLD = {DATA_QUALITY_THRESHOLD} (items with quality < this are SKIPPED in run())\n")

    # Mock supabase client
    mock_supabase = MagicMock()
    harvester = WebHarvester(mock_supabase)

    # Mock encode to skip loading sentence-transformers (fast test)
    harvester.encode = AsyncMock(return_value=[0.1] * 896)

    count = 0
    passed_threshold = 0
    samples = []
    all_items = []

    async for item in harvester.harvest(url):
        count += 1
        if item.quality >= DATA_QUALITY_THRESHOLD:
            passed_threshold += 1
        if len(samples) < 3:
            samples.append({
                "key": item.key,
                "quality": round(item.quality, 3),
                "passes": item.quality >= DATA_QUALITY_THRESHOLD,
                "raw_preview": (item.raw or "")[:200] + "...",
            })
        all_items.append({
            "key": item.key,
            "quality": round(item.quality, 3),
            "raw": item.raw or "",
            "source": item.source,
        })

    await harvester.close()

    # Сохраняем в файл для просмотра
    out_path = Path(__file__).parent / "harvest_debug_output.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"url": url, "total": count, "passed_threshold": passed_threshold, "items": all_items}, f, ensure_ascii=False, indent=2)
    print(f"Все данные сохранены в: {out_path}\n")

    print(f"=== RESULTS ===")
    print(f"Items yielded by harvest(): {count}")
    print(f"Items that PASS quality >= {DATA_QUALITY_THRESHOLD}: {passed_threshold}")
    print(f"Items that would be SKIPPED: {count - passed_threshold}")
    print()
    if samples:
        print("Sample items:")
        for i, s in enumerate(samples, 1):
            print(f"  {i}. quality={s['quality']}, passes={s['passes']}")
            print(f"     raw: {s['raw_preview']}")
            print()


if __name__ == "__main__":
    asyncio.run(main())
