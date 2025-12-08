# Analytics & Monitoring Setup Guide

**Goal:** Track user behavior, performance, and errors from Day 1

---

## 📊 **RECOMMENDED STACK (All Free Tiers)**

### **1. PostHog (Product Analytics) - FREE**
- User behavior tracking
- Feature usage analytics
- Session recordings
- A/B testing ready
- Self-hosted or cloud

**Why PostHog:**
- Free tier: 1M events/month
- GDPR compliant
- Works with Next.js + FastAPI
- Better than Google Analytics for SaaS

---

### **2. Sentry (Error Tracking) - FREE**
- Frontend errors
- Backend exceptions
- Performance monitoring
- Real-time alerts

**Why Sentry:**
- Free tier: 5K errors/month
- Industry standard
- Excellent Next.js integration
- Python/FastAPI support

---

### **3. Vercel Analytics (Performance) - FREE**
- Core Web Vitals
- Page load times
- Geographic performance
- Real user monitoring

**Why Vercel:**
- Built into Vercel deployment
- Zero setup needed
- Real user metrics
- Free with Vercel hosting

---

## 🛠️ **IMPLEMENTATION PLAN**

### **Week 1: Setup PostHog**

**1. Create Account:**
```bash
# Go to: https://posthog.com
# Sign up (free tier)
# Get your Project API Key
```

**2. Install in Frontend:**
```bash
cd frontend
npm install posthog-js
```

**3. Add to Next.js:**
```typescript
// lib/analytics.ts
import posthog from 'posthog-js'

export function initAnalytics() {
  if (typeof window !== 'undefined') {
    posthog.init('YOUR_API_KEY', {
      api_host: 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.opt_out_capturing()
        }
      }
    })
  }
}

// Track custom events
export function trackEvent(eventName: string, properties?: any) {
  posthog.capture(eventName, properties)
}

// Track page views
export function trackPageView() {
  posthog.capture('$pageview')
}
```

**4. Track Key Events:**
```typescript
// Track user actions
trackEvent('query_executed', {
  query: queryText,
  resultCount: results.length,
  executionTime: duration
})

trackEvent('signal_detected', {
  drug: signalData.drug,
  reaction: signalData.reaction,
  prr: signalData.prr
})

trackEvent('report_generated', {
  reportType: 'PSUR',
  pageCount: pages.length
})
```

---

### **Week 1: Setup Sentry**

**1. Create Account:**
```bash
# Go to: https://sentry.io
# Sign up (free tier)
# Create project for Next.js + Python
```

**2. Install in Frontend:**
```bash
cd frontend
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**3. Install in Backend:**
```bash
cd backend
pip install sentry-sdk[fastapi]
```

**4. Configure Backend:**
```python
# backend/app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
    environment="production"
)
```

**5. Test Error Tracking:**
```python
# Trigger test error
@app.get("/debug-sentry")
async def trigger_error():
    division_by_zero = 1 / 0
```

---

### **Week 1: Enable Vercel Analytics**

**1. Already included if deploying to Vercel:**
```typescript
// next.config.js
module.exports = {
  // Analytics automatically enabled on Vercel
}
```

**2. View metrics:**
```
# Go to Vercel Dashboard → Analytics
# See Core Web Vitals, page load times
```

---

## 📈 **KEY METRICS TO TRACK**

### **Product Metrics (PostHog)**

```typescript
// User Engagement
trackEvent('user_login')
trackEvent('query_executed', { queryType, resultCount })
trackEvent('dataset_uploaded', { fileSize, rowCount })
trackEvent('signal_viewed', { signalId, priority })
trackEvent('report_generated', { reportType })
trackEvent('copilot_query', { queryText, responseTime })

// Feature Usage
trackEvent('feature_used', { feature: 'quantum_ranking' })
trackEvent('feature_used', { feature: 'social_ae' })
trackEvent('export_clicked', { format: 'PDF' })

// Conversion Funnel
trackEvent('trial_started')
trackEvent('onboarding_step_completed', { step: 1 })
trackEvent('first_query_executed')
trackEvent('subscription_upgraded')
```

### **Performance Metrics (Vercel + Custom)**

```typescript
// Track query performance
const startTime = performance.now()
const results = await executeQuery(query)
const duration = performance.now() - startTime

