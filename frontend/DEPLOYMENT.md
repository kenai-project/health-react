# Deployment Guide

This guide covers deploying the Health Management System frontend to various platforms.

## Build for Production

```bash
pnpm build
```

This creates an optimized production build in the `/dist` directory.

## Environment Variables

Before deploying, configure your environment variables:

```env
# Production API URL
VITE_API_URL=https://your-api-domain.com/api
```

## Deployment Platforms

### 1. Vercel

#### Quick Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Configuration

Create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Environment Variables

In Vercel Dashboard:
1. Go to Project Settings
2. Environment Variables
3. Add `VITE_API_URL` with your production API URL

### 2. Netlify

#### Quick Deploy

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Configuration

Create `netlify.toml`:

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Environment Variables

In Netlify Dashboard:
1. Site Settings → Environment Variables
2. Add `VITE_API_URL`

### 3. GitHub Pages

#### Setup

1. Update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... rest of config
})
```

2. Add deploy script to `package.json`:

```json
{
  "scripts": {
    "deploy": "vite build && gh-pages -d dist"
  }
}
```

3. Install gh-pages:

```bash
pnpm add -D gh-pages
```

4. Deploy:

```bash
pnpm deploy
```

### 4. AWS S3 + CloudFront

#### Build and Upload

```bash
# Build
pnpm build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

#### S3 Bucket Configuration

1. Enable static website hosting
2. Set index document: `index.html`
3. Set error document: `index.html` (for SPA routing)

### 5. Docker

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Build and run:

```bash
# Build image
docker build -t health-management-frontend .

# Run container
docker run -p 8080:80 health-management-frontend
```

### 6. Traditional Web Server (Apache/Nginx)

#### Apache

Create `.htaccess` in build directory:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Nginx

Update nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/health-management/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Performance Optimizations

### 1. Enable Compression

Most hosting platforms enable gzip automatically. For custom servers:

**Nginx:**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

**Apache:**
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript
</IfModule>
```

### 2. CDN Integration

Use a CDN like:
- Cloudflare
- AWS CloudFront
- Fastly

Benefits:
- Faster global delivery
- DDoS protection
- SSL/TLS
- Caching

### 3. Build Optimizations

Already included in production build:
- ✅ Code minification
- ✅ Tree shaking
- ✅ Dead code elimination
- ✅ Asset optimization
- ✅ CSS purging

## Security Considerations

### 1. HTTPS

Always use HTTPS in production:
- Let's Encrypt (free SSL)
- Cloudflare (free SSL)
- Platform-provided SSL

### 2. Security Headers

Add security headers (Nginx example):

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### 3. Environment Variables

- Never commit `.env` files
- Use platform environment variables
- Different values for dev/staging/prod

### 4. API Security

- Ensure CORS is properly configured
- Use HTTPS for API endpoints
- Implement rate limiting on backend
- Validate JWT tokens properly

## Monitoring

### 1. Error Tracking

Integrate error tracking:
- Sentry
- Bugsnag
- Rollbar

### 2. Analytics

Add analytics:
- Google Analytics
- Plausible
- Matomo

### 3. Performance Monitoring

Monitor performance:
- Lighthouse CI
- Web Vitals
- CloudWatch (AWS)

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Build
      run: pnpm build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Security headers set
- [ ] Error tracking configured
- [ ] Analytics installed
- [ ] Performance tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing done
- [ ] API endpoints working
- [ ] Authentication flow tested
- [ ] All routes accessible
- [ ] 404 page working
- [ ] Backup strategy in place

## Rollback Strategy

### Quick Rollback

Most platforms support instant rollback:

**Vercel:**
```bash
vercel rollback
```

**Netlify:**
Use the Netlify dashboard to revert to previous deploy

**Docker:**
```bash
docker pull your-repo/health-management:previous-tag
docker run -p 8080:80 your-repo/health-management:previous-tag
```

### Manual Rollback

Keep previous build artifacts:
1. Tag releases in git
2. Keep previous Docker images
3. Store build artifacts in S3

## Backup and Recovery

### Database Backups
Ensure your FastAPI backend database is backed up regularly.

### Code Repository
- Use Git version control
- Tag releases
- Use protected branches

### Static Assets
If using custom assets:
- Backup to S3/cloud storage
- Version control with Git LFS

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

### Runtime Errors

1. Check browser console
2. Verify environment variables
3. Check API connectivity
4. Review error logs

### Performance Issues

1. Analyze with Lighthouse
2. Check bundle size
3. Enable compression
4. Use CDN
5. Optimize images

## Support

For deployment issues:
1. Check platform documentation
2. Review build logs
3. Test locally first
4. Verify environment variables

## Cost Estimation

### Free Tier Options
- **Vercel:** Free for personal/small projects
- **Netlify:** 100GB bandwidth/month free
- **GitHub Pages:** Free for public repos
- **Cloudflare Pages:** Free tier available

### Paid Options
- **AWS:** Pay-as-you-go (~$5-50/month)
- **DigitalOcean:** $5-20/month
- **Heroku:** $7+/month

Choose based on:
- Traffic volume
- Performance requirements
- Team size
- Support needs

---

**Happy Deploying! 🚀**
