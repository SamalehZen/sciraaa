import asyncio
import aiohttp
import re
from typing import List, Optional, Union
from fastapi import FastAPI
from pydantic import BaseModel

TOTAL_CONTEXT_CAP = 200 * 1024  # 200KB
EXCERPT_CAP = 50 * 1024         # 50KB
WEB_TEXT_CAP = 50 * 1024        # 50KB
CONCURRENCY = 5


def sanitize(text: str) -> str:
    patterns = [
        re.compile(r"ignore\s+system\s+prompt", re.I),
        re.compile(r"ignore\s+previous\s+instructions", re.I),
        re.compile(r"disregard\s+all\s+above", re.I),
    ]
    out = text
    for p in patterns:
        out = p.sub('[redacted]', out)
    return out


class FileMeta(BaseModel):
    title: str
    blobUrl: str
    sizeBytes: Optional[int] = None


class KnowledgeRequest(BaseModel):
    files: List[FileMeta]
    capBytes: int = TOTAL_CONTEXT_CAP
    timeoutMs: int = 2000


class KnowledgeResponse(BaseModel):
    excerpt: str
    totalBytes: int
    nbTimeouts: int
    nbFiles: int
    capped: bool


class WebEnrichRequest(BaseModel):
    url: str
    timeoutMs: int = 1000
    maxBytes: int = WEB_TEXT_CAP


class WebEnrichValue(BaseModel):
    url: str
    title: Optional[str] = None
    excerpt: Optional[str] = None


class WebEnrichResponse(BaseModel):
    value: Optional[WebEnrichValue]
    timedOut: bool = False


app = FastAPI()


async def fetch_text(session: aiohttp.ClientSession, url: str, timeout_ms: int) -> str:
    timeout = aiohttp.ClientTimeout(total=timeout_ms / 1000)
    async with session.get(url, timeout=timeout, allow_redirects=True) as resp:
        if resp.status >= 400:
            raise aiohttp.ClientError(f"HTTP {resp.status}")
        return await resp.text()


@app.post("/v1/knowledge/excerpt", response_model=KnowledgeResponse)
async def knowledge_excerpt(req: KnowledgeRequest):
    sem = asyncio.Semaphore(CONCURRENCY)
    consumed = 0
    nb_timeouts = 0
    results: List[Optional[str]] = [None] * len(req.files)
    lock = asyncio.Lock()
    stopped = False

    async def worker(idx: int, f: FileMeta, session: aiohttp.ClientSession):
        nonlocal consumed, nb_timeouts, stopped
        if not f.blobUrl:
            return
        async with sem:
            async with lock:
                if stopped or consumed >= req.capBytes:
                    stopped = True
                    return
            try:
                text = await fetch_text(session, f.blobUrl, req.timeoutMs)
            except asyncio.TimeoutError:
                async with lock:
                    nb_timeouts += 1
                return
            except Exception:
                return

            cleaned = sanitize(text)
            async with lock:
                if stopped or consumed >= req.capBytes:
                    stopped = True
                    return
                remaining = max(0, req.capBytes - consumed)
                chunk = cleaned[:remaining]
                added = len(chunk.encode('utf-8'))
                consumed += added
                if chunk:
                    header = f"\n\n# File: {f.title} ({f.sizeBytes or 'unknown'} bytes)\n"
                    results[idx] = header + chunk
                if consumed >= req.capBytes:
                    stopped = True

    async with aiohttp.ClientSession() as session:
        tasks = [worker(i, f, session) for i, f in enumerate(req.files)]
        await asyncio.gather(*tasks)

    ordered = [r for r in results if r]
    excerpt = "".join(ordered).strip()
    return KnowledgeResponse(
        excerpt=excerpt,
        totalBytes=consumed,
        nbTimeouts=nb_timeouts,
        nbFiles=len(ordered),
        capped=consumed >= req.capBytes,
    )


@app.post("/v1/web/summarize", response_model=WebEnrichResponse)
async def web_summarize(req: WebEnrichRequest):
    try:
        async with aiohttp.ClientSession() as session:
            text = await fetch_text(session, req.url, req.timeoutMs)
            # Try quick HTML title extraction
            m = re.search(r"<title[^>]*>([^<]*)</title>", text, re.I)
            title = m.group(1).strip() if m else None
            # Strip HTML
            body = re.sub(r"<script[^>]*>[\s\S]*?</script>", " ", text, flags=re.I)
            body = re.sub(r"<style[^>]*>[\s\S]*?</style>", " ", body, flags=re.I)
            body = re.sub(r"<[^>]+>", " ", body)
            body = re.sub(r"\s+", " ", body).strip()
            excerpt = body[: req.maxBytes]
            return WebEnrichResponse(value=WebEnrichValue(url=req.url, title=title, excerpt=excerpt), timedOut=False)
    except asyncio.TimeoutError:
        return WebEnrichResponse(value=None, timedOut=True)
    except Exception:
        return WebEnrichResponse(value=None, timedOut=False)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
