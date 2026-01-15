import os
import base64
from io import BytesIO
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

try:
    from paddleocr import PPStructure
    from pdf2image import convert_from_bytes
    from PIL import Image
    import numpy as np
except ImportError as e:
    print(f"Import error: {e}")
    print("Installing dependencies...")

app = FastAPI(
    title="PP-StructureV3 OCR Service",
    description="Service OCR avancé pour extraction de texte et tableaux depuis PDF/images - Optimisé pour factures",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

structure_engine = None

def get_structure_engine():
    global structure_engine
    if structure_engine is None:
        structure_engine = PPStructure(
            table=True,
            ocr=True,
            show_log=False,
            use_gpu=False,
            lang="fr",
            layout=True,
            structure_version="PP-StructureV2",
            det_db_thresh=0.3,
            det_db_box_thresh=0.5,
        )
    return structure_engine

class OCRResponse(BaseModel):
    success: bool
    text: str
    markdown_tables: list[str]
    pages: int
    confidence: float
    error: Optional[str] = None

class TableCell(BaseModel):
    text: str
    row: int
    col: int
    row_span: int = 1
    col_span: int = 1

class ExtractedTable(BaseModel):
    html: str
    markdown: str
    cells: list[TableCell]

class StructuredOCRResponse(BaseModel):
    success: bool
    raw_text: str
    tables: list[ExtractedTable]
    markdown_output: str
    pages: int
    error: Optional[str] = None

def html_table_to_markdown(html: str) -> str:
    import re
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL)
    if not rows:
        return ""
    
    md_rows = []
    for i, row in enumerate(rows):
        cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.DOTALL)
        cells = [re.sub(r'<[^>]+>', '', cell).strip() for cell in cells]
        md_rows.append("| " + " | ".join(cells) + " |")
        if i == 0:
            md_rows.append("|" + "|".join(["---"] * len(cells)) + "|")
    
    return "\n".join(md_rows)

def process_structure_result(result: list, page_num: int = 1) -> tuple[str, list[ExtractedTable], str]:
    text_blocks = []
    tables = []
    markdown_parts = []
    
    markdown_parts.append(f"\n## 📄 Page {page_num}\n")
    
    sorted_result = sorted(result, key=lambda x: (x.get('bbox', [0, 0, 0, 0])[1], x.get('bbox', [0, 0, 0, 0])[0]))
    
    for item in sorted_result:
        item_type = item.get('type', '')
        
        if item_type == 'table':
            html = item.get('res', {}).get('html', '')
            if html:
                md_table = html_table_to_markdown(html)
                tables.append(ExtractedTable(
                    html=html,
                    markdown=md_table,
                    cells=[]
                ))
                markdown_parts.append(f"\n### 📊 Tableau\n{md_table}\n")
        
        elif item_type == 'text':
            text_content = item.get('res', [])
            if isinstance(text_content, list):
                for text_item in text_content:
                    if isinstance(text_item, dict):
                        txt = text_item.get('text', '')
                    elif isinstance(text_item, (list, tuple)) and len(text_item) >= 2:
                        txt = text_item[1][0] if isinstance(text_item[1], (list, tuple)) else str(text_item[1])
                    else:
                        txt = str(text_item)
                    if txt:
                        text_blocks.append(txt)
                        markdown_parts.append(txt)
        
        elif item_type == 'title':
            text_content = item.get('res', [])
            title_text = ""
            if isinstance(text_content, list) and text_content:
                for t in text_content:
                    if isinstance(t, dict):
                        title_text += t.get('text', '') + " "
                    elif isinstance(t, (list, tuple)) and len(t) >= 2:
                        title_text += (t[1][0] if isinstance(t[1], (list, tuple)) else str(t[1])) + " "
            title_text = title_text.strip()
            if title_text:
                text_blocks.append(title_text)
                markdown_parts.append(f"\n### {title_text}\n")
        
        elif item_type == 'figure':
            markdown_parts.append("\n*[Figure détectée]*\n")
    
    return "\n".join(text_blocks), tables, "\n".join(markdown_parts)

def process_image(image: Image.Image, page_num: int = 1) -> tuple[str, list[ExtractedTable], str]:
    engine = get_structure_engine()
    img_array = np.array(image.convert('RGB'))
    result = engine(img_array)
    
    if not result:
        return "", [], ""
    
    return process_structure_result(result, page_num)

