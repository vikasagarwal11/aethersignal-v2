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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.api import (
    signals,
    files,
    sessions,
    ai_query,
    upload_duplicate_detection,
    similar_cases_api,
    intelligent_ingest_api,
    signal_detection_api,
    quantum_fusion_api,
)
app.include_router(signals.router)
app.include_router(files.router)
app.include_router(sessions.router)   # Session management
app.include_router(ai_query.router)   # Natural language queries
app.include_router(upload_duplicate_detection.router)  # Upload & duplicate detection
app.include_router(similar_cases_api.router)  # Similar cases finder
app.include_router(intelligent_ingest_api.router)  # Phase 3: Intelligent data ingestion
app.include_router(signal_detection_api.router, prefix="/api/v1")  # Phase 3.5+3.6: Unified signal detection
app.include_router(quantum_fusion_api.router, prefix="/api/v1")  # Quantum-Bayesian fusion detection

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
            "methods": ["PRR", "ROR", "IC", "MGPS", "EBGM", "WHO-UMC", "Naranjo", "Temporal", "Quantum Fusion"],
            "quantum_enhanced": True
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

