# Production Deployment Checklist

## Pre-Deployment

### 1. Build Verification
- [ ] Run production build: `npm run build:prod`
- [ ] Verify no build errors
- [ ] Check bundle sizes: `npm run build:analyze`
- [ ] Verify all lazy chunks are properly separated
- [ ] Confirm service worker is included in build

### 2. Bundle Size Check
- [ ] Initial bundle < 500KB (gzipped)
- [ ] Lazy chunks < 200KB each
- [ ] Vendor chunk < 300KB
- [ ] Review large dependencies in bundle analyzer

### 3. Performance Testing
- [ ] Run Lighthouse audit (Performance > 90)
- [ ] Check Core Web Vitals:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] Test on slow 3G network
- [ ] Test with CPU throttling (4x slowdown)

### 4. Service Worker Testing
- [ ] Service worker registers successfully
- [ ] Cache strategies working correctly
- [ ] Offline mode functional
- [ ] Cache updates on new deployment
- [ ] Background sync operational

### 5. Browser Testing
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest version)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### 6. Accessibility
- [ ] Lighthouse Accessibility score > 95
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] ARIA labels present
- [ ] Color contrast ratios meet WCAG AA

### 7. Security
- [ ] No console errors or warnings
- [ ] No exposed API keys or secrets
- [ ] HTTPS enforced
- [ ] Content Security Policy configured
- [ ] No mixed content warnings

## Server Configuration

### 1. Web Server (nginx/Apache)

#### Compression
```nginx
# Brotli (preferred)
brotli on;
brotli_types text/plain text/css application/javascript application/json image/svg+xml;
brotli_comp_level 6;

# Gzip (fallback)
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css application/javascript application/json image/svg+xml;
```

#### Caching Headers
```nginx
# Static assets - aggressive caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
  access_log off;
}

# HTML - no caching
location ~* \.html$ {
  expires -1;
  add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# Service Worker - no caching
location = /service-worker.js {
  expires -1;
  add_header Cache-Control "no-cache";
  add_header Service-Worker-Allowed "/";
}

# Manifest
location = /manifest.json {
  expires 1d;
  add_header Cache-Control "public, max-age=86400";
}
```

#### Security Headers
```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.example.com;" always;
```

#### HTTPS Redirect
```nginx
# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name example.com www.example.com;
  return 301 https://$server_name$request_uri;
}
```

### 2. CDN Configuration (Optional)

#### CloudFront
- [ ] Distribution created
- [ ] Origin set to web server
- [ ] Compress objects automatically enabled
- [ ] Cache behaviors configured:
  - Static assets: Cache-Control from origin
  - HTML: No caching
  - API: No caching
- [ ] HTTPS certificate installed
- [ ] Custom error pages configured

#### CloudFlare
- [ ] Site added to CloudFlare
- [ ] DNS configured
- [ ] SSL/TLS set to "Full (strict)"
- [ ] Auto Minify enabled (JS, CSS, HTML)
- [ ] Brotli compression enabled
- [ ] Browser Cache TTL configured
- [ ] Page Rules set for API bypass

### 3. API Server
- [ ] CORS headers configured correctly
- [ ] Rate limiting in place
- [ ] API response caching enabled
- [ ] Compression enabled
- [ ] Database connection pooling configured

## Post-Deployment

### 1. Smoke Tests
- [ ] Homepage loads correctly
- [ ] Login/authentication works
- [ ] Main features functional
- [ ] Search works
- [ ] Forms submit successfully
- [ ] File uploads work

### 2. Performance Monitoring
- [ ] Real User Monitoring (RUM) active
- [ ] Performance budgets configured
- [ ] Alerts set up for:
  - Page load time > 3s
  - Bundle size increase > 10%
  - Error rate > 1%
  - API response time > 500ms

### 3. Analytics Verification
- [ ] Google Analytics tracking
- [ ] Performance metrics reporting
- [ ] Error tracking (Sentry, etc.)
- [ ] User behavior tracking

### 4. Service Worker Verification
- [ ] Service worker registered on all pages
- [ ] Cache strategies working
- [ ] Offline mode functional
- [ ] Updates propagating correctly

### 5. Documentation
- [ ] Update version number
- [ ] Document breaking changes
- [ ] Update CHANGELOG.md
- [ ] Notify team of deployment

## Rollback Plan

### If Issues Detected
1. [ ] Revert to previous deployment
2. [ ] Clear CDN cache
3. [ ] Notify users via status page
4. [ ] Document issue
5. [ ] Create hotfix plan

### Rollback Commands
```bash
# Revert git deployment
git revert HEAD
git push

# Or rollback to specific version
git checkout <previous-version-tag>
npm run build:prod
# Deploy to server
```

## Monitoring Checklist (First 24 Hours)

### Performance
- [ ] Average page load time < 2s
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] Bundle loads successfully
- [ ] No 404 errors for assets

### Errors
- [ ] JavaScript error rate < 0.1%
- [ ] API error rate < 1%
- [ ] No critical console errors
- [ ] Service worker errors < 0.01%

### User Experience
- [ ] No major user complaints
- [ ] Conversion rate unchanged or improved
- [ ] Bounce rate stable
- [ ] Session duration stable

## Long-Term Monitoring

### Weekly
- [ ] Review error logs
- [ ] Check bundle size trends
- [ ] Monitor performance metrics
- [ ] Review user feedback

### Monthly
- [ ] Run full Lighthouse audit
- [ ] Review Core Web Vitals
- [ ] Check for security updates
- [ ] Update dependencies (patch versions)

### Quarterly
- [ ] Major dependency updates
- [ ] Performance audit
- [ ] Security audit
- [ ] Accessibility audit
- [ ] Bundle size optimization review

## Emergency Contacts

- **DevOps Lead**: [Contact Info]
- **Frontend Lead**: [Contact Info]
- **Backend Lead**: [Contact Info]
- **On-Call Engineer**: [Contact Info]

## Useful Commands

```bash
# Build production
npm run build:prod

# Analyze bundle
npm run build:analyze

# Test production build locally
npx http-server dist/frontend -p 4200 -c-1

# Run Lighthouse
npx lighthouse https://example.com --view

# Check bundle sizes
npm run analyze:source

# Clear service worker cache
# In browser console:
caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))
```

## Additional Resources

- [Performance Documentation](./PERFORMANCE_OPTIMIZATIONS_README.md)
- [Bundle Optimization Guide](./BUNDLE_OPTIMIZATION.md)
- [Quick Reference](./OPTIMIZATION_QUICK_REFERENCE.md)
- [Web.dev Best Practices](https://web.dev/learn/)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
