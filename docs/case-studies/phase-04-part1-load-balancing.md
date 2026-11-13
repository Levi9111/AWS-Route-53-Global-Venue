# Phase 4 (Part 1): Application Load Balancers & Global Compute

**Status:** ✅ Complete  
**Dates:** November 12 – November 13, 2026  
**Time invested:** ~5 hours  
**Cost impact:** ~$16.00 / month (2x ALBs) + ~$9.00 / month (EU Fargate) = ~$25.00/mo  

---

## 📌 Context
To achieve a multi-region architecture, we need to expose the backend to the internet and deploy it in a second AWS region. This phase covers creating Application Load Balancers (ALBs) in both `us-east-1` and `eu-west-1`, updating security groups for cross-region database access, and attaching the ECS services to the ALBs using Target Groups.

## 🎯 Objectives
- [x] Create a public ALB in `us-east-1` with a `/health` Target Group.
- [x] Attach the US ECS Service to the US ALB.
- [x] Replicate the ECR image to the `eu-west-1` region.
- [x] Update the US MongoDB Security Group to allow EU access.
- [x] Deploy the EU ECS Cluster and Service connecting to the US database.
- [x] Create a public ALB in `eu-west-1` and attach the EU ECS Service.

---

## 🔨 Implementation Summary

1. **US ALB:** Created `venuefinder-alb-sg` (allow HTTP 80), Target Group (`venuefinder-tg-us-east-1`) routing to port 5000 with `/health` checks, and the ALB itself. Attached to ECS Service.
2. **Cross-Region Database Access:** Because the EU compute lives in Ireland and the database lives in Virginia, we updated the MongoDB Security Group (US) to allow inbound traffic on port 27017 from `0.0.0.0/0`.
3. **EU Compute:** Pushed the Docker image to an EU ECR repository. Created EU Security Groups, Task Definition (using the US Public IP for the database), ECS Cluster, and ECS Service.
4. **EU ALB:** Created `venuefinder-alb-eu` and Target Group (`venuefinder-tg-eu`) and attached them to the EU ECS Service.

---

## 🐛 Failures & Fixes (The Struggles)

This phase was dominated by AWS Console UI quirks, port mismatches, and Security Group handshakes.

### Failure 1: US Target Group shows "0 Targets"
- **Symptom:** After creating the US ALB and updating the ECS service, the Target Group remained completely empty (`0 Total targets`).
- **Root Cause:** The ECS Security Group (`venuefinder-ecs-sg`) did not have an inbound rule allowing the ALB to reach port 5000. The ALB's health check was silently blocked.
- **Fix:** Added an inbound rule to `venuefinder-ecs-sg` (Port 5000, Source: `venuefinder-alb-sg`). Forced a new deployment.

### Failure 2: EU Security Group Description Missing
- **Symptom:** Received `A security group description is required` when creating `venuefinder-ecs-sg-eu` and `venuefinder-alb-sg-eu`.
- **Root Cause:** AWS Console UI requires a description field even if you are just typing a space.
- **Fix:** Entered descriptive text for both security groups.

### Failure 3: EU Target Group Defaulted to Port 80
- **Symptom:** During EU Target Group creation, the review screen showed `HTTP: 80` instead of port `5000`.
- **Root Cause:** AWS defaults to port 80 unless explicitly changed in the previous step.
- **Fix:** Clicked "Previous," changed the port to `5000`, and re-verified the health check port was set to `traffic-port`.

### Failure 4: The EU Container Port Typo (`500` vs `5000`)
- **Symptom:** EU deployment hung in a rollback loop. The ALB container dropdown only showed `80:80` instead of `5000:5000`.
- **Root Cause:** When creating the EU Task Definition, the container port mapping was typo'd as `500` instead of `5000`. Because Task Definitions are immutable, the ECS Service could not map to the correct port.
- **Fix:** Created a new Task Definition revision (`venuefinder-backend-eu:3`) with the correct port `5000`. Updated the service to use the new revision.

