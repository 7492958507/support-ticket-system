# Deployment Guide - Railway

This guide helps you deploy the Support Ticket System to Railway.app in 5 minutes.

## Prerequisites

- GitHub account (connected to Railway)
- (Optional) Anthropic API key for LLM features

## Deployment Steps

### 1. Connect to Railway

Go to https://railway.app and sign in with GitHub.

### 2. Create New Project

1. Click **"New Project"** button
2. Select **"Deploy from GitHub repo"**
3. Select your repository: `7492958507/support-ticket-system`
4. Click **"Create"**

Railway will auto-detect docker-compose.yml and start deployment.

### 3. Configure Environment Variables

In Railway dashboard:

1. Go to **"Variables"** tab
2. Add these environment variables:

```
# Database (Railway creates this automatically)
DB_NAME=tickets_db
DB_USER=postgres
DB_PASSWORD=postgres

# LLM (Optional - get from console.anthropic.com)
LLM_API_KEY=your-anthropic-api-key-here
LLM_PROVIDER=anthropic

# Django
DEBUG=False
SECRET_KEY=your-secure-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,*.railway.app
```

### 4. Wait for Deployment

- Frontend deployment: ~2-3 minutes
- Backend deployment: ~3-5 minutes
- Database initialization: ~1 minute

### 5. Get Your Live URLs

In the Railway dashboard, you'll see:
- **Frontend URL**: `https://support-ticket-frontend-xxx.railway.app`
- **Backend URL**: `https://support-ticket-backend-xxx.railway.app`

Copy these URLs to your `.env.production` and update your GitHub repo.

## Important Links

- **Live Frontend**: Visit your Railway frontend URL
- **Live API**: Visit `https://your-backend-url/api/tickets/`
- **Railway Dashboard**: https://railway.app/project/xyz

## Troubleshooting

### If deployment fails:

1. Check **Logs** tab in Railway
2. Common issues:
   - Missing environment variables → Add them in Variables tab
   - Database connection error → Wait 2 minutes for DB to initialize
   - API key issues → Leave `LLM_API_KEY` empty to use defaults

### If frontend doesn't load:

- Check browser console (F12) for API URL mismatch
- Verify `REACT_APP_API_URL` in `.env.production`
- Update frontend `.env.production` with correct backend URL

## Custom Domain (Optional)

1. In Railway → **Settings** → **Domains**
2. Add custom domain (e.g., `support.yourdomain.com`)
3. Update DNS records as Railway instructs

## Local Testing

Before deploying to Railway, test locally:

```bash
docker-compose up --build
# Visit: http://localhost:3000
```

## Next Steps

1. Update `README.md` with live URLs
2. Share deployment links with team
3. Monitor logs in Railway dashboard
4. Scale resources if needed

---

**Questions?** Check Railway docs: https://docs.railway.app
