# 🧠 RAG API Design Brainstorm: Scalable, Reusable, Extensible

**Date:** 2025-01-21  
**Purpose:** Deep dive into API-first architecture design for maximum reusability

---

## 🎯 **CORE QUESTION: How to Make This API Reusable?**

### **The Vision**

```
┌────────────────────────────────────────────────────────────┐
│                  Universal RAG API Layer                    │
│  (Works for ANY domain: Drug Safety, Clinical Trials, etc.) │
└────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐              ┌───────────────▼────────┐
│  Domain Adapter │              │   Domain Adapter      │
│  Drug Safety    │              │   Clinical Trials     │
└─────────────────┘              └───────────────────────┘
        ↓                                       ↓
┌─────────────────┐              ┌───────────────────────┐
│  Your Current   │              │   Future Projects     │
│  AetherSignal   │              │   (Easy to add)       │
└─────────────────┘              └───────────────────────┘
```

---

## 🏗️ **ARCHITECTURE OPTIONS**

### **Option A: Universal RAG API (Most Scalable)** ⭐ **RECOMMENDED**

**Design:** Single API that handles all domains via adapters

```python
# Core RAG Engine (Domain-Agnostic)
class UniversalRAGEngine:
    def __init__(self):
        self.domains = {}
        self.query_interpreter = QueryInterpreter()
        self.retrieval_engine = RetrievalEngine()
        self.ranking_engine = RankingEngine()
        self.summarization_engine = SummarizationEngine()
    
    def register_domain(self, domain_name: str, adapter: DomainAdapter):
        """Register a new domain adapter"""
        self.domains[domain_name] = adapter
    
    async def query(self, domain: str, query: str, **kwargs):
        adapter = self.domains.get(domain)
        if not adapter:
            raise ValueError(f"Unknown domain: {domain}")
        
        # Universal flow
        interpreted = await self.query_interpreter.parse(query, adapter.schema())
        retrieved = await self.retrieval_engine.search(interpreted, adapter.table_config())
        ranked = await self.ranking_engine.rank(retrieved, adapter.ranking_config())
        summarized = await self.summarization_engine.summarize(ranked, adapter.prompt_template())
        
        return summarized

# Domain Adapter Interface
class DomainAdapter(ABC):
    @abstractmethod
    def schema(self) -> Dict:  # Database schema for this domain
        pass
    
    @abstractmethod
    def table_config(self) -> Dict:  # Table names, columns, indexes
        pass
    
    @abstractmethod
    def ranking_config(self) -> Dict:  # Ranking weights, fusion config
        pass
    
    @abstractmethod
    def prompt_template(self) -> str:  # LLM prompt for this domain
        pass

# Drug Safety Adapter (Your Current Domain)
class DrugSafetyAdapter(DomainAdapter):
    def schema(self):
        return {
            "table": "pv_cases",
            "text_column": "reaction",
            "metadata_columns": ["drug_name", "serious", "country"],
            "embedding_column": "embedding_vector"
        }
    
    def ranking_config(self):
        return {
            "use_fusion_engine": True,
            "fusion_weights": {"bayesian": 0.3, "quantum_layer1": 0.4, "quantum_layer2": 0.3},
            "semantic_weight": 0.4,
            "fusion_weight": 0.6
        }
    
    def prompt_template(self):
        return """You are a pharmacovigilance expert analyzing adverse event data.
        
        Query: {query}
        Retrieved Signals: {signals}
        
        Provide a comprehensive analysis with:
        1. Summary of findings
        2. Key signals identified
        3. Risk assessment
        4. Recommended actions
        """

# API Endpoint
@router.post("/api/v1/rag/query")
async def rag_query(request: RAGQueryRequest):
    domain = request.domain or "drug-safety"
    result = await rag_engine.query(domain, request.query, **request.filters)
    return result
```

**Pros:**
- ✅ Single codebase for all domains
- ✅ Easy to add new domains (just implement adapter)
- ✅ Consistent API across projects
- ✅ Shared optimization and bug fixes

**Cons:**
- ⚠️ More complex initial architecture
- ⚠️ Requires careful abstraction design

---

### **Option B: Separate API Per Domain (Simpler Start)**

**Design:** Each domain has its own API namespace

