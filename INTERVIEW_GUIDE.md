# Support Ticket System - Interview Guide

## 📋 Project Summary (30 seconds)

A **full-stack web application** that helps companies manage customer support tickets with **AI-powered automatic categorization**. Users can create tickets, the system automatically suggests category and priority using Claude AI, and administrators can view statistics and manage ticket statuses.

---

## 🎯 Core Features (What Users Can Do)

1. **Create Support Tickets**
   - User submits title + description
   - System auto-suggests category & priority using AI
   - User can accept or override suggestions
   - Ticket saved to database

2. **View & Filter Tickets**
   - List all tickets with pagination
   - Filter by: category, priority, status
   - Search by title/description
   - See creation date and current status

3. **Manage Ticket Status**
   - Change status: open → in_progress → resolved → closed
   - Update via REST API with PATCH request

4. **View Statistics Dashboard**
   - Total tickets count
   - Open tickets count
   - Average tickets per day
   - Breakdown by priority (low, medium, high, critical)
   - Breakdown by category (billing, technical, account, general)

---

## 🏗️ Architecture Overview

### 3-Tier Architecture:

```
┌─────────────────────┐
│   FRONTEND          │  React 18 (Port 3000)
│   Components UI     │  - TicketForm, TicketList, Stats
└──────────┬──────────┘
           │ HTTP/REST
┌──────────▼──────────┐
│   BACKEND API       │  Django DRF (Port 8000)
│   Business Logic    │  - TicketViewSet, LLM Classification
└──────────┬──────────┘
           │ SQL Queries
┌──────────▼──────────┐
│   DATABASE          │  PostgreSQL (Port 5432)
│   Data Storage      │  - Tickets table with constraints
└─────────────────────┘
```

### Technology Stack:

| Layer | Technology | Why? |
|-------|-----------|------|
| **Frontend** | React 18 | Component-based UI, Virtual DOM, Great ecosystem |
| **Backend** | Django 4.2 + DRF | Mature ORM, built-in validation, REST API |
| **Database** | PostgreSQL 15 | ACID guarantees, constraints at DB level |
| **LLM** | Claude 3.5 Sonnet | Fast, accurate, reliable JSON output |
| **Infrastructure** | Docker Compose | Containerization, easy local development |

---

## 📊 Data Model

### Ticket Entity:

```python
class Ticket:
    id: Integer (PK, Auto-increment)
    title: CharField (max 200 chars, required)
    description: TextField (required)
    category: Choices [billing, technical, account, general]
    priority: Choices [low, medium, high, critical]
    status: Choices [open, in_progress, resolved, closed]
    created_at: DateTime (auto-set)
```

**Key Design Decision**: All constraints enforced at **database level** (NOT just application level)
- `NOT NULL` constraints prevent invalid data at database
- Choice constraints ensure valid categories/priorities/statuses
- Primary key auto-increment for unique IDs

---

## 🔌 API Endpoints

### REST Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **POST** | `/api/tickets/` | Create new ticket |
| **GET** | `/api/tickets/` | List tickets (with filters) |
| **GET** | `/api/tickets/{id}/` | Get single ticket |
| **PATCH** | `/api/tickets/{id}/` | Update ticket status |
| **GET** | `/api/tickets/stats/` | Get statistics |
| **POST** | `/api/tickets/classify/` | Get AI suggestions |

### Query Parameters (Filtering):
```
GET /api/tickets/?category=technical&priority=high&status=open&search=payment
```

### LLM Classification Endpoint:
```json
POST /api/tickets/classify/

Request:
{
  "description": "I can't log into my account"
}

Response:
{
  "suggested_category": "account",
  "suggested_priority": "high"
}
```

---

## 💡 Key Implementation Details

### 1. **Ticket Creation Flow**

```
User Input (Form)
    ↓
POST /api/tickets/
    ↓
Validate with TicketCreateSerializer
    ↓
Save to Database
    ↓
Return full TicketSerializer response
    ↓
Frontend redirects to list view
```

### 2. **LLM Integration**

**File**: `backend/tickets/llm_service.py`

```python
def classify_ticket(description):
    client = Anthropic()
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        messages=[{
            "role": "user",
            "content": f"""Classify this support ticket:
            Description: {description}
            
            Return JSON with:
            - suggested_category: 'billing', 'technical', 'account', or 'general'
            - suggested_priority: 'low', 'medium', 'high', or 'critical'
            
            Be strict: category=general only if truly generic."""
        }]
    )
    return parse_json_response(message.content[0].text)
```

