"""
Полный тест: HTTP -> harvest -> encode -> AI Engine.
Запуск: cd services/harvesters && python test_full_flow.py
"""
import asyncio
import os
import sys

# Load env
from dotenv import load_dotenv
load_dotenv()

async def main():
    from config import AI_ENGINE_URL, AI_ENGINE_API_KEY
    import httpx

    from config import USER_AGENT
    print("1. Testing HTTP to Wikipedia...")
    async with httpx.AsyncClient(timeout=30, headers={"User-Agent": USER_AGENT}) as c:
        r = await c.get("https://en.wikipedia.org/wiki/Artificial_intelligence")
        print(f"   Status: {r.status_code}, Length: {len(r.text)}")
        if r.status_code != 200:
            print("   FAIL: Wikipedia returned non-200")
            return

    print("2. Testing AI Engine /learn...")
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post(
                f"{AI_ENGINE_URL}/learn",
                json={
                    "type": "text",
                    "key": "test123",
                    "data": [0.1] * 896,
                    "source": "test",
                    "raw": "test content",
                },
                headers={"x-api-key": AI_ENGINE_API_KEY},
            )
            print(f"   Status: {r.status_code}, Response: {r.text[:100]}")
            if r.status_code != 200:
                print("   FAIL: AI Engine rejected the request")
                return
    except Exception as e:
        print(f"   FAIL: {e}")
        return

    print("3. Running harvest (with real encode - may take 1-2 min for first run)...")
    from unittest.mock import MagicMock
    sys.modules["supabase"] = MagicMock()
    from harvesters.web_harvester import WebHarvester

    mock_sb = MagicMock()
    harvester = WebHarvester(mock_sb)
    count = 0
    try:
        async for item in harvester.harvest("https://en.wikipedia.org/wiki/Artificial_intelligence"):
            count += 1
            if count <= 2:
                print(f"   Item {count}: key={item.key[:8]}..., quality={item.quality:.2f}")
    except Exception as e:
        print(f"   FAIL: {e}")
    finally:
        await harvester.close()

    print(f"\n=== Total items: {count} ===")


if __name__ == "__main__":
    asyncio.run(main())
