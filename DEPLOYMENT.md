# Deployment & Setup Guide

This guide provides step-by-step instructions to deploy and run the Support Ticket System.

## Prerequisites

### System Requirements
- Docker 20.10+ 
- Docker Compose 1.29+
- 4GB RAM minimum
- 2GB free disk space

### Optional but Recommended
- Anthropic API Key (for LLM-powered ticket classification)
  - Get it at: https://console.anthropic.com/
  - Free tier available with credits

## Quick Start (3 Steps)

### Step 1: Prepare Environment

```bash
# Navigate to project directory
cd support-ticket-system

# Copy environment template
cp .env.example .env

# Edit .env with your settings (optional for LLM)
# Windows: notepad .env
# macOS/Linux: nano .env
```

**Important**: If you don't have an API key, the system still works - it just uses default categorization.

### Step 2: Start Services

```bash
# Build and start all services
docker-compose up --build

# Check if everything is running:
# - Database container (postgres): should be healthy
# - Backend container (Django): should show "Running on 0.0.0.0:8000"
# - Frontend container (React): should show listening on 3000
```

### Step 3: Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/tickets/
- **Database**: postgres://postgres:postgres@localhost:5432/tickets_db

## Stopping Services

```bash
# Stop all running containers
docker-compose down

# Stop and remove data volumes (careful!)
docker-compose down -v
```

## Initial Setup Verification

### 1. Check Backend Health

```bash
# Test the API
curl http://localhost:8000/api/tickets/
# Should return empty list: {"count": 0, "next": null, "previous": null, "results": []}
```

### 2. Check Database Migrations

```bash
# View migration status
docker-compose logs backend | grep -i migrate

# Should show: "Running migrations... (0 migrations)"
```

### 3. Test LLM Integration (Optional)

```bash
# Create a test request
curl -X POST http://localhost:8000/api/tickets/classify/ \
  -H "Content-Type: application/json" \
  -d '{"description": "I cannot log into my account"}'

# Response should be:
# {"suggested_category": "account", "suggested_priority": "..."}
# Or with error handling: {"suggested_category": "general", "suggested_priority": "medium", "error": "..."}
```

## Configuration

### Environment Variables

Create `.env` file in project root:

```env
# Database (defaults shown)
DB_NAME=tickets_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# Django Settings
DEBUG=False                    # Set to True only for development
SECRET_KEY=change-in-prod      # MUST be changed in production

# LLM Configuration (optional)
LLM_API_KEY=sk-ant-xxxxx      # Your Anthropic API key
LLM_PROVIDER=anthropic         # Only provider supported currently
```

## Troubleshooting

### Docker Commands

```bash
# View all running containers
docker-compose ps

# View service logs
docker-compose logs backend    # Show backend logs
docker-compose logs frontend   # Show frontend logs
docker-compose logs db         # Show database logs
docker-compose logs -f backend # Follow logs in real-time

# Re-run migrations
docker-compose exec backend python manage.py migrate

# Enter Django shell
docker-compose exec backend python manage.py shell

# Access database CLI
docker-compose exec db psql -U postgres -d tickets_db
```

### Common Issues

#### Port Already in Use

```bash
# Check which process is using port
# macOS/Linux:
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # Database

# Windows:
netstat -ano | findstr :8000

# Kill process (substitute PID):
kill -9 <PID>          # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### Database Connection Error

```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up --build

# Or just restart database
docker-compose restart db
docker-compose exec backend python manage.py migrate
```

#### LLM API Key Issues

- Check if API key is set: `docker-compose exec backend echo $LLM_API_KEY`
- Invalid key → System falls back to default classification
- Check logs: `docker-compose logs backend | grep -i llm`

#### Frontend Not Connecting to Backend

```bash
# Check CORS settings in backend/config/settings.py
# Ensure frontend URL is in CORS_ALLOWED_ORIGINS

# Common fix: Restart backend
docker-compose restart backend

# Check network: http://backend:8000/api/tickets/ from frontend container
docker-compose exec frontend curl http://backend:8000/api/tickets/
```

## Development Workflow

### Hot Reload

Changes are applied automatically via volume mounts:

```bash
# Edit your code
# vim backend/tickets/models.py

# Django auto-reloads on Python file changes
# React auto-reloads on JS file changes

# For migrations:
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

### Database Inspection

```bash
# Connect to database
docker-compose exec db psql -U postgres -d tickets_db

# List tables
\dt

# View tickets
SELECT id, title, category, priority, status, created_at FROM tickets_ticket;

# Count by category
SELECT category, COUNT(*) FROM tickets_ticket GROUP BY category;

# Exit
\q
```

### Backend Testing

```bash
# Run tests (once configured)
docker-compose exec backend python manage.py test

# Create superuser (only once)
docker-compose exec backend python manage.py createsuperuser

# Access admin panel
# http://localhost:8000/admin
```

## Production Deployment

### Before Going Live

1. **Security**
   - Change `SECRET_KEY` in `.env`
   - Set `DEBUG=False`
   - Update `ALLOWED_HOSTS` for your domain
   - Use HTTPS/SSL certificates
   - Update `CORS_ALLOWED_ORIGINS` to your frontend domain

2. **Database**
   - Change default PostgreSQL password
   - Set up database backups
   - Use separate database server (not in Docker)

3. **API Key**
   - Use secrets management (AWS Secrets Manager, Vault, etc.)
   - Never commit `.env` file
   - Rotate keys regularly

4. **Infrastructure**
   - Use Docker Compose only for development
   - Deploy with Kubernetes or Docker Swarm for production
   - Use reverse proxy (nginx)
   - Set resource limits

### Docker Hub Deployment Example

```bash
# Build production images
docker build -t myregistry/support-ticket-backend:latest ./backend
docker build -t myregistry/support-ticket-frontend:latest ./frontend

# Push to registry
docker push myregistry/support-ticket-backend:latest
docker push myregistry/support-ticket-frontend:latest

# Pull and run on server
docker pull myregistry/support-ticket-backend:latest
docker pull myregistry/support-ticket-frontend:latest
docker-compose -f docker-compose.prod.yml up -d
```

## Performance Tips

### Optimize Database
```sql
-- Create indexes (usually auto-created)
CREATE INDEX idx_tickets_created_at ON tickets_ticket(created_at DESC);
CREATE INDEX idx_tickets_category ON tickets_ticket(category);
CREATE INDEX idx_tickets_priority ON tickets_ticket(priority);
CREATE INDEX idx_tickets_status ON tickets_ticket(status);
```

### Caching Strategy
- Implement Redis for stats caching
- Add `Cache-Control` headers to frontend
- Consider GraphQL for reducing API calls

### Database Connection Pooling
- Use PgBouncer for connection pooling
- Adjust Django `CONN_MAX_AGE` setting

## Monitoring & Logging

```bash
# View application logs
docker-compose logs --tail=100 -f

# Log to file
docker-compose logs > docker-logs.txt

# Monitor resource usage
docker stats

# Inspect specific service
docker-compose exec backend python manage.py shell
```

## Backup & Recovery

```bash
# Backup database
docker-compose exec db pg_dump -U postgres -d tickets_db > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres -d tickets_db < backup.sql

# Backup volumes
docker run --rm -v support-ticket-system_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data
```

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Review README.md for architecture details
3. Contact development team with:
   - Error messages from logs
   - Docker version
   - Environment details
   - Steps to reproduce

---

**Last Updated**: February 25, 2026  
**Version**: 1.0