```python
# Drug Safety RAG
@router.post("/api/v1/rag/drug-safety/query")
async def drug_safety_query(request: DrugSafetyQueryRequest):
    # Domain-specific implementation
    pass

# Clinical Trials RAG (Future)
@router.post("/api/v1/rag/clinical-trials/query")
async def clinical_trials_query(request: ClinicalTrialsQueryRequest):
    # Domain-specific implementation
    pass
```

**Pros:**
- ✅ Simpler to start
- ✅ Clear separation of concerns
- ✅ Independent scaling per domain

**Cons:**
- ❌ Code duplication
- ❌ Harder to maintain
- ❌ No shared improvements

**Recommendation:** Start with Option B, migrate to Option A as you add domains.

---

### **Option C: Plugin Architecture (Most Flexible)** ⭐⭐⭐

**Design:** Core engine + plugin system

```python
# Plugin Registry
class RAGPluginRegistry:
    def __init__(self):
        self.plugins = {}
    
    def register(self, domain: str, plugin: RAGPlugin):
        self.plugins[domain] = plugin
    
    def get_plugin(self, domain: str) -> RAGPlugin:
        return self.plugins.get(domain)

# Plugin Interface
class RAGPlugin:
    def query_interpreter_config(self) -> Dict:
        """How to interpret queries for this domain"""
        pass
    
    def retrieval_config(self) -> Dict:
        """Table, columns, indexes for retrieval"""
        pass
    
    def ranking_config(self) -> Dict:
        """Ranking weights, fusion config"""
        pass
    
    def summarization_config(self) -> Dict:
        """Prompt templates, output format"""
        pass
    
    def custom_logic(self, stage: str, data: Any) -> Any:
        """Hook for domain-specific logic"""
        pass

# Drug Safety Plugin
@register_plugin("drug-safety")
class DrugSafetyPlugin(RAGPlugin):
    def ranking_config(self):
        return {
            "engines": ["semantic", "fusion"],
            "weights": {"semantic": 0.4, "fusion": 0.6},
            "fusion_config": {
                "use_complete_fusion": True,
                "weights": {"bayesian": 0.3, "quantum_layer1": 0.4, "quantum_layer2": 0.3}
            }
        }
    
    def custom_logic(self, stage: str, data: Any):
        if stage == "pre_ranking":
            # Apply terminology normalization
            data = self.terminology_mapper.normalize(data)
        elif stage == "post_ranking":
            # Add alert levels
            data = self.add_alert_levels(data)
        return data
```

**Pros:**
- ✅ Maximum flexibility
- ✅ Easy to extend
- ✅ Clean separation
- ✅ Can mix and match components

**Cons:**
- ⚠️ Most complex to implement
- ⚠️ Requires plugin system infrastructure

---

## 🔌 **API DESIGN PATTERNS**

### **1. Request/Response Schema**

#### **Universal Query Request**
```python
class RAGQueryRequest(BaseModel):
    query: str
    domain: Optional[str] = "drug-safety"  # Extensible
    filters: Dict[str, Any] = Field(default_factory=dict)
    chat_history: List[ChatMessage] = Field(default_factory=list)
    options: QueryOptions = Field(default_factory=QueryOptions)
    
    class QueryOptions(BaseModel):
        max_results: int = 50
        include_summary: bool = True
        include_sources: bool = True
        include_fusion_analysis: bool = True  # YOUR UNIQUE VALUE
        include_confidence_scores: bool = True
        response_format: str = "natural"  # natural, structured, both
```

#### **Universal Query Response**
```python
class RAGQueryResponse(BaseModel):
    answer: str  # ChatGPT-like natural language response
    sources: List[RetrievedSource]
    confidence: float
    query_interpretation: QueryInterpretation
    fusion_analysis: Optional[FusionAnalysis] = None  # YOUR UNIQUE VALUE
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class RetrievedSource(BaseModel):
        id: str
        text: str
        metadata: Dict[str, Any]
        semantic_score: float
        fusion_score: Optional[float] = None
        rank: int
    
    class QueryInterpretation(BaseModel):
        intent: str
        entities: Dict[str, List[str]]  # drugs, events, dates, etc.
        filters: Dict[str, Any]
        sql_query: Optional[str] = None
        vector_query: Optional[Dict] = None
    
    class FusionAnalysis(BaseModel):
        fusion_score: float
        alert_level: str
        quantum_scores: Dict[str, float]
        explanation: str
```