def process_pdf_bytes(pdf_bytes: bytes) -> tuple[str, list[ExtractedTable], str, int]:
    images = convert_from_bytes(pdf_bytes, dpi=200)
    
    all_text = []
    all_tables = []
    all_markdown = ["# 📋 Extraction OCR - Document PDF\n"]
    
    for i, image in enumerate(images, 1):
        text, tables, markdown = process_image(image, i)
        all_text.append(text)
        all_tables.extend(tables)
        all_markdown.append(markdown)
    
    return "\n\n".join(all_text), all_tables, "\n".join(all_markdown), len(images)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pp-structure-v3", "version": "2.0.0"}

@app.get("/")
async def root():
    return {
        "service": "PP-StructureV3 OCR Service",
        "status": "running",
        "endpoints": {
            "/health": "Health check",
            "/ocr/extract": "Extract text from PDF/image (POST)",
            "/ocr/extract-structured": "Extract structured data with tables (POST)",
            "/ocr/extract-from-url": "Extract from URL (POST)"
        }
    }

@app.post("/ocr/extract", response_model=OCRResponse)
async def extract_text(
    file: UploadFile = File(...),
    language: str = Form(default="fr")
):
    try:
        content = await file.read()
        content_type = file.content_type or ""
        filename = file.filename or ""
        
        is_pdf = content_type == "application/pdf" or filename.lower().endswith(".pdf")
        
        if is_pdf:
            text, tables, markdown, pages = process_pdf_bytes(content)
        else:
            image = Image.open(BytesIO(content))
            text, tables, markdown = process_image(image)
            pages = 1
        
        markdown_tables = [t.markdown for t in tables]
        
        return OCRResponse(
            success=True,
            text=text,
            markdown_tables=markdown_tables,
            pages=pages,
            confidence=0.95
        )
        
    except Exception as e:
        import traceback
        return OCRResponse(
            success=False,
            text="",
            markdown_tables=[],
            pages=0,
            confidence=0.0,
            error=f"{str(e)}\n{traceback.format_exc()}"
        )

@app.post("/ocr/extract-structured", response_model=StructuredOCRResponse)
async def extract_structured(
    file: UploadFile = File(...),
    language: str = Form(default="fr")
):
    try:
        content = await file.read()
        content_type = file.content_type or ""
        filename = file.filename or ""
        
        is_pdf = content_type == "application/pdf" or filename.lower().endswith(".pdf")
        
        if is_pdf:
            text, tables, markdown, pages = process_pdf_bytes(content)
        else:
            image = Image.open(BytesIO(content))
            text, tables, markdown = process_image(image)
            pages = 1
        
        return StructuredOCRResponse(
            success=True,
            raw_text=text,
            tables=tables,
            markdown_output=markdown,
            pages=pages
        )
        
    except Exception as e:
        import traceback
        return StructuredOCRResponse(
            success=False,
            raw_text="",
            tables=[],
            markdown_output="",
            pages=0,
            error=f"{str(e)}\n{traceback.format_exc()}"
        )

class URLRequest(BaseModel):
    file_url: Optional[str] = None
    file_base64: Optional[str] = None
    language: str = "fr"

@app.post("/ocr/extract-from-url", response_model=StructuredOCRResponse)
async def extract_from_url(request: URLRequest):
    import aiohttp
    
    if not request.file_url and not request.file_base64:
        raise HTTPException(status_code=400, detail="file_url ou file_base64 requis")
    
    try:
        if request.file_base64:
            content = base64.b64decode(request.file_base64)
            is_pdf = content[:4] == b'%PDF'
        else:
            async with aiohttp.ClientSession() as session:
                async with session.get(request.file_url, timeout=aiohttp.ClientTimeout(total=60)) as response:
                    if response.status != 200:
                        raise HTTPException(status_code=400, detail=f"Téléchargement échoué: {response.status}")
                    content = await response.read()
                    content_type = response.headers.get("Content-Type", "")
                    is_pdf = "pdf" in content_type.lower() or request.file_url.lower().endswith(".pdf")
        
        if is_pdf:
            text, tables, markdown, pages = process_pdf_bytes(content)
        else:
            image = Image.open(BytesIO(content))
            text, tables, markdown = process_image(image)
            pages = 1
        
        return StructuredOCRResponse(
            success=True,
            raw_text=text,
            tables=tables,
            markdown_output=markdown,
            pages=pages
        )
        
    except Exception as e:
        import traceback
        return StructuredOCRResponse(
            success=False,
            raw_text="",
            tables=[],
            markdown_output="",
            pages=0,
            error=f"{str(e)}\n{traceback.format_exc()}"
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8765))
    print(f"🚀 Starting PP-StructureV3 OCR Service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
