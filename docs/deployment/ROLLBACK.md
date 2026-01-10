# Rollback Plan: Next.js 16 Upgrade

**Feature**: nextjs16-upgrade
**Version**: 1.6.0 → 1.5.0
**Last Updated**: 2026-01-10

---

## Quick Reference

| Action | Command |
|--------|---------|
| **Immediate Rollback** | `git revert HEAD && npm ci && npm run build` |
| **Full Version Rollback** | `git checkout v1.5.0 && npm ci && npm run build` |
| **Verify Rollback** | `npm run test -- --run && npm run build` |

---

## Rollback Triggers

### Automatic Triggers (Require Immediate Action)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate (5xx) | > 5% for 5 minutes | Initiate rollback |
| Service Worker Failures | > 10% registration failures | Initiate rollback |
| Page Load Time (p95) | > 5 seconds | Investigate, consider rollback |
| JavaScript Errors | > 100 errors/minute | Investigate, consider rollback |

### Manual Triggers

- Critical security vulnerability discovered
- Data corruption or loss detected
- Core functionality broken (login, article viewing)
- PWA install/update failures affecting >5% users

---

## Rollback Procedures

### Level 1: Quick Rollback (< 5 minutes)

For issues that can be fixed by reverting the last deployment:

```bash
# 1. Revert to previous commit
git revert HEAD --no-edit

# 2. Reinstall dependencies
npm ci

# 3. Run verification
npm run test -- --run
npm run build

# 4. Deploy
# (Follow standard deployment process)
```

### Level 2: Full Version Rollback (< 10 minutes)

For issues requiring complete version rollback:

```bash
# 1. Checkout previous version tag
git checkout v1.5.0

# 2. Create rollback branch
git checkout -b rollback/v1.5.0-emergency

# 3. Reinstall dependencies (previous versions)
npm ci

# 4. Verify build works
npm run test -- --run
npm run build

# 5. Deploy to production
# (Follow standard deployment process)

# 6. Create PR for tracking
git push -u origin rollback/v1.5.0-emergency
```

### Level 3: Service Worker Emergency Reset

If service worker issues persist after code rollback:

```javascript
// 1. Deploy empty service worker to unregister itself
// Replace public/sw.js with:
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  // Unregister this service worker
  self.registration.unregister().then(() => {
    // Notify all clients to refresh (optional)
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SW_UNREGISTERED' });
      });
    });
  });
});
```

```bash
# 2. Deploy and wait for propagation (up to 24 hours for all clients)

# 3. Once confirmed, deploy actual rollback version
```

---

## Component-Specific Rollback

### Next.js 16 → 15 Rollback

```bash
# Update package.json
npm install next@15.5.9 --save-exact

# Rename proxy.ts back to middleware.ts
mv src/proxy.ts src/middleware.ts

# Update next.config.ts if needed
# (Remove any Next.js 16-specific configurations)

# Verify
npm run build
```

### @serwist/next → next-pwa Rollback

```bash
# Update package.json
npm uninstall @serwist/next serwist
npm install next-pwa@^5.6.0

# Remove Serwist-specific files
rm src/sw.ts

# Restore next-pwa configuration in next.config.ts
# (See git history for previous configuration)

# Verify service worker
npm run build
```

### React 19.2.3 → 19.2.1 Rollback

```bash
# Update package.json
npm install react@19.2.1 react-dom@19.2.1 --save-exact

# Verify
npm run test -- --run
npm run build
```

---

## Verification Checklist

After rollback, verify the following:

### Functional Tests
- [ ] Application starts without errors
- [ ] Login/logout works correctly
- [ ] Article list loads properly
- [ ] Search functionality works
- [ ] PWA install prompt appears
- [ ] Service worker registers successfully

### Performance Tests
- [ ] Page load time < 3 seconds (p95)
- [ ] Time to Interactive < 4 seconds
- [ ] No JavaScript errors in console

### Monitoring Checks
- [ ] Error rate returned to normal (< 1%)
- [ ] No new Sentry errors
- [ ] Health endpoint returns 200
- [ ] Readiness endpoint returns 200

---

## Communication Plan

### Internal Notification

1. **Slack/Teams**: Post in #engineering channel
2. **PagerDuty**: Update incident status
3. **Status Page**: Update service status

### Template Message

```
[INCIDENT] Rollback initiated for catchup-feed-frontend

Issue: [Brief description]
Action: Rolling back from v1.6.0 to v1.5.0
ETA: [Estimated resolution time]
Impact: [User impact description]

Status updates will be posted here.
```

---

## Post-Rollback Actions

1. **Document** the issue in incident report
2. **Analyze** root cause
3. **Create** tickets for fixes required before re-attempting upgrade
4. **Update** this rollback plan with lessons learned
5. **Schedule** post-mortem meeting

---

## Rollback Authority

| Role | Can Initiate | Approval Required |
|------|--------------|-------------------|
| On-call Engineer | Yes | None (emergency) |
| Tech Lead | Yes | None |
| Product Manager | No | Tech Lead |

---

## Contact List

| Role | Contact |
|------|---------|
| On-call | See PagerDuty rotation |
| Tech Lead | [TBD] |
| DevOps | [TBD] |

---

## Version History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-01-10 | 1.0 | EDAF | Initial rollback plan for Next.js 16 upgrade |
