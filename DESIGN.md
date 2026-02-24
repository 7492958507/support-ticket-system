# Design & Architecture Document

## Project Overview

The Support Ticket System is a full-stack web application for managing customer support tickets with AI-powered automatic categorization and priority suggestion.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Browser                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTP/REST API
                           │
         ┌─────────────────┴────────────────────┐
         │                                      │
    ┌────▼────────┐                    ┌──────▼──────────┐
    │ React 18    │                    │ Django DRF      │
    │ Frontend    │                    │ Backend API     │
    │ (Port 3000) │                    │ (Port 8000)     │
    └────┬────────┘                    └──────┬──────────┘
         │                                    │
         │        LLM API Calls              │
         │    for Classification             │
         └──────────────────┬────────────────┘
                            │
                   ┌────────┼────────┐
                   │        │        │
              ┌────▼──┐ ┌───▼────┐ ┌─▼──────┐
              │Claude │ │Database│ │Storage │
              │API    │ │(Postgres)(Optional)
              └───────┘ └────────┘ └────────┘
```

## Design Decisions & Rationales

### 1. Backend Framework: Django + DRF

**Choice**: Django 4.2 with Django REST Framework

**Rationale**:
- Mature framework with excellent ORM
- Built-in admin interface for data management
- DRF provides automatic serialization/deserialization
- Rich ecosystem for common tasks
- Great documentation and community support
- Database migration system ensures schema evolution

**Alternatives Considered**:
- FastAPI: More modern, but less ecosystem for SPA backends
- Flask: Too minimal for this project's scope
- Node.js/Express: Viable but Django ORM stronger for aggregations

### 2. Database: PostgreSQL

**Choice**: PostgreSQL 15

**Rationale**:
- Robust relational database with strong ACID guarantees
- Excellent JSON support (future extension)
- Full-text search capabilities (future enhancement)
- Advanced indexing for performance
- Native support for constraints at DB level (requirement)

**Alternatives Considered**:
- MySQL: Less flexible, missing advanced features
- MongoDB: No requirement for schema flexibility
- SQLite: Insufficient for concurrent access

### 3. Frontend Framework: React

**Choice**: React 18 with Hooks

**Rationale**:
- Component-based architecture matches our UI structure
- Excellent developer ecosystem
- Virtual DOM provides good performance
- Hooks simplify state management for this project scope

**Alternatives Considered**:
- Vue.js: Simpler but smaller ecosystem
- Angular: Overkill for this project's complexity
- Vanilla JS: Would require more boilerplate code

### 4. LLM Provider: Anthropic Claude 3.5 Sonnet

**Choice**: Claude 3.5 Sonnet API

**Rationale**:
- Excellent language understanding for support tickets
- Fast response times (< 1 second typically)
- Reliable JSON output format
- Cost-effective for business use
- Easy-to-use Python SDK
- Good documentation with examples

**Alternatives Considered**:
- OpenAI GPT-4: More expensive, slower
- Google Gemini: Fewer integrations with Python ecosystem
- Open source models: Require infrastructure, not cloud-based

### 5. Containerization: Docker Compose

**Choice**: Docker + Docker Compose for development and simple deployments

**Rationale**:
- Single command deployment (`docker-compose up --build`)
- Simplified dependency management
- Consistent environment across machines
- Works on Windows, macOS, Linux

**Production Alternative**: Kubernetes for scaling

## System Architecture

### Backend Architecture

```
requests/
  ├─ GET /api/tickets/           → TicketViewSet.list()
  ├─ POST /api/tickets/          → TicketViewSet.create()
  ├─ PATCH /api/tickets/{id}/    → TicketViewSet.partial_update()
  ├─ GET /api/tickets/stats/     → TicketViewSet.stats()
  └─ POST /api/tickets/classify/ → TicketViewSet.classify()

Django ORM
  └─ Ticket Model
      ├─ title (CharField)
      ├─ description (TextField)
      ├─ category (CharField with choices)
      ├─ priority (CharField with choices)
      ├─ status (CharField with choices, default=open)
      └─ created_at (DateTimeField auto_now_add=True)

Database Aggregate Functions (for stats)
  ├─ Count by category
  ├─ Count by priority
  ├─ Count by status
  ├─ Average tickets per day
  └─ Total ticket count

LLM Service
  └─ classify_ticket(description)
      ├─ Validate API key
      ├─ Call Claude API
      ├─ Parse JSON response
      ├─ Validate choices
      └─ Return defaults on error
```

### Frontend Architecture

```
App.js (Main Container)
├─ Navigation (View selector)
└─ Conditional Rendering
   ├─ TicketForm.js (Create View)
   │  ├─ Form state management
   │  ├─ LLM classification call
   │  └─ Ticket submission
   ├─ TicketList.js (List View)
   │  ├─ Filter state (category, priority, status, search)
   │  ├─ Ticket display
   │  └─ Status update functionality
   └─ Stats.js (Analytics View)
      ├─ Stats fetching
      └─ Data visualization

CSS Architecture
└─ App.css (Single CSS file for development simplicity)
   ├─ Layout & Grid
   ├─ Component Styles
   ├─ Theme Colors
   └─ Responsive Design
```

## Data Flow

### Ticket Creation Flow

```
1. User fills form in TicketForm.js
   ├─ Title input
   ├─ Description textarea
   └─ Submit button

2. On description blur/submit:
   ├─ Call POST /api/tickets/classify/
   ├─ Backend calls Claude API
   └─ Frontend updates category/priority dropdowns

