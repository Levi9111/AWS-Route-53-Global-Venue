# ADR 0003: Container Image Naming Convention and Tagging for ECR

## Status
Accepted

## Context
As part of containerizing and deploying the backend services to AWS Elastic Container Registry (ECR) across target regions, a clear mapping between local image builds and remote cloud registries is required to eliminate naming ambiguity in container builds and deployment workflows.

## Decision
Used `venuefinder-backend` to match the ECR repository name, ensuring clear mapping between local builds and cloud registries. Used `:latest` tag for initial MVP deployment.

## Why / Rationale
- **1:1 Repository Parity:** Directly mirrors the AWS ECR repository identifier (`<account_id>.dkr.ecr.<region>.amazonaws.com/venuefinder-backend:latest`), minimizing friction and cognitive overhead during local builds, tagging, and push commands.
- **Unified Naming Across Environments:** Ensures consistent references across local development, multi-stage Dockerfiles, Docker Compose, and AWS ECS task definitions.
- **Rapid MVP Iteration:** Using `:latest` enables fast initial provisioning and sanity-testing of the ECS task definitions without managing multi-tag registry churn prior to automated CI/CD deployment pipelines.

## Consequences
- **Positive:**
  - Clear, unambiguous mapping from local build artifacts to cloud container registries.
  - Simplifies AWS CLI / Docker push workflow (`docker tag venuefinder-backend:latest <ecr-uri>:latest && docker push <ecr-uri>:latest`).
  - Standardizes task definition image references across both `us-east-1` and `eu-west-1`.
- **Negative / Considerations:**
  - For production post-MVP, immutable image tags (e.g., git commit SHA `venuefinder-backend:${GITHUB_SHA}`) should be introduced to guarantee deterministic rollbacks and prevent registry tag overwrites.

