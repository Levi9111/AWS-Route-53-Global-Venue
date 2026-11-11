# Architecture Decision Records (ADRs) & Decision Log

This directory contains the immutable record of key architectural decisions made during the design, implementation, and cloud deployment of the **Global VenueFinder** platform.

| ID | Title | Status | Date | Scope |
| :--- | :--- | :--- | :--- | :--- |
| [ADR-0001](./0001-multi-region-route53-architecture.md) | Multi-Region Active Routing Architecture with Route 53 | Accepted | 2026-11-09 | Cloud Infrastructure |
| [ADR-0002](./0002-dedicated-ebs-volume-mongodb.md) | Dedicated 10 GiB EBS Volume for MongoDB Data | Accepted | 2026-11-09 | Database Persistence (Phase 02) |
| [ADR-0003](./0003-image-naming-convention-ecr.md) | Container Image Naming Convention and Tagging for ECR | Accepted | 2026-11-11 | Containerization & Registry (Phase 03) |

---

## Decision Log Summary

### 1. Image Naming Convention & ECR Tagging
> **Decision:** Used `venuefinder-backend` to match the ECR repository name, ensuring clear mapping between local builds and cloud registries. Used `:latest` tag for initial MVP deployment.  
> **Impact:** 1:1 parity between local Docker builds, AWS ECR repositories, and ECS task definitions in both `us-east-1` and `eu-west-1`.

### 2. Dedicated 10 GiB EBS Volume for Database
> **Decision:** Attached a dedicated 10 GiB EBS volume for MongoDB data.  
> **Impact:** Decoupled database state from the EC2 lifecycle, allowing the instance to be terminated/upgraded without data loss, and enabled dedicated EBS snapshots for backups.

### 3. Route 53 Multi-Region Routing & Failover
> **Decision:** Employed Route 53 latency and failover routing with health checks probing stateless backend endpoints on port 5000 across `us-east-1` and `eu-west-1`.  
> **Impact:** High availability, zero-downtime regional failover within 30 seconds, and sub-50ms latencies for international clients.