---

### **2. Configuration-Driven Design**

**YAML Configuration:**
```yaml
# config/rag_domains.yaml
domains:
  drug-safety:
    adapter: "app.core.rag.domains.drug_safety.DrugSafetyAdapter"
    database:
      table: "pv_cases"
      text_column: "reaction"
      embedding_column: "embedding_vector"
      metadata_columns: ["drug_name", "serious", "country", "age"]
    retrieval:
      vector_search:
        enabled: true
        top_k: 100
        similarity_threshold: 0.7
      metadata_filter:
        enabled: true
      hybrid_weight:
        vector: 0.4
        metadata: 0.6
    ranking:
      engines:
        - semantic
        - fusion
      weights:
        semantic: 0.4
        fusion: 0.6
      fusion_config:
        use_complete_fusion: true
        fusion_weights:
          bayesian: 0.3
          quantum_layer1: 0.4
          quantum_layer2: 0.3
    summarization:
      model: "gpt-4"
      prompt_template: "drug_safety_analysis_prompt.txt"
      max_tokens: 1000
      
  clinical-trials:  # Future domain
    adapter: "app.core.rag.domains.clinical_trials.ClinicalTrialsAdapter"
    database:
      table: "clinical_trials"
      text_column: "outcome"
      embedding_column: "embedding_vector"
    # ... similar structure
```

**Code Loading:**
```python
# Load configuration
with open("config/rag_domains.yaml") as f:
    domains_config = yaml.safe_load(f)

# Dynamically load adapters
for domain_name, config in domains_config["domains"].items():
    adapter_class = import_string(config["adapter"])
    adapter = adapter_class(config)
    rag_engine.register_domain(domain_name, adapter)
```

---

### **3. Extensibility Hooks**

**Event Hooks:**
```python
class RAGEngine:
    def __init__(self):
        self.hooks = {
            "pre_query": [],
            "post_interpret": [],
            "pre_retrieve": [],
            "post_retrieve": [],
            "pre_rank": [],
            "post_rank": [],
            "pre_summarize": [],
            "post_summarize": []
        }
    
    def register_hook(self, stage: str, callback: Callable):
        self.hooks[stage].append(callback)
    
    async def query(self, query: str, **kwargs):
        # Pre-query hooks
        for hook in self.hooks["pre_query"]:
            query = await hook(query, **kwargs)
        
        # Interpret
        interpreted = await self.query_interpreter.parse(query)
        
        # Post-interpret hooks
        for hook in self.hooks["post_interpret"]:
            interpreted = await hook(interpreted)
        
        # ... continue through pipeline
```

**Use Cases:**
- Custom filtering logic
- A/B testing different ranking strategies
- Logging and observability
- Caching layers
- Rate limiting per domain

---

## 🌐 **EXTERNAL API DESIGN (For B2B SaaS)**

### **API Endpoints**

```
POST   /api/v2/rag/query              # Main query endpoint
POST   /api/v2/rag/stream             # Streaming responses
GET    /api/v2/rag/domains            # List available domains
POST   /api/v2/rag/index              # Index new documents (for enterprise)
GET    /api/v2/rag/health             # Health check
GET    /api/v2/rag/metrics            # Usage metrics
```

### **Authentication**

```python
# API Key Authentication
@router.post("/api/v2/rag/query")
async def external_rag_query(
    request: RAGQueryRequest,
    api_key: str = Header(..., alias="X-API-Key")
):
    # Validate API key
    client = await validate_api_key(api_key)
    
    # Check rate limits
    await check_rate_limit(client, "query")
    
    # Execute query
    result = await rag_engine.query(request.domain, request.query, **request.filters)
    
    # Log usage
    await log_api_usage(client, "query", request.domain)
    
    return result
```

### **Rate Limiting**

```python
# Tiered rate limits
RATE_LIMITS = {
    "free": {"queries_per_hour": 100, "queries_per_day": 1000},
    "pro": {"queries_per_hour": 1000, "queries_per_day": 10000},
    "enterprise": {"queries_per_hour": 10000, "queries_per_day": 100000}
}
```

### **Usage Analytics**

