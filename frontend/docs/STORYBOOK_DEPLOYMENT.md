# Storybook Deployment Guide

Complete guide for deploying the Atlas Immobilier Design System Storybook to various hosting platforms.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git repository access
- Account on chosen hosting platform

## 🚀 Quick Deployment

### Build Storybook

```bash
cd frontend
npm install
npm run build-storybook
```

This generates a static site in `frontend/storybook-static/` ready for deployment.

## 🌐 Deployment Options

### 1. GitHub Pages (Free, Recommended for Teams)

**Pros**: Free, automatic SSL, easy setup, version control integration
**Cons**: Public repositories only (unless GitHub Pro)

#### Setup

```bash
# Install gh-pages
cd frontend
npm install --save-dev gh-pages

# Add deployment script to package.json
"deploy-storybook": "npm run build-storybook && gh-pages -d storybook-static"

# Deploy
npm run deploy-storybook
```

#### GitHub Actions (Automatic Deployment)

Create `.github/workflows/storybook.yml`:

```yaml
name: Deploy Storybook

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build Storybook
        run: |
          cd frontend
          npm run build-storybook
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/storybook-static
```

**Enable GitHub Pages**:
1. Go to repository Settings > Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` / `root`
4. Save

Your Storybook will be available at: `https://<username>.github.io/<repo-name>/`

### 2. Netlify (Free, Excellent DX)

**Pros**: Free tier, automatic deployments, custom domains, preview deployments
**Cons**: Build minutes limited on free tier

#### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
cd frontend
npm run build-storybook
netlify deploy --prod --dir=storybook-static
```

#### Automatic Deployment (Git Integration)

1. Go to https://app.netlify.com/
2. Click "Add new site" > "Import an existing project"
3. Connect to Git provider (GitHub, GitLab, etc.)
4. Configure build settings:
   - **Build command**: `cd frontend && npm install && npm run build-storybook`
   - **Publish directory**: `frontend/storybook-static`
   - **Base directory**: Leave empty or set to `/`
5. Click "Deploy site"

**Environment Variables** (if needed):
- `NODE_VERSION`: `18`

**Custom Domain**:
1. Go to Site settings > Domain management
2. Add custom domain
3. Configure DNS (CNAME record)

### 3. Vercel (Free, Fast)

**Pros**: Free, excellent performance, serverless functions support
**Cons**: Build execution time limited on free tier

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
npm run build-storybook
vercel --prod storybook-static
```

#### Automatic Deployment

Create `vercel.json` in frontend directory:

```json
{
  "buildCommand": "npm run build-storybook",
  "outputDirectory": "storybook-static",
  "framework": null,
  "installCommand": "npm install"
}
```

1. Import project at https://vercel.com/
2. Select repository
3. Framework: Other
4. Root directory: `frontend`
5. Deploy

### 4. AWS S3 + CloudFront (Production Grade)

**Pros**: Scalable, fast CDN, custom domains, full control
**Cons**: Requires AWS account, more complex setup

#### Setup S3 Bucket

```bash
# Create S3 bucket
aws s3 mb s3://atlas-storybook

# Enable static website hosting
aws s3 website s3://atlas-storybook \
  --index-document index.html \
  --error-document index.html

# Upload storybook
cd frontend
npm run build-storybook
aws s3 sync storybook-static/ s3://atlas-storybook \
  --delete \
  --cache-control max-age=31536000,public
```

#### S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::atlas-storybook/*"
    }
  ]
}
```

#### CloudFront Distribution

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name atlas-storybook.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html

# After deployment, invalidate cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

#### Automated Deployment Script

Create `deploy-aws.sh`:

```bash
#!/bin/bash
set -e

echo "Building Storybook..."
npm run build-storybook

echo "Uploading to S3..."
aws s3 sync storybook-static/ s3://atlas-storybook \
  --delete \
  --cache-control max-age=31536000,public

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

Make executable: `chmod +x deploy-aws.sh`

### 5. Azure Static Web Apps (Free)

**Pros**: Free tier, Azure integration, automatic SSL
**Cons**: Requires Azure account

