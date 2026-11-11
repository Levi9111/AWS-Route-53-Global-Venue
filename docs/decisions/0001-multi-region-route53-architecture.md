# ADR 0001: Multi-Region Active Routing Architecture with Route 53

## Status
Accepted

## Context
Global VenueFinder serves event planners and attendees across North America and Europe. The platform requires high availability, resilience against regional cloud outages, and low-latency API access without multiplying operational database complexity.

## Decision
Deploy stateless backend microservices across two AWS regions (`us-east-1` and `eu-west-1`) fronted by Application Load Balancers and managed by AWS Route 53 DNS policies (Latency-Based and Health-Check Failover). Persist data in a centralized, dedicated MongoDB cluster.

## Why / Rationale
- **Latency Optimization:** Route 53 automatically directs client requests to the topologically nearest AWS region.
- **Automated Health-Checked Failover:** Route 53 probes `/health` on both regional ALBs every 10 seconds. If an entire region degrades, DNS traffic shifts to the healthy region within 30 seconds.
- **Stateless Simplicity:** Stateless containers on ECS Fargate avoid state synchronization issues, session stickiness, or distributed cache invalidation across regions.

## Consequences
- **Positive:**
  - High availability and automated disaster recovery.
  - Minimal regional routing latency.
- **Negative / Considerations:**
  - Cross-region egress charges from `eu-west-1` to the central database in `us-east-1`.
