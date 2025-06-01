# 🚀 FitForge Digital Ocean Deployment Guide

## Overview

Deploy FitForge to Digital Ocean App Platform for production hosting with:

- **Automatic builds** from Git repository
- **Auto-scaling** based on CPU/memory usage
- **Health monitoring** with alerts
- **Custom domain** support
- **Environment variables** management
- **SSL certificates** (automatic)

## 🎯 Quick Deployment (10 minutes)

### 1. Prepare Repository

1. **Push to GitHub** (or GitLab/Bitbucket):
   ```bash
   git add .
   git commit -m "feat: prepare for Digital Ocean deployment"
   git push origin main
   ```

2. **Verify build scripts** in `package.json`:
   ```json
   {
     "scripts": {
       "build": "vite build",
       "build:server": "tsc server/index.ts --outDir dist-server",
       "start:server": "node dist-server/index.js",
       "preview": "vite preview"
     }
   }
   ```

### 2. Deploy to Digital Ocean App Platform

#### Option A: Using doctl CLI

1. **Install doctl**:
   ```bash
   # Ubuntu/Debian
   sudo snap install doctl
   
   # macOS
   brew install doctl
   ```

2. **Authenticate**:
   ```bash
   doctl auth init
   ```

3. **Deploy**:
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

#### Option B: Using Digital Ocean Dashboard

1. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
2. Click **Create App**
3. Choose **GitHub** as source
4. Select your FitForge repository
5. Choose `main` branch
6. Upload `.do/app.yaml` as app spec
7. Review and create

### 3. Configure Environment Variables

In Digital Ocean dashboard, set these secrets:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Set Up Custom Domain (Optional)

1. In Digital Ocean dashboard, go to **Domains**
2. Add your domain (e.g., `fitforge.app`)
3. Update DNS records with your registrar:
   - A record: `@` → Digital Ocean IP
   - CNAME record: `www` → `@.fitforge.app`

## 🏗️ Architecture

### Frontend (Static Site)
- **React + Vite** build
- **Static hosting** with CDN
- **SPA routing** with fallback

### Backend (Service)
- **Express.js** API server
- **Auto-scaling** 1-3 instances
- **Health checks** every 30 seconds

### Database
- **Supabase PostgreSQL** (external)
- **Real-time subscriptions**
- **Row Level Security**

### Storage
- **Supabase Storage** for workout media
- **Digital Ocean Spaces** for backups (optional)

## 📊 Monitoring & Scaling

### Health Checks
- **Endpoint**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Auto-restart** on failures

### Auto-scaling
- **Min instances**: 1
- **Max instances**: 3
- **CPU trigger**: 80%
- **Memory trigger**: 90%

### Alerts
- **CPU > 85%** for 5 minutes
- **Memory > 90%** for 5 minutes
- **Health check failures**

## 🔐 Security

### SSL/TLS
- **Automatic** Let's Encrypt certificates
- **HTTP → HTTPS** redirects
- **HSTS** headers

### Environment Variables
- **Encrypted** at rest
- **Secure** injection at runtime
- **No secrets** in code/logs

### Database Security
- **RLS policies** in Supabase
- **API key** rotation support
- **Connection pooling**

## 💰 Cost Estimation

### App Platform Costs
- **Basic tier**: $5/month
- **Professional tier**: $12/month (recommended)
- **Auto-scaling**: $0.007/hour per additional instance

### Supabase Costs
- **Free tier**: 500MB database, 1GB storage
- **Pro tier**: $25/month (unlimited usage)

### Domain Costs
- **Digital Ocean DNS**: Free
- **Domain registration**: $10-15/year

**Total estimated cost**: ~$17-37/month

## 🚀 Optimization Tips

### Performance
1. **Enable gzip** compression
2. **Use CDN** for static assets
3. **Optimize images** and bundle size
4. **Enable browser** caching

### Cost Optimization
1. **Start with basic tier**
2. **Monitor usage** patterns
3. **Scale up** only when needed
4. **Use Supabase free tier** initially

### Development Workflow
1. **Staging environment** for testing
2. **Automatic deploys** on `main` push
3. **Preview builds** for PR reviews
4. **Environment promotion** strategy

## 📈 Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Verify app loads correctly
- [ ] Test user registration/login
- [ ] Check workout tracking functionality
- [ ] Verify real-time features
- [ ] Test mobile responsiveness

### Monitoring Setup (Week 1)
- [ ] Set up uptime monitoring
- [ ] Configure error tracking (Sentry)
- [ ] Monitor performance metrics
- [ ] Set up backup strategy
- [ ] Document incident response

### Growth Preparation (Month 1)
- [ ] Load testing with realistic data
- [ ] Database optimization
- [ ] CDN configuration
- [ ] SEO optimization
- [ ] Analytics integration

## 🆘 Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Check build logs in DO dashboard
# Verify package.json scripts
# Check Node.js version compatibility
```

**Environment Variables**:
```bash
# Verify all secrets are set
# Check variable names match exactly
# Restart app after changes
```

**Database Connection**:
```bash
# Verify Supabase URL/keys
# Check RLS policies
# Monitor connection pools
```

### Debug Commands

```bash
# View app logs
doctl apps logs <app-id> --type build
doctl apps logs <app-id> --type deploy
doctl apps logs <app-id> --type run

# Get app info
doctl apps get <app-id>

# List deployments
doctl apps list-deployments <app-id>
```

## 🎉 Success Metrics

### Technical Metrics
- **Uptime**: >99.9%
- **Response time**: <200ms
- **Build time**: <5 minutes
- **Zero-downtime** deployments

### Business Metrics
- **User registrations**
- **Workout completions**
- **Session duration**
- **Feature adoption**

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Digital Ocean
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to DO
        uses: digitalocean/app_action@v1
        with:
          app_name: fitforge-production
          token: ${{ secrets.DIGITALOCEAN_TOKEN }}
```

## 📞 Support Resources

- **Digital Ocean Docs**: https://docs.digitalocean.com/products/app-platform/
- **Supabase Docs**: https://supabase.com/docs
- **Status Pages**: 
  - DO: https://status.digitalocean.com/
  - Supabase: https://status.supabase.com/

Your production-ready fitness ecosystem is now live! 🎉💪