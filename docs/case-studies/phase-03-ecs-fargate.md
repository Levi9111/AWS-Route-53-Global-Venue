# Phase 3: Containerization & ECS Fargate Deployment

**Status:** 🔄 In Progress / Validated  
**Dates:** November 11, 2026  
**Target Region:** `us-east-1` (Primary)  
**Workload:** Stateless Express + TypeScript API (`venuefinder-backend`)  

## 📌 Context
Following the provisioning of the persistent MongoDB data layer in Phase 2, Phase 3 containerizes the stateless backend service, publishes the image to Amazon Elastic Container Registry (ECR), and configures AWS ECS Fargate execution for scalable, serverless container orchestration without managing EC2 compute nodes.

## 🎯 Objectives
- [x] Create private AWS ECR repository (`venuefinder-backend`).
- [x] Build multi-stage Node 22 Alpine Docker image and push `:latest` tag to ECR.
- [x] Configure ECS Task Definition with production environment variables and container port mappings (`5000:5000`).
- [x] Provision ECS Fargate Cluster in `us-east-1`.
- [ ] Deploy ECS Service behind Application Load Balancer with Route 53 health checking.

## 🏗️ Architecture Position
The stateless backend containers execute on AWS ECS Fargate, establishing outbound connections to the MongoDB EC2 instance on port `27017` and serving inbound traffic from the regional Application Load Balancers on port `5000`.

---

## 🔨 Implementation

### 1. Container Registry (ECR)
- Created private repository `venuefinder-backend` in `us-east-1`.
- Authenticated Docker CLI via `aws ecr get-login-password` and pushed container image.
- *Visual Evidence:* `docs/screenshots/15-ecr-repo-created.png`, `docs/screenshots/16-ecr-image-pushed.png`.

### 2. Task Definition Configuration
- Configured Fargate task definition with 0.25 vCPU and 0.5 GB RAM.
- Mapped port `5000` for API endpoints and `/health` probe.
- Injected production environment secrets (`MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`).
- *Visual Evidence:* `docs/screenshots/18-task-definition-created.png`.

### 3. ECS Fargate Cluster Provisioning
- Established the ECS compute plane in `us-east-1` configured for AWS Fargate capacity providers.

---

## 🐛 Failures & Fixes

### Failure 1: Could not find ECS Cluster
**Symptom:** When attempting to launch tasks or associate a service from the newly created task definition, no target ECS cluster was available to select.  
**Diagnosis:** Inspected the ECS Console Clusters view and identified that only task definitions were present; the cluster list was empty in `us-east-1`.  
**Root Cause:** Cluster creation was inadvertently skipped during task definition review.  
**Fix:** Returned to ECS console and provisioned the Fargate cluster in `us-east-1`.  
**Lesson:** Infrastructure sequence matters: ECS clusters must be instantiated as the compute control plane before deploying tasks or defining services. Ensure deployment checklists mandate cluster verification before service creation.

---

## 🤔 Key Decisions (ADRs)

| Decision | Alternatives Considered | Why This Way | Tradeoff Accepted |
| :--- | :--- | :--- | :--- |
| **AWS ECS Fargate** over EC2 Instances | Self-managed EC2 ECS cluster | Serverless operational model eliminates OS patching, instance management, and cluster scaling overhead. | Slightly higher hourly compute cost per vCPU vs reserved EC2 instances. |
| **Image Naming Parity (`venuefinder-backend`)** | Environment-prefixed image names | Direct 1:1 mapping between local Docker builds, ECR repositories, and ECS task definitions ([ADR-0003](../decisions/0003-image-naming-convention-ecr.md)). | Requires replication configuration for secondary region (`eu-west-1`). |

---

## ✅ Verification & Evidence

- [x] **ECR Repository Creation:** `docs/screenshots/15-ecr-repo-created.png`
- [x] **Docker Image Push:** `docs/screenshots/16-ecr-image-pushed.png`
- [x] **Task Definition Specification:** `docs/screenshots/18-task-definition-created.png`
- [x] **ECS Cluster Provisioned:** Fargate compute plane active in `us-east-1`.
