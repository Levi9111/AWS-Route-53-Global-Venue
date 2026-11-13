# ADR 0004: Route 53 Private Hosted Zone, Latency-Based Routing & Independent Health Checks

## Status
Accepted

## Context
With stateless backend services deployed in both `us-east-1` (Virginia) and `eu-west-1` (Ireland) behind regional Application Load Balancers, the platform requires a unified DNS entrypoint (`api.internal.venuefinder.com`) that routes clients to the lowest-latency region and performs automated health-checked failover without purchasing a public domain.

## Decision
1. Provision a **Route 53 Private Hosted Zone** (`internal.venuefinder.com`) associated with both the `us-east-1` and `eu-west-1` VPCs (with `enableDnsSupport` and `enableDnsHostnames` enabled).
2. Configure **Latency-Based Routing** `A` Alias records for `api.internal.venuefinder.com` targeting the US ALB and EU ALB respectively.
3. Attach **independent per-region Route 53 Health Checks** (`Inverted: false`) probing `GET /health` on each ALB.

## Why / Rationale
- **Budget & Cost Discipline:** A Private Hosted Zone costs ~$0.50/month and avoids domain registration costs while exercising 100% of Route 53's latency routing and health-checking mechanics.
- **Blast Radius Isolation:** Sharing a single health check across US and EU records creates a catastrophic single point of failure (if US fails, both US and EU DNS records are evicted). Independent health checks ensure `eu-west-1` continues serving traffic if `us-east-1` degrades.
- **Full-Stack Health Verification:** Probing `/health` validates the ALB, ECS Fargate task, and live MongoDB connectivity (`admin().ping()`).

## Consequences
- **Positive:**
  - Lowest-latency regional routing across North America and Europe.
  - Automated DNS failover without manual intervention.
  - Zero domain registration overhead.
- **Negative / Considerations:**
  - Resolution of `internal.venuefinder.com` is scoped to the associated VPCs (requires VPN/Bastion/VPC-bound clients, or swapping to a Public Hosted Zone with a custom domain for public internet clients).