**Why Claude?**
- ✅ Fast response times (<1 second)
- ✅ Reliable JSON output
- ✅ Excellent language understanding
- ✅ Cost-effective (for business scale)

### 3. **Database Aggregations (Not Python Loops)**

**Problem**: Statistics require counting/grouping → Don't fetch 1M records to Python!

**Solution**: Use Django ORM aggregation at database level:

```python
# GOOD: Database-level aggregation (1 query)
priority_breakdown = dict(
    Ticket.objects
    .values('priority')
    .annotate(count=Count('id'))  # COUNT aggregated in DB
    .values_list('priority', 'count')
)

# BAD: Would fetch 1M records to Python
tickets = Ticket.objects.all()
breakdown = {p: sum(1 for t in tickets if t.priority==p)}
```

### 4. **Filtering Implementation**

```python
def get_queryset(self):
    queryset = Ticket.objects.all()
    
    # Chained filters (QuerySet optimization)
    if category := self.request.query_params.get('category'):
        queryset = queryset.filter(category=category)
    
    if priority := self.request.query_params.get('priority'):
        queryset = queryset.filter(priority=priority)
    
    if status := self.request.query_params.get('status'):
        queryset = queryset.filter(status=status)
    
    # Search uses Q objects for OR logic
    if search := self.request.query_params.get('search'):
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search)
        )
    
    return queryset  # Single DB query executed only when needed
```

---

## 🎨 Frontend Architecture

### Component Structure:

```
App (Main Container)
├── TicketForm (Create new ticket)
│   ├── Input fields
│   ├── AI Classification button
│   └── Submit handler
├── TicketList (View tickets)
│   ├── Filter controls
│   ├── Ticket rows
│   └── Status updater
└── Stats (Dashboard)
    ├── Total tickets counter
    ├── Priority breakdown chart
    └── Category breakdown chart
```

### State Management:

```javascript
const [activeView, setActiveView] = useState('list');
const [refreshKey, setRefreshKey] = useState(0);

// When ticket created → increment refreshKey
// Components watching refreshKey refetch data
// Simple but effective for this project scale
```

### API Communication:

```javascript
// Get all tickets with filters
axios.get('http://localhost:8000/api/tickets/?category=technical')

// Create ticket
axios.post('http://localhost:8000/api/tickets/', {
  title: "Login broken",
  description: "Can't login after update",
  category: "account",
  priority: "high"
})

// Get AI suggestions
axios.post('http://localhost:8000/api/tickets/classify/', {
  description: "I can't log in"
})
```

---

## 🚀 Deployment & Infrastructure

### Docker Compose (3 Containers):

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: tickets_db
    ports:
      - "5432:5432"
    
  backend:
    build: ./backend
    environment:
      DB_HOST: db
      LLM_API_KEY: your-key
    ports:
      - "8000:8000"
    commands:
      - migrate database
      - run Django server
    
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    commands:
      - npm build
      - serve React app
```

### Startup Flow:

1. Docker builds 3 images
2. PostgreSQL container starts first
3. Backend waits for DB healthcheck
4. Frontend and Backend services start
5. Django runs migrations automatically
6. All services ready in ~30 seconds

---

## 🔐 Design Decisions (Interview Questions)

### Q: Why Django instead of FastAPI?

**A**: Chose Django because:
- ✅ Robust ORM with complex queries (aggregations, filters)
- ✅ Built-in admin panel for non-technical users
- ✅ Database migration system for schema evolution
- ✅ Mature ecosystem (DRF, CORS, pagination)
- ❌ FastAPI is newer but has smaller ecosystem

### Q: Why PostgreSQL over MongoDB?

**A**: PostgreSQL because:
- ✅ Need schema consistency (always have title, description, etc)
- ✅ ACID guarantees for ticket data integrity
- ✅ Better for relational queries (filtering, aggregation)
- ✅ Database-level constraints (requirement)
- ❌ MongoDB has schema flexibility but not needed here

### Q: Why Claude instead of GPT-4?

**A**: Claude because:
- ✅ 3x cheaper than GPT-4
- ✅ Faster response times (<1s vs 2-3s)
- ✅ Excellent JSON output reliability
- ✅ Better for classification tasks
- ❌ GPT-4 overkill for categorization

### Q: Why React over Vue/Angular?

**A**: React because:
- ✅ Largest ecosystem & community
- ✅ Component-based matches our UI
- ✅ Virtual DOM for performance
- ✅ Easy to find developers
- ❌ Vue simpler but smaller community

---

## 📈 Performance Considerations

### Database Level:

| Query | Optimization |
|-------|--------------|
| Listing tickets | Indexed on created_at, category, priority, status |
| Searching | Full-text search possible with PostgreSQL |
| Statistics | COUNT/GROUP BY at DB level, not Python |
| Filtering | QuerySet chaining before query execution |

### Frontend Level:

| Optimization | Implementation |
|--------------|----------------|
| Component reuse | Form, List, Stats as separate components |
| Axios caching | Response caching for repeated requests |
| Pagination | API returns paginated results (not all at once) |
| Lazy loading | Load stats only when stats tab clicked |

---

## 🧪 Testing Strategy (If Asked)

### Backend Testing:
```python
# Test ticket creation
def test_create_ticket():
    response = client.post('/api/tickets/', {
        'title': 'Test',
        'description': 'Test desc',
        'category': 'technical',
        'priority': 'high'
    })
    assert response.status_code == 201
    