```python
# Track API usage for billing/analytics
class APIUsageTracker:
    async def track_query(self, client_id: str, domain: str, tokens_used: int):
        await db.insert("api_usage", {
            "client_id": client_id,
            "domain": domain,
            "tokens_used": tokens_used,
            "timestamp": datetime.now()
        })
```

---

## 🔄 **MIGRATION STRATEGY**

### **Phase 1: Current Implementation (Now)**

```python
# Current: Domain-specific
@router.post("/api/v1/ai/query")
async def current_ai_query(request: QueryRequest):
    # Your current implementation
    pass
```

### **Phase 2: Add RAG Layer (Week 5-6)**

```python
# New: RAG endpoint alongside current
@router.post("/api/v1/rag/query")
async def rag_query(request: RAGQueryRequest):
    # New RAG implementation
    # Calls same fusion engine under the hood
    pass

# Keep current endpoint for backward compatibility
@router.post("/api/v1/ai/query")
async def current_ai_query(request: QueryRequest):
    # Redirect to RAG or keep as legacy
    pass
```

### **Phase 3: Universal API (Future)**

```python
# Unified: Domain-agnostic
@router.post("/api/v2/rag/query")
async def universal_rag_query(request: UniversalRAGQueryRequest):
    # Universal implementation with domain adapters
    pass
```

---

## 📊 **COMPONENT REUSABILITY MATRIX**

| Component | Reusable? | Notes |
|-----------|-----------|-------|
| **Query Interpreter** | ✅ Yes | Domain-agnostic LLM parsing |
| **Vector Search** | ✅ Yes | Works with any pgvector table |
| **Fusion Engine** | ⚠️ Domain-Specific | Drug safety specific, but pattern reusable |
| **Summarization** | ✅ Yes | LLM prompts can be domain-agnostic |
| **Embedding Service** | ✅ Yes | Universal text embedding |
| **Terminology Mapper** | ⚠️ Domain-Specific | MedDRA for drugs, but pattern reusable |

**Strategy:** Make domain-specific components **plugins**, not hard dependencies.

---

## 🎯 **RECOMMENDED ARCHITECTURE**

### **Final Recommendation: Hybrid Approach**

```
┌────────────────────────────────────────────────────────────┐
│              Universal RAG Core (Reusable)                  │
│  - Query Interpreter                                        │
│  - Vector Search Engine                                     │
│  - Summarization Engine                                     │
│  - Embedding Service                                        │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│              Domain Plugin Layer (Extensible)               │
│  - Drug Safety Plugin (Your Fusion Engine)                  │
│  - Clinical Trials Plugin (Future)                          │
│  - Literature Plugin (Future)                               │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│              API Layer (Versioned)                          │
│  /api/v1/rag/drug-safety/query  (Current)                  │
│  /api/v2/rag/query?domain=drug-safety  (Universal)         │
│  /api/v2/rag/external/query  (B2B SaaS)                    │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ **ACTION ITEMS**

### **Immediate (This Week)**
1. **Design API Schema** - Define request/response models
2. **Plan Component Abstraction** - Identify reusable vs. domain-specific
3. **Choose Architecture** - Universal vs. Domain-specific (recommend: start domain-specific, plan for universal)

### **Short Term (Weeks 1-4)**
1. **Build Core RAG Components** - Interpreter, retrieval, summarization
2. **Integrate Fusion Engine** - As ranking plugin
3. **Design Plugin Interface** - For future domains

### **Long Term (Months 2-3)**
1. **Migrate to Universal API** - When adding second domain
2. **Build External API** - For B2B SaaS
3. **Add New Domains** - Clinical trials, literature, etc.

---

## 💡 **BRAINSTORMING QUESTIONS**

1. **Do you want to support multiple domains from day 1?**
   - If YES → Universal API from start
   - If NO → Domain-specific, migrate later

2. **Will you monetize this as external API?**
   - If YES → Design for multi-tenancy, rate limiting, billing
   - If NO → Internal API only

3. **How different will future domains be?**
   - Very different → Plugin architecture
   - Similar → Configuration-driven adapters

4. **What's your timeline?**
   - Fast MVP → Domain-specific first
   - Long-term → Universal API from start

**My Recommendation:** Start domain-specific, design for universal migration. Best of both worlds.

