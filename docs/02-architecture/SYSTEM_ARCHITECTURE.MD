# BUMBA Framework Visual Architecture

## System Overview

```mermaid
graph TB
    subgraph "External Layer"
        CLI[CLI Commands]
        API[API Endpoints]
        WEB[Web Interface]
    end
    
    subgraph "Security Layer"
        VAL[Command Validator]
        SAN[Path Sanitizer]
        RBAC[RBAC System]
        SEC[Secure Executor]
    end
    
    subgraph "Routing Layer"
        URS[Unified Routing System]
        IA[Intent Analyzer]
        PM[Pattern Matcher]
        RM[Routing Memory]
    end
    
    subgraph "Department Layer"
        PSM[Product Strategist Manager]
        DEM[Design Engineer Manager]
        BEM[Backend Engineer Manager]
    end
    
    subgraph "Specialist Layer"
        MRS[Market Research Specialist]
        UXS[UX Research Specialist]
        DBS[Database Specialist]
        SECS[Security Specialist]
        DS[Design System Specialist]
        APIS[API Architecture Specialist]
    end
    
    subgraph "Core Services"
        HC[Health Check System]
        RM2[Resource Manager]
        CM[Config Manager]
        EM[Error Handler]
        CS[Cache System]
        AS[Agent System]
    end
    
    subgraph "Integration Layer"
        MCP[MCP Servers]
        FS[File System]
        NET[Network]
        DB[Database]
    end
    
    CLI --> VAL
    API --> VAL
    WEB --> VAL
    
    VAL --> URS
    SAN --> URS
    RBAC --> URS
    
    URS --> IA
    URS --> PM
    URS --> RM
    
    URS --> PSM
    URS --> DEM
    URS --> BEM
    
    PSM --> MRS
    DEM --> UXS
    DEM --> DS
    BEM --> DBS
    BEM --> SECS
    BEM --> APIS
    
    PSM --> HC
    DEM --> HC
    BEM --> HC
    
    HC --> RM2
    HC --> CM
    HC --> EM
    
    AS --> CS
    AS --> RM2
    
    MCP --> NET
    FS --> DB
```

## Command Flow Sequence

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant Security
    participant Router
    participant Dept as Department Manager
    participant Spec as Specialist
    participant Core as Core Services
    
    User->>CLI: /bumba:implement feature
    CLI->>Security: Validate command
    Security->>Security: Check permissions
    Security->>Router: Route command
    Router->>Router: Analyze intent
    Router->>Dept: Select department
    Dept->>Dept: Evaluate complexity
    Dept->>Spec: Spawn specialist
    Spec->>Core: Use services
    Core-->>Spec: Results
    Spec-->>Dept: Task complete
    Dept-->>Router: Response
    Router-->>CLI: Formatted output
    CLI-->>User: Display result
```

## Department Coordination

```mermaid
graph LR
    subgraph "Strategic Department"
        PSM2[Product Strategist]
        MR[Market Research]
        BA[Business Analysis]
        REQ[Requirements]
    end
    
    subgraph "Experience Department"
        DEM2[Design Engineer]
        UX[UX Design]
        UI[UI Design]
        ACC[Accessibility]
    end
    
    subgraph "Technical Department"
        BEM2[Backend Engineer]
        API2[API Design]
        DB2[Database]
        SEC2[Security]
    end
    
    PSM2 --> REQ
    REQ --> DEM2
    DEM2 --> UX
    UX --> UI
    UI --> BEM2
    BEM2 --> API2
    API2 --> DB2
    DB2 --> SEC2
    
    REQ -.->|Requirements| UI
    UI -.->|Design Specs| API2
    API2 -.->|Tech Feasibility| REQ
```

## Health Monitoring System

```mermaid
graph TD
    subgraph "Health Checks"
        SYS[System Health]
        FS2[File System]
        DEP[Dependencies]
        COMP[Components]
    end
    
    subgraph "Monitoring"
        CPU[CPU Usage]
        MEM[Memory]
        DISK[Disk Space]
        NET2[Network]
    end
    
    subgraph "Endpoints"
        HE[/health]
        LE[/liveness]
        RE[/readiness]
    end
    
    subgraph "Actions"
        AR[Auto Repair]
        AL[Alerts]
        LOG[Logging]
    end
    
    SYS --> CPU
    SYS --> MEM
    FS2 --> DISK
    DEP --> NET2
    
    CPU --> HE
    MEM --> HE
    DISK --> LE
    NET2 --> RE
    
    HE --> AR
    LE --> AL
    RE --> LOG
```

## Mode Switching Architecture

```mermaid
stateDiagram-v2
    [*] --> FullMode: Default
    
    FullMode --> LiteMode: Resource Limit
    FullMode --> LiteMode: User Request
    LiteMode --> FullMode: Resources Available
    LiteMode --> FullMode: User Request
    
    state FullMode {
        [*] --> AllServices
        AllServices --> Departments
        Departments --> Specialists
        Specialists --> Execution
    }
    
    state LiteMode {
        [*] --> CoreOnly
        CoreOnly --> BasicAgents
        BasicAgents --> FastExecution
    }
