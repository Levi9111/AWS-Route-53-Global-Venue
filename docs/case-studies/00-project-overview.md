# Global VenueFinder: Engineering & Architectural Case Study

## 1. Executive Summary
**Global VenueFinder** is an ultra-luxury marketplace platform designed for architectural event spaces, corporate summits, galas, and landmark event productions. Operating across primary economic and cultural centers (New York, London, Dublin, Tokyo, San Francisco), the system delivers integer-precision sub-hour scheduling, zero-downtime multi-region cloud routing, and an editorial bento catalog experience.

---

## 2. Infrastructure & Cloud Topography (AWS Route 53 & ECS)

```
                       ┌────────────────────────┐
                       │   Global DNS Clients   │
                       └───────────┬────────────┘
                                   │
                                   ▼
                       ┌────────────────────────┐
                       │   AWS Route 53 DNS     │
                       │  • Geolocation Routing │
                       │  • Health Check Probes │
                       │  • Active-Active Fail  │
                       └─────┬────────────┬─────┘
                             │            │
            Health OK (US)   │            │ Health OK (EU)
                             ▼            ▼
               ┌────────────────┐      ┌────────────────┐
               │  us-east-1 ALB │      │  eu-west-1 ALB │
               └───────┬────────┘      └───────┬────────┘
                       │                       │
                       ▼                       ▼
               ┌────────────────┐      ┌────────────────┐
               │  ECS Fargate   │      │  ECS Fargate   │
               │ (Node/Express) │      │ (Node/Express) │
               └───────┬────────┘      └───────┬────────┘
                       │                       │
                       └───────────┬───────────┘
                                   │ Shared URI
                                   ▼
                       ┌────────────────────────┐
                       │ MongoDB Global Cluster │
                       │ Multi-Region ReplicaSet│
                       └────────────────────────┘
```

### Route 53 Multi-Region Strategies
1. **Health Check Probing:** Route 53 probes `/health` on port 5000 in both `us-east-1` and `eu-west-1`. If an availability zone or region degrades, Route 53 automatically fails over traffic to the healthy region within 30 seconds.
2. **Latency-Based & Geolocation Routing:** Route 53 maps European requests to `eu-west-1` and North American requests to `us-east-1` to minimize round-trip latencies.
3. **Stateless Backend Nodes:** Stateless Express services running on AWS ECS Fargate allow horizontal autoscaling without session stickiness or localized file persistence.

### Database Tier Persistence Architecture (Phase 02)
- **Dedicated 10 GiB EBS Volume:** Attached to the MongoDB EC2 instance to decouple database state from the compute host lifecycle, allowing instances to be terminated or upgraded without data loss and enabling independent EBS snapshot policies. See full documentation in [Phase 02 Case Study](./phase-02-mongodb-ec2.md).

---

## 3. Data Integrity & Concurrency Architecture

### Integer-Precision Financial Ledger
All financial transactions, hourly rates, and checkout totals are tracked in **minor currency units (cents)** as integer primitives. This eliminates IEEE 754 floating-point rounding errors across international currencies.

### Atomic Double-Booking Prevention
The platform enforces double-booking prevention through two coordinated layers:
1. **Pre-Insert Overlap Verification:** In `booking.service.ts`, before confirming any booking, a conflict query verifies that no active booking (`confirmed` or `pending`) overlaps the requested `[startTime, endTime]` window for that venue.
2. **Partial Compound Unique Index:** At the database engine layer, MongoDB enforces:
   ```typescript
   bookingSchema.index(
     { venueId: 1, startTime: 1, endTime: 1 },
     {
       unique: true,
       partialFilterExpression: { status: { $in: ['confirmed', 'pending'] } },
     }
   );
   ```
   If concurrent write requests bypass the application layer check simultaneously, the unique index raises a duplicate key error (`E11000`), immediately converted into a clean `409 CONFLICT` response.

---

## 4. UI/UX Design System: Editorial Luxury & Spatial Bento Grid

### Visual & Physical Elevation Hierarchy
- **Level 0 (Floor):** Obsidian background (`#0B0B0C`).
- **Level 1 (Resting Planes):** `#111113` surface with a subtle bevelled rim-light (`inset 0 1px 0 rgba(255,255,255,0.07)`).
- **Level 2 (Elevated / Hover Planes):** `#141417` surface lifting toward the diffuse top-left light source with a soft shadow (`0 12px 32px -4px rgba(0,0,0,0.7)`).
- **Level 3 (Pressed / Interactive Channels):** Recessed form input channels with dark inner shadows (`inset 0 1px 3px rgba(0,0,0,0.7)`).

### Perspective Modes
1. **Bento Editorial Grid:** An asymmetric showcase featuring a 2-column hero spotlight venue, micro-carousels, and architectural telemetry badges (sqft, ceiling clearance, acoustic rating).
2. **Split Runway & Interactive Radar Map:** Side-by-side synchronized list and map exploration for rapid geographic triage.
3. **Architectural Specifications Matrix:** A dense tabular comparison view contrasting acoustic treatments, structural styles, capacity ceilings, and real-time hourly rates.

---

## 5. Containerization & Verification

Both services feature non-root, multi-stage Alpine Dockerfiles:
- `route-53-backend/Dockerfile`: Node 22 Alpine builder stage compiles TypeScript with CEM convention validation, pruning dev dependencies into a slim runner container with an integrated fetch healthcheck. Image naming follows `venuefinder-backend` matching the AWS ECR repository, using `:latest` for initial MVP rollout (see [ADR-0003](../decisions/0003-image-naming-convention-ecr.md) and [Phase 03 Case Study](./phase-03-ecs-fargate.md)).
- `route-53-frontend/Dockerfile`: Multi-stage build producing static and dynamic Next.js App Router bundles served by an unprivileged `appuser`.
- `docker-compose.yml`: Coordinates MongoDB 7, backend daemon, and frontend web server with healthcheck dependencies.

---

## 6. SRE Operational Post-Mortems & Failure Diagnoses

| Incident | Root Cause | Diagnosis & Resolution | Phase |
| :--- | :--- | :--- | :--- |
| **EBS Volume Attach Ineligible** | Cross-AZ mismatch between EC2 (`us-east-1a`) and EBS (`us-east-1b`). | Re-provisioned volume in matching AZ; enforced explicit AZ targeting. | [Phase 02](./phase-02-mongodb-ec2.md) |
| **systemd Mount Table Cache Outdated** | Editing `/etc/fstab` does not automatically notify running `systemd` daemon. | Executed `sudo systemctl daemon-reload` to synchronize kernel mount state. | [Phase 02](./phase-02-mongodb-ec2.md) |
| **Mongo URI Credential Parse Failure** | Base64-generated password contained unescaped `/` delimiter. | Switched credential generation to hex (`openssl rand -hex 16`) to guarantee alphanumeric safety. | [Phase 02](./phase-02-mongodb-ec2.md) |
| **Missing ECS Cluster on Task Launch** | Cluster creation inadvertently skipped during task definition review. | Returned to ECS Console and provisioned Fargate cluster in `us-east-1` before service deployment. | [Phase 03](./phase-03-ecs-fargate.md) |