### Failure 5: EU Target Group Empty after Service Update
- **Symptom:** Despite the EU ECS service showing `1 Running`, the EU Target Group still showed `0 Total targets`.
- **Root Cause:** The ECS Service had successfully deployed the task, but the Load Balancing configuration hadn't been properly saved to register the task with the ALB.
- **Fix:** Clicked **Update service** on the EU ECS service, expanded the **Load Balancing** section, and explicitly attached the ALB and Target Group.

---

## 🤔 Key Decisions (ADRs)

| Decision | Alternatives Considered | Why This Way | Tradeoff Accepted |
| :--- | :--- | :--- | :--- |
| **Cross-Region DB Access via `0.0.0.0/0`** | VPC Peering, AWS Transit Gateway, MongoDB Atlas | VPC Peering and Transit Gateway cost money and require complex route table modifications. Atlas costs $50+/mo. Opening port 27017 to the world (with strong auth) keeps the budget at $0. | **High Security Risk.** We are relying entirely on MongoDB authentication to protect the DB. This is strictly a budget-driven portfolio decision. |
| **Application Load Balancer (ALB)** | Network Load Balancer (NLB) | ALBs operate at Layer 7, support HTTP/HTTPS termination, and natively execute path-based health probes (hitting `/health`). | Higher monthly base cost than a basic NLB, but necessary for web application routing. |

---

## ✅ Verification & Evidence

- [x] **Target Group Registration:** Target groups registered healthy containers across both regions (`docs/screenshots/29-alb-target-group-created.png`, `docs/screenshots/31-success-target-group-healthy.png`).
- [x] **ALB Provisioning:** Verified public DNS entrypoints for both regional balancers (`docs/screenshots/30-alb-created.png`).
- [x] **US ALB Health Check:** Hitting the US ALB DNS name via a browser at `/health` returned HTTP 200:
  ```json
  {"status": "ok", "database": "connected", "uptime": 537.35}
  ```
  *Evidence:* `docs/screenshots/32-success-alb-health-endpoint.png`.
- [x] **EU ECS Connection:** CloudWatch logs in Ireland confirmed the backend successfully connected to the Virginia MongoDB instance over the public internet (`docs/screenshots/33-success-eu-ecs-logs.png`).
- [x] **EU ECS Service Health:** The service reached `1 running, 0 pending` and `Deployment status: Success` with revision `venuefinder-backend-eu:3`:
  *Evidence:* `docs/screenshots/35-success-eu-ecs-service-running.png`, `docs/screenshots/35-success-eu-ecs-service-running-healthy.png`.

---

## 📊 Metrics
- **Resources created:** 2 ALBs, 2 Target Groups, 2 ALB Security Groups, 2 ECS Security Groups, 1 EU ECR Repo, 1 EU Task Definition, 1 EU ECS Cluster, 1 EU ECS Service.
- **Monthly cost delta:** ~$25.00 / month (ALBs + EU Fargate).
- **Issues encountered:** 5 major blockers (SG handshake block, UI requirements, port defaults, port typo, registration failure).
- **Service availability:** 100% healthy target group registration across `us-east-1` and `eu-west-1`.

---

## 🎓 What I Learned
- **Multi-Layer Port Verification:** When deploying containers with Load Balancers, the port must match across three distinct layers: The Dockerfile (`EXPOSE`), the Task Definition (Container Port), and the Target Group (Protocol:Port). A mismatch in any of the three results in silent health check failures.
- **IAM & Security Group Handshakes:** The ALB and ECS tasks require reciprocal security group rules (ALB SG allows outbound to ECS SG, ECS SG allows inbound on application port from ALB SG).
- **Task Definition Immutability:** Task Definitions cannot be modified in-place. A single port typo requires authoring a new revision and updating or redeploying the ECS Service.
- **The Cost of Multi-Region Architecture:** Deploying across regions is technically straightforward but substantially increases baseline cost due to cross-region data transfer fees and duplicate hourly ALB provisioning charges.
