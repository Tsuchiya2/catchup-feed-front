# Alerting Configuration Guide

**Feature**: nextjs16-upgrade
**Last Updated**: 2026-01-10

---

## Overview

This document defines the alerting rules to configure in Sentry and other monitoring systems for the Catchup Feed frontend application.

---

## Sentry Alert Rules

Configure these alerts in Sentry Dashboard → Alerts → Create Alert Rule.

### Critical Alerts (Immediate Action Required)

#### 1. High Error Rate

```yaml
Name: "High Error Rate - Frontend"
Trigger: When events > 50 in 5 minutes
Conditions:
  - event.type = error
  - environment = production
Actions:
  - Send notification to #alerts-critical
  - Page on-call engineer
Frequency: Once per issue
```

#### 2. Service Worker Failure

```yaml
Name: "Service Worker Registration Failure"
Trigger: When events > 10 in 5 minutes
Conditions:
  - event.type = error
  - message contains "ServiceWorker" OR "sw.js"
  - environment = production
Actions:
  - Send notification to #alerts-critical
  - Page on-call engineer
Frequency: Once per issue
```

#### 3. Authentication Failure Spike

```yaml
Name: "Authentication Failure Spike"
Trigger: When events > 20 in 10 minutes
Conditions:
  - tags.category = "auth"
  - level = error
  - environment = production
Actions:
  - Send notification to #alerts-security
Frequency: Once every 30 minutes
```

### Warning Alerts (Investigation Required)

#### 4. Slow Page Load

```yaml
Name: "Slow Page Load Performance"
Trigger: Transaction duration p95 > 5000ms for 10 minutes
Conditions:
  - transaction.op = pageload
  - environment = production
Actions:
  - Send notification to #alerts-performance
Frequency: Once every hour
```

#### 5. High JavaScript Error Count

```yaml
Name: "JavaScript Error Spike"
Trigger: When events > 100 in 30 minutes
Conditions:
  - event.type = error
  - environment = production
Actions:
  - Send notification to #alerts-frontend
Frequency: Once every 30 minutes
```

#### 6. API Latency Degradation

```yaml
Name: "API Latency Degradation"
Trigger: Transaction duration p95 > 2000ms for 15 minutes
Conditions:
  - transaction.op = http.client
  - environment = production
Actions:
  - Send notification to #alerts-backend
Frequency: Once every hour
```

---

## Health Check Monitoring

### Vercel / Hosting Provider

Configure uptime monitoring for these endpoints:

| Endpoint | Interval | Timeout | Alert After |
|----------|----------|---------|-------------|
| `/api/health` | 1 minute | 5 seconds | 2 failures |
| `/api/readiness` | 1 minute | 5 seconds | 3 failures |

### External Monitoring (Recommended)

Use a service like Better Uptime, Pingdom, or UptimeRobot:

```yaml
Monitors:
  - name: "Catchup Feed - Health Check"
    url: "https://your-app.vercel.app/api/health"
    method: GET
    interval: 60
    timeout: 10
    expected_status: 200
    alert_contacts:
      - email: ops@example.com
      - slack: #alerts-infra

  - name: "Catchup Feed - Homepage"
    url: "https://your-app.vercel.app/"
    method: GET
    interval: 60
    timeout: 30
    expected_status: 200
    alert_contacts:
      - email: ops@example.com
      - slack: #alerts-infra
```

---

## Prometheus Alert Rules (Optional)

If using Prometheus with the `/api/metrics` endpoint:

```yaml
groups:
  - name: catchup-feed-frontend
    rules:
      - alert: HighMemoryUsage
        expr: process_memory_rss_bytes > 500000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Process is using {{ $value | humanize }} bytes"

      - alert: ProcessRestarted
        expr: process_uptime_seconds < 300
        labels:
          severity: info
        annotations:
          summary: "Process recently restarted"
          description: "Process uptime is only {{ $value }} seconds"
```

---

## Rollback-Specific Alerts

These alerts should trigger automatic or manual rollback consideration:

| Alert | Threshold | Auto-Rollback | Manual Review |
|-------|-----------|---------------|---------------|
| Error Rate > 5% | 5 min sustained | Consider | Yes |
| SW Failures > 10% | 5 min sustained | Consider | Yes |
| Health Check Down | 5 min sustained | Yes | Yes |
| p95 Latency > 5s | 10 min sustained | No | Yes |

---

## Notification Channels

### Slack Integration

Configure these channels in Sentry:

| Channel | Purpose | Alert Types |
|---------|---------|-------------|
| #alerts-critical | Immediate action | High error rate, SW failures |
| #alerts-frontend | Frontend team | JS errors, performance |
| #alerts-security | Security team | Auth failures, suspicious activity |
| #alerts-infra | DevOps team | Health checks, uptime |

### PagerDuty Integration

Configure PagerDuty for critical alerts:

```yaml
Service: catchup-feed-frontend
Escalation Policy:
  - Level 1: On-call Engineer (immediate)
  - Level 2: Tech Lead (after 15 minutes)
  - Level 3: Engineering Manager (after 30 minutes)
```

---

## Alert Testing

### Test Procedure

1. **Deploy to staging**
2. **Trigger test errors**:
   ```javascript
   // In browser console
   throw new Error('[TEST] Alert verification - ignore');
   ```
3. **Verify alerts fire**
4. **Confirm notification delivery**
5. **Document results**

### Scheduled Testing

- Monthly: Verify all critical alerts fire correctly
- Quarterly: Review and update thresholds based on baseline data

---

## Version History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-01-10 | 1.0 | EDAF | Initial alerting configuration for Next.js 16 upgrade |
