from fastapi import APIRouter, Response, HTTPException
from pydantic import BaseModel
from typing import List
from app.models.stock import StockInfo
from app.models.news import NewsArticle
from app.services.pdf_service import generate_pdf_report

router = APIRouter()

class PDFExportRequest(BaseModel):
    info: StockInfo
    analysis: dict
    articles: List[NewsArticle]

@router.post("/{ticker}/pdf", response_class=Response)
async def export_pdf(ticker: str, request: PDFExportRequest):
    try:
        # Generate PDF using the data sent from the frontend state
        pdf_bytes = generate_pdf_report(request.info, request.analysis, request.articles[:20]) # Limit to 20

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={request.info.ticker}_report.pdf"
            }
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
