import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
import weasyprint
from app.models.stock import StockInfo
from app.models.news import NewsArticle

# Set up Jinja2 environment
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

def format_currency(value):
    if value is None:
        return "N/A"
    
    try:
        val = float(value)
        if val >= 1_000_000_000_000:
            return f"₹{val / 1_000_000_000_000:.2f}T"
        elif val >= 1_000_000_000:
            return f"₹{val / 1_000_000_000:.2f}B"
        elif val >= 1_000_000:
            return f"₹{val / 1_000_000:.2f}M"
        return f"₹{val:,.2f}"
    except (ValueError, TypeError):
        return str(value)

env.globals['format_currency'] = format_currency

def generate_pdf_report(info: StockInfo, analysis: dict, articles: list[NewsArticle]) -> bytes:
    """Generate a PDF report for a given stock, returning bytes."""
    
    template = env.get_template("report.html")
    
    # Render template with variables
    html_content = template.render(
        info=info,
        analysis=analysis,
        articles=articles,
        generated_date=datetime.now().strftime("%B %d, %Y at %I:%M:%S %p")
    )
    
    # Generate PDF
    pdf_file = weasyprint.HTML(string=html_content).write_pdf()
    
    return pdf_file