# Test filtering
def test_filter_by_category():
    Ticket.objects.create(..., category='billing')
    response = client.get('/api/tickets/?category=billing')
    assert len(response.json()['results']) == 1
```

### Frontend Testing:
```javascript
// Test form submission
test('creates ticket when form submitted', () => {
  render(<TicketForm />)
  userEvent.type(screen.getByLabel('Title'), 'Bug')
  userEvent.click(screen.getByText('Submit'))
  expect(mockAxios.post).toHaveBeenCalled()
})
```

---

## 🎓 What You Learned Building This

1. **Full-Stack Web Development**: Frontend + Backend + Database
2. **REST API Design**: Proper endpoint design with filters
3. **Database Design**: Schema, constraints, aggregations
4. **LLM Integration**: API calls, error handling, fallbacks
5. **Docker**: Containerization, multi-container orchestration
6. **System Design**: Architecture decisions with tradeoffs
7. **Frontend State Management**: Component state, data fetching
8. **SQL Optimization**: Aggregations vs application logic

---

## 💬 Common Interview Questions

**Q: How would you scale this to 1 million tickets?**

**A**: 
- Add database indexes on frequently filtered columns
- Implement pagination (API returns 20 results, not million)
- Add caching layer (Redis) for stats
- Use async jobs for LLM classification (don't block request)
- Shard database by date or customer if needed

**Q: How would you add user authentication?**

**A**:
- Add Django User model
- Implement JWT tokens
- Middleware to validate token on every request
- Filter tickets by user: `Ticket.objects.filter(user=request.user)`

**Q: What if LLM API is down?**

**A**:
- Wrap API call in try-except
- Fallback to default category='general', priority='medium'
- Log error for monitoring
- Ticket still created successfully, just without AI assistance

**Q: How would you add real-time updates?**

**A**:
- Use WebSockets with Django Channels
- When ticket created/updated, broadcast to all connected clients
- Frontend subscribes to WebSocket, auto-updates list

---

## 🎯 Key Talking Points for Interview

1. **"I built this as a real-world support ticket system"** - Shows practical thinking
2. **"Database constraints at DB level, not just app"** - Shows database knowledge
3. **"LLM integration for automatic categorization"** - Shows AI awareness
4. **"Used aggregation at database level for stats"** - Shows optimization thinking
5. **"Containerized with Docker for easy deployment"** - Shows DevOps thinking
6. **"Proper REST API design with filtering and search"** - Shows API knowledge

---

## 📚 Files to Know

| File | Why Important |
|------|--------------|
| `backend/tickets/models.py` | Data structure, constraints |
| `backend/tickets/views.py` | API logic, filtering, aggregation |
| `backend/tickets/llm_service.py` | AI integration |
| `backend/tickets/serializers.py` | Request/response validation |
| `frontend/src/App.js` | Frontend structure |
| `docker-compose.yml` | Infrastructure setup |
| `backend/config/settings.py` | Django configuration |

---

## Summary

This is a **professional-grade web application** demonstrating:
- ✅ Full-stack development skills
- ✅ System design decisions with tradeoffs
- ✅ Modern technologies (React, Django, PostgreSQL)
- ✅ AI/LLM integration
- ✅ Containerization & DevOps
- ✅ Database optimization
- ✅ REST API design

**Perfect for interviews** because it's complex enough to discuss deeply but simple enough to explain clearly.