3. User reviews/overrides suggestions and submits
   ├─ Validate form (required fields)
   ├─ POST /api/tickets/ with form data
   ├─ Backend saves to database
   ├─ Response includes ticket ID
   └─ Frontend redirects to list view

4. Stats auto-refresh on new ticket
   └─ TicketList re-fetches data
```

### Stats Aggregation Flow

```
1. Frontend requests GET /api/tickets/stats/
2. Backend executes database-level aggregation:
   ├─ COUNT(*) for total_tickets
   ├─ COUNT(*) WHERE status='open' for open_tickets
   ├─ (now() - min(created_at)) / total for avg per day
   ├─ Count group by priority
   └─ Count group by category
3. Django ORM uses .values() and .annotate(Count())
4. Returns JSON with aggregated data
5. Frontend displays in dashboard cards and charts
```

## Performance Optimizations

### Database Layer
- **Indexing**: Created indexes on frequently queried fields
  - `category`
  - `priority`
  - `status`
  - `created_at DESC` (for newest first ordering)

- **Database Aggregation**: Stats endpoint uses DB-level operations
  - Avoids Python loops over large datasets
  - Leverages SQL's COUNT and GROUP BY

- **Query Optimization**: 
  - List view filters at database level not Python level
  - Search uses Django's icontains for SQL LIKE

### Frontend Layer
- **Component Splitting**: Separate components for different views
- **Conditional Rendering**: Only render visible components
- **Form State**: Local component state (sufficient for this scope)
- **API Caching**: Could add with React Query (future enhancement)

### Network Optimization
- Pagination ready (DRF pagination configured)
- Filters reduce response size (category, status filters)
- Search reduces results returned

## Security Considerations

### Authentication & Authorization
- **Current**: None (open system for demo)
- **Future**: Add JWT or session-based auth
- **Admin**: Access via Django admin (credentials via env vars)

### Data Protection
- **Database**: PostgreSQL with password authentication
- **API**: CORS configured (adjustable per environment)
- **LLM Key**: Environment variable (never in code/git)
- **HTTPS**: Implement reverse proxy with SSL in production

### Input Validation
- **Backend**: DRF serializers validate all inputs
- **Database**: Constraints enforce valid choices
- **Frontend**: HTML5 validation + React state management

### Error Handling
- **LLM Failures**: Graceful degradation to defaults
- **Database Errors**: Caught and logged, proper HTTP status codes
- **Missing Data**: 404 for non-existent tickets

## Scalability Considerations

### Current Limitations
- Single Django instance (scales vertically only)
- PostgreSQL on local network
- React SPAs (stateless, scales instantly)

### Future Scaling Strategy

```
Low Traffic (Current)
└─ Single docker-compose setup

Medium Traffic
├─ Add Nginx reverse proxy
├─ Add Redis for caching
├─ Horizontal scaling with multiple Django instances
└─ Managed database (AWS RDS, Azure Database)

High Traffic
├─ Kubernetes deployment
├─ GraphQL instead of REST (query optimization)
├─ CDN for frontend assets
├─ Background job queue (Celery)
└─ Separate read/write databases (replication)
```

## Error Handling Strategy

### Backend Errors

```python
# LLM Integration
try:
    result = classify_ticket(description)
except APIError:
    return defaults  # Graceful fallback

# Database Errors
try:
    ticket.save()
except IntegrityError:
    return 400  # Bad request

# API Errors
except Exception as e:
    logger.error(e)
    return 500  # Internal error
```

### Frontend Error Handling

```javascript
// LLM Classification
try {
    const result = await classify()
    updateFormFields(result)
} catch {
    // Keep existing values, let user override
}

// API Calls
try {
    await submitForm()
    showSuccess()
} catch (err) {
    showError(err.message)
}
```

## Testing Strategy (Not Implemented - Future)

### Backend Tests
```python
# Unit Tests
- Model tests (constraints, methods)
- Serializer tests (validation)
- View tests (endpoints, permissions)

# Integration Tests
- Full request/response cycle
- Database interactions
- LLM API mocking

# Load Tests
- concurrent users
- Database performance
```

### Frontend Tests
```javascript
// Component Tests
- Jest + React Testing Library
- Component rendering
- User interactions
- API mock calls

// E2E Tests
- Cypress or Playwright
- Full user workflows
- Cross-browser testing
```

## Monitoring & Logging

### Logging Strategy
```
Backend
├─ LLM requests/responses
├─ Database errors
├─ API errors
└─ Performance metrics

Frontend
├─ API call timing
├─ Error tracking
└─ User interactions
```

### Metrics to Track
- API response times
- Database query times
- Error rates by endpoint
- LLM classification success rate
- Average tickets per day

## Future Enhancements

1. **User Authentication**
   - Support agent login
   - Ticket assignment
   - Audit trail

2. **Advanced Features**
   - Ticket comments thread
   - File attachments
   - Email notifications
   - SLA tracking

3. **Analytics**
   - Advanced reporting
   - Trend analysis
   - Agent performance metrics

4. **UI/UX**
   - Real-time updates (WebSockets)
   - Keyboard shortcuts
   - Dark mode
   - Mobile app

5. **Performance**
   - Caching layer (Redis)
   - Job queue (Celery)
   - GraphQL API
   - Database read replicas

## Code Quality Standards

### Backend
- PEP 8 compliance
- Type hints (future)
- Docstrings for methods
- Django best practices

### Frontend
- ES6+ standards
- Meaningful variable names
- Component documentation
- Clean CSS organization

### Git Practices
- Atomic commits
- Descriptive messages
- Feature branches (future)
- Code review (future)

---

**Last Updated**: February 25, 2026
