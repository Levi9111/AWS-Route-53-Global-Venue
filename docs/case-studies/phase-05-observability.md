# Phase 5: Observability & Alerting (CloudWatch & SNS)

**Status:** ✅ Complete  
**Dates:** November 13, 2026  
**Time invested:** ~2 hours  
**Cost impact:** ~$1.50 / month (CloudWatch metrics, dashboards, and SNS)  

---

## 📌 Context
Deploying an application is only half the battle; knowing when it breaks is the other half. This phase focuses on building the "Mission Control" for Global VenueFinder. We implemented centralized logging, infrastructure dashboards, and automated alerting to ensure we are notified immediately if the backend starts throwing server errors.

## 🎯 Objectives
- [x] Create an SNS Topic and subscribe an admin email for alerts.
- [x] Create a CloudWatch Alarm for HTTP 5XX errors on the US ALB.
- [x] Build a CloudWatch Dashboard to visualize ECS CPU and Memory utilization.
- [x] Graph metrics for both the US and EU regions on a single dashboard.
- [x] Implement a "Runbook" style description for the alarm to guide incident response.

---

## 🔨 Implementation Summary

1. **SNS Alerting:** Created the `venuefinder-alerts` SNS topic and confirmed an email subscription.
2. **CloudWatch Alarm:** Configured `venuefinder-us-5xx-alarm` to monitor `HTTPCode_Target_5XX_Count`. The alarm triggers if the sum exceeds 10 errors in a 5-minute period, notifying the SNS topic.
3. **CloudWatch Dashboard:** Built `venuefinder-global-ops`. Created widgets using the `ECS/ContainerInsights` namespace to graph `TaskCpuUtilization` and `MemoryUtilized` for both the US and EU ECS services.

---

## 🐛 Failures & Fixes (The CloudWatch Struggles)

CloudWatch is notoriously clunky, and this phase required bypassing several UI limitations.

### Failure 1: Metric Search Returned "No Matches"
- **Symptom:** Searching for `HTTPCode_Target_5XX_Count` in the CloudWatch console returned zero results.
- **Root Cause:** CloudWatch only creates a metric once a data point is published. Because the application was healthy and had not thrown any 5XX errors yet, the metric literally did not exist in the system.
- **Fix:** Bypassed the UI search entirely by clicking the **Source** tab and pasting the raw JSON query directly. This successfully instantiated the metric and allowed the alarm to be created.

### Failure 2: Dashboard Widgets Showed "No Data Available"
- **Symptom:** After creating dashboard widgets using JSON, the graphs were empty.
- **Root Cause:** The JSON used `CPUUtilization` and `MemoryUtilization` (the metrics for the standard `AWS/ECS` namespace). However, because Container Insights was enabled, the metrics were publishing to the `ECS/ContainerInsights` namespace, which uses different names (`TaskCpuUtilization` and `MemoryUtilized`). Furthermore, we were selecting individual `TaskId` metrics instead of the aggregated `ServiceName` metrics, which meant the graphs would break every time the task redeployed.
- **Fix:** Used the UI "Browse" tab to drill down into the `ECS/ContainerInsights` namespace, selected the `ClusterName, ServiceName` dimension (ignoring the ephemeral Task IDs), and updated the widgets with the correct metrics.

### Failure 3: The "Unsaved Dashboard" Trap
- **Symptom:** After spending 20 minutes building the dashboard and turning off the PC, returning the next day showed an empty dashboard.
- **Root Cause:** Adding a widget to a CloudWatch dashboard only updates the local browser state. It requires a distinct, global "Save" action in the top right corner to persist the layout.
- **Fix:** Recreated the widgets and clicked the global **Save** button.

---

## 🤔 Key Decisions (ADRs)

| Decision | Alternatives Considered | Why This Way | Tradeoff Accepted |
| :--- | :--- | :--- | :--- |
| **AWS CloudWatch** | Datadog, Prometheus + Grafana, ELK Stack | Deep native AWS integration. No extra agents to install on ECS. Free tier covers basic metrics. | User interface is notoriously difficult to navigate and less intuitive than Grafana. |
| **Runbook-Style Alarm Descriptions** | Simple one-line descriptions | Standard SRE practice. When an alert wakes you up at 3 AM, the description should tell you *exactly* what to check first. | Takes slightly longer to write, but drastically reduces Mean Time to Recovery (MTTR). |
| **Container Insights** | Standard ECS Metrics | Provides enhanced observability (per-task memory/CPU breakdown) out of the box. | Incurs minor additional CloudWatch metric costs. |

---

## ✅ Verification & Evidence

- [x] **SNS Subscription:** Email received and confirmed (`docs/screenshots/39-success-sns-topic-created.png`).
- [x] **Alarm Created:** `venuefinder-us-5xx-alarm` is active and in the `Insufficient Data` state (expected, as no errors have occurred) (`docs/screenshots/40-success-cloudwatch-5xx-alarm.png`).
- [x] **Dashboard Live:** The `venuefinder-global-ops` dashboard shows live `TaskCpuUtilization` (blue) and `MemoryUtilized` (orange) graphs for the US region (`docs/screenshots/41-success-cloudwatch-dashboard.png`).

---

## 📊 Metrics
- **Resources created:** 1 SNS Topic, 1 CloudWatch Alarm, 1 CloudWatch Dashboard.
- **Monthly cost delta:** ~$1.50.
- **Issues encountered:** 3 major CloudWatch UI/Metric quirks.

---

## 🎓 What I Learned
- **CloudWatch Metric Namespaces:** Learned the critical difference between `AWS/ECS` (standard) and `ECS/ContainerInsights` (enhanced) namespaces, and the importance of graphing by `ServiceName` rather than ephemeral `TaskId`.
- **JSON Source as a Fallback:** The CloudWatch UI is often buggy. Knowing how to construct and paste raw JSON queries via the "Source" tab is a mandatory CloudWatch skill.
- **The Power of Runbooks:** Writing a descriptive, Markdown-formatted alarm description turns an alert from a panic-inducing notification into an actionable runbook.