```

## MCP Server Integration

```mermaid
graph TB
    subgraph "BUMBA Framework"
        CMD[Commands]
        MCPR[MCP Resilience]
        CB[Circuit Breaker]
        CACHE[Cache Layer]
    end
    
    subgraph "MCP Servers"
        REF[Ref MCP<br/>Documentation]
        SEM[Semgrep MCP<br/>Security]
        MEM2[Memory MCP<br/>Context]
        SEQ[Sequential MCP<br/>Reasoning]
    end
    
    subgraph "Fallbacks"
        WEB2[Web Search]
        LOCAL[Local Scan]
        FILE[File Storage]
        SIMPLE[Simple Logic]
    end
    
    CMD --> MCPR
    MCPR --> CB
    CB --> CACHE
    
    CACHE --> REF
    CACHE --> SEM
    CACHE --> MEM2
    CACHE --> SEQ
    
    REF -.->|Failure| WEB2
    SEM -.->|Failure| LOCAL
    MEM2 -.->|Failure| FILE
    SEQ -.->|Failure| SIMPLE
```

## Resource Management

```mermaid
graph LR
    subgraph "Resource Pools"
        AP[Agent Pool<br/>Min: 2, Max: 10]
        CP[Connection Pool<br/>Max: 20]
        WP[Worker Pool<br/>Max: 4]
    end
    
    subgraph "Allocation"
        REQ2[Request]
        CHECK[Check Limits]
        ALLOC[Allocate]
        TRACK[Track Usage]
    end
    
    subgraph "Cleanup"
        REL[Release]
        GC[Garbage Collect]
        MON[Monitor]
    end
    
    REQ2 --> CHECK
    CHECK --> ALLOC
    ALLOC --> TRACK
    
    AP --> ALLOC
    CP --> ALLOC
    WP --> ALLOC
    
    TRACK --> REL
    REL --> GC
    GC --> MON
    MON --> CHECK
```

## Error Handling Flow

```mermaid
flowchart TD
    START[Error Occurs] --> CATCH[Error Boundary]
    CATCH --> CLASS[Classify Error]
    
    CLASS --> REC{Recoverable?}
    REC -->|Yes| STRAT[Select Strategy]
    REC -->|No| LOG2[Log & Report]
    
    STRAT --> RETRY{Retryable?}
    RETRY -->|Yes| BACKOFF[Exponential Backoff]
    RETRY -->|No| FALL[Fallback]
    
    BACKOFF --> EXEC[Retry Execution]
    EXEC -->|Success| DONE[Complete]
    EXEC -->|Fail| FALL
    
    FALL --> ALT[Alternative Method]
    ALT --> DONE
    
    LOG2 --> USER[Notify User]
    USER --> END[End]
    DONE --> END
```

## Performance Optimization

```mermaid
graph TD
    subgraph "Caching Strategy"
        L1[L1: Memory Cache<br/>200 items, LRU]
        L2[L2: Disk Cache<br/>Persistent]
        L3[L3: Shared Cache<br/>Redis]
    end
    
    subgraph "Optimization"
        LAZY[Lazy Loading]
        POOL[Resource Pooling]
        BATCH[Request Batching]
        COMP2[Compression]
    end
    
    subgraph "Monitoring"
        HIT[Cache Hit Rate]
        LAT[Latency Tracking]
        MEM3[Memory Usage]
        THR[Throughput]
    end
    
    L1 --> L2
    L2 --> L3
    
    LAZY --> L1
    POOL --> L1
    BATCH --> L2
    COMP2 --> L3
    
    L1 --> HIT
    POOL --> LAT
    L3 --> MEM3
    BATCH --> THR
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV[Local Dev]
        TEST[Test Suite]
        BUILD[Build System]
    end
    
    subgraph "CI/CD"
        GH[GitHub Actions]
        LINT[Linting]
        UNIT[Unit Tests]
        INT[Integration Tests]
        PERF[Performance Tests]
    end
    
    subgraph "Production"
        NPM[NPM Registry]
        CDN[CDN Distribution]
        MON2[Monitoring]
    end
    
    DEV --> TEST
    TEST --> BUILD
    BUILD --> GH
    
    GH --> LINT
    GH --> UNIT
    GH --> INT
    GH --> PERF
    
    LINT --> NPM
    UNIT --> NPM
    INT --> NPM
    PERF --> NPM
    
    NPM --> CDN
    CDN --> MON2
```

---

These diagrams provide a visual understanding of:
- System architecture and component relationships
- Command flow and processing sequence
- Department coordination and handoffs
- Health monitoring and auto-repair
- Mode switching between Full and Lite
- MCP server integration with fallbacks
- Resource management and pooling
- Error handling strategies
- Performance optimization layers
- Deployment and CI/CD pipeline

The diagrams use Mermaid syntax and can be rendered in any Markdown viewer that supports Mermaid (GitHub, GitLab, VS Code with extensions, etc.).