trackEvent('query_performance', {
  duration,
  rowCount: results.length,
  queryComplexity: calculateComplexity(query)
})

// Track API response times
trackEvent('api_call', {
  endpoint: '/api/signals/query',
  duration,
  status: response.status
})
```

### **Business Metrics (Custom)**

```typescript
// Track revenue-impacting events
trackEvent('trial_to_paid_conversion')
trackEvent('monthly_active_user')
trackEvent('power_user_activity', { 
  queriesThisMonth,
  reportsGenerated 
})
```

---

## 🔔 **ALERTING SETUP**

### **Critical Alerts (Sentry)**

```python
# Set up alerts in Sentry dashboard:
- Error rate > 1% in 5 minutes
- Response time > 5 seconds
- Database connection failures
- API endpoint downtime

# Alert channels:
- Email: vikasagarwal11@gmail.com
- Slack: #alerts (if you have Slack)
```

### **Business Alerts (PostHog)**

```
# Set up insights in PostHog:
- Daily active users dropping
- Sign-up conversion rate < 5%
- Query execution errors spiking
- Feature adoption trending down
```

---

## 📊 **DASHBOARDS TO CREATE**

### **1. Product Health Dashboard (PostHog)**
```
Metrics:
- Daily Active Users (DAU)
- Queries per user per day
- Feature adoption rates
- User retention (Day 1, 7, 30)
- Session duration
- Error rate
```

### **2. Performance Dashboard (Vercel + Custom)**
```
Metrics:
- Average query execution time
- Page load times (P50, P95, P99)
- API response times
- Database query performance
- Cache hit rates
```

### **3. Business Dashboard (Custom)**
```
Metrics:
- Trial sign-ups (daily/weekly)
- Trial → Paid conversion rate
- Monthly Recurring Revenue (MRR)
- Churn rate
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
```

---

## 🎯 **SUCCESS METRICS FOR V2**

Track these to measure V2 success:

```
🎯 User Experience:
- Query execution time: <3 seconds (from 5-10s)
- Page load time: <1 second (from 3-5s)
- Mobile usage: 30%+ (from 0%)
- User satisfaction: 4.5/5 (from 3/5)

🎯 Business Impact:
- Trial sign-ups: +50%
- Trial → Paid: +30%
- Churn rate: -50%
- Support tickets: -40%

🎯 Technical Performance:
- Error rate: <0.1%
- Uptime: 99.9%
- API response time: <500ms average
- Database query time: <100ms average
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

**Week 1:**
- [ ] Sign up for PostHog (free)
- [ ] Sign up for Sentry (free)
- [ ] Install PostHog in frontend
- [ ] Install Sentry in frontend + backend
- [ ] Add basic event tracking
- [ ] Set up error alerts
- [ ] Enable Vercel analytics

**Week 2:**
- [ ] Create Product Health dashboard
- [ ] Create Performance dashboard
- [ ] Add custom business metrics
- [ ] Test all tracking events
- [ ] Verify alerts working

**Week 3:**
- [ ] Review first week of data
- [ ] Adjust tracking as needed
- [ ] Set up automated reports
- [ ] Document key metrics

---

## 💰 **COST BREAKDOWN**

```
PostHog: FREE (up to 1M events/month)
Sentry: FREE (up to 5K errors/month)
Vercel Analytics: FREE (included with Vercel)

Total: $0/month

If you exceed free tiers:
PostHog Pro: $0.00031 per event after 1M
Sentry: $26/month for 50K errors
Vercel Analytics: Included in Pro ($20/month)
```

---

## 🚀 **NEXT STEPS**

1. **Sign up for accounts** (15 min)
2. **I'll configure the tracking code** (Week 2)
3. **Deploy with analytics enabled** (Week 10)
4. **Monitor from Day 1** (ongoing)

**Result:** You'll know exactly how users are using AetherSignal V2 from launch day!

---

**This is ready to implement alongside the UI/UX redesign.** 🎯