```bash
# Install Azure CLI
# Follow: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Create static web app
az staticwebapp create \
  --name atlas-storybook \
  --resource-group <your-resource-group> \
  --source storybook-static \
  --location "westus2" \
  --branch main \
  --app-location "/" \
  --output-location "storybook-static"
```

#### GitHub Actions for Azure

```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Build
        run: |
          cd frontend
          npm ci
          npm run build-storybook
      
      - name: Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "frontend"
          output_location: "storybook-static"
```

### 6. Docker + Self-Hosted

**Pros**: Full control, can deploy anywhere, version control
**Cons**: Requires infrastructure management

#### Dockerfile

Create `Dockerfile` in frontend directory:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build storybook
RUN npm run build-storybook

# Production stage
FROM nginx:alpine

# Copy built storybook
COPY --from=builder /app/storybook-static /usr/share/nginx/html

# Copy nginx config (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Build and Run

```bash
# Build Docker image
cd frontend
docker build -t atlas-storybook:latest .

# Run container
docker run -d -p 8080:80 --name atlas-storybook atlas-storybook:latest

# Access at http://localhost:8080
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  storybook:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

Run: `docker-compose up -d`

#### Custom Nginx Config (Optional)

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip
    gzip on;
    gzip_types text/css application/javascript application/json;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 7. Google Cloud Storage + Cloud CDN

```bash
# Create bucket
gsutil mb gs://atlas-storybook

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://atlas-storybook

# Configure as website
gsutil web set -m index.html -e index.html gs://atlas-storybook

# Upload
cd frontend
npm run build-storybook
gsutil -m rsync -r -d storybook-static gs://atlas-storybook

# Enable Cloud CDN (via Console or gcloud)
```

## 🔒 Security Considerations

### Password Protection

For Netlify, create `_redirects` file in `storybook-static/`:

```
/* /.netlify/functions/basic-auth 401
```

For nginx (Docker), add basic auth:

```nginx
location / {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    try_files $uri $uri/ /index.html;
}
```

### Environment-Specific Deployments

- **Development**: Branch preview on Netlify/Vercel
- **Staging**: Separate subdomain or branch
- **Production**: Main domain with CDN

## 📊 Analytics Integration

### Google Analytics

Add to `.storybook/preview-head.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔄 Continuous Deployment Pipeline

Recommended workflow:

1. **Development**: Local Storybook (`npm run storybook`)
2. **Pull Request**: Preview deployment (Netlify/Vercel)
3. **Merge to Main**: Automatic production deployment
4. **Versioning**: Tag releases for documentation versions

## 📈 Performance Optimization

### Build Optimization

```json
// .storybook/main.js
module.exports = {
  // ... other config
  features: {
    storyStoreV7: true,
    buildStoriesJson: true,
  },
  core: {
    builder: {
      name: 'webpack5',
      options: {
        fsCache: true,
        lazyCompilation: true,
      }
    }
  }
};
```

### CDN Caching Headers

For CloudFront/Cloud CDN:
- HTML files: `Cache-Control: no-cache`
- Static assets: `Cache-Control: max-age=31536000,public,immutable`

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build-storybook
```

### Routing Issues

For SPA routing, ensure server redirects all routes to `index.html`:

**Netlify**: Create `_redirects` in `storybook-static/`:
```
/*    /index.html   200
```

**Vercel**: Add to `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Large Bundle Size

1. Enable tree shaking
2. Lazy load large dependencies
3. Optimize images
4. Enable gzip/brotli compression

## 📞 Support

For deployment issues:
- Check hosting provider documentation
- Review build logs
- Verify environment variables
- Test build locally first
- Contact DevOps team

## 🎯 Best Practices

1. **Version Control**: Tag releases for documentation versions
2. **Preview Deployments**: Test before production
3. **Monitoring**: Set up uptime monitoring
4. **Backup**: Keep build artifacts
5. **Documentation**: Document custom configurations
6. **Security**: Implement authentication if needed
7. **Performance**: Monitor Core Web Vitals
8. **Accessibility**: Test on production URL

---

**Questions?** Contact the development team or open an issue in the repository.
