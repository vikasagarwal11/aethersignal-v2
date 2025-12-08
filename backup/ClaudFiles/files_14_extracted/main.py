"""
AetherSignal V2 - Main Application
AI-Powered Pharmacovigilance Platform with Conversational Interface
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sentry_sdk
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Sentry
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        environment=os.getenv("ENVIRONMENT", "development"),
    )

app = FastAPI(
    title="AetherSignal V2 API",
    description="AI-Powered Pharmacovigilance Platform with Natural Language Interface",
    version="2.0.0",
)

# CORS - Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.api import signals, files, sessions, ai_query

app.include_router(signals.router)    # /api/v1/signals
app.include_router(files.router)      # /api/v1/files
app.include_router(sessions.router)   # /api/v1/sessions (NEW!)
app.include_router(ai_query.router)   # /api/v1/ai (NEW!)


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "AetherSignal V2 - AI Pharmacovigilance Platform",
        "version": "2.0.0",
        "status": "running",
        "features": [
            "File upload and AI extraction",
            "Natural language queries",
            "Session management",
            "Cross-session analytics",
            "ICH E2B validation",
            "Signal detection"
        ],
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0"
    }


@app.get("/api/v1/features")
async def get_features():
    """List available features"""
    return {
        "ai_chat": {
            "enabled": True,
            "description": "Natural language query interface",
            "example_queries": [
                "How many serious events?",
                "Show me Aspirin cases",
                "What's trending?"
            ]
        },
        "sessions": {
            "enabled": True,
            "description": "Track uploads across sessions",
            "features": ["Timeline view", "Cross-session analytics"]
        },
        "file_upload": {
            "enabled": True,
            "formats": ["PDF", "Word", "Excel", "CSV", "XML", "Email", "Images"],
            "ai_extraction": True,
            "ich_e2b_validation": True
        },
        "signal_detection": {
            "enabled": True,
            "methods": ["PRR", "Statistical analysis"],
            "quantum_enhanced": False  # Coming in Delivery 4
        }
    }


if __name__ == "__main__":
    import uvicorn
    import sys
    from pathlib import Path
    
    # Add backend directory to Python path
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    print("=" * 60)
    print("🚀 AetherSignal V2 - AI Pharmacovigilance Platform")
    print("=" * 60)
    print("📊 Features:")
    print("  ✅ File upload with AI extraction")
    print("  ✅ Natural language queries")
    print("  ✅ Session management")
    print("  ✅ Cross-session analytics")
    print("  ✅ ICH E2B validation")
    print("  ✅ Signal detection")
    print()
    print("📡 API Documentation: http://localhost:8000/docs")
    print("🏠 Frontend: http://localhost:3000")
    print("=" * 60)
    print()
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
