# Phase 6: Frontend Deployment, HTTPS Proxying & CI/CD

**Status:** ✅ Complete
**Dates:** November 13 – November 14, 2026
**Time invested:** ~6 hours (mostly debugging routing and CI/CD credentials)
**Cost impact:** ~$1.50 / month (S3 Storage + CloudFront Data Transfer)

## 📌 Context
We had a globally distributed backend running on ECS, but it was invisible to the outside world. In this phase, we gave the application a face by deploying the Next.js frontend to Amazon S3 and serving it globally via Amazon CloudFront. 

More importantly, we transitioned from manual deployments to a true **Site Reliability Engineering (SRE)** workflow by building two independent **CI/CD pipelines using GitHub Actions**. Now, every push to the `main` branch automatically deploys the frontend and backend.

---

## 🎯 Objectives
- [x] Build the Next.js frontend with the correct production API URL.
- [x] Host the static files securely on Amazon S3.
- [x] Serve the frontend globally via CloudFront with Origin Access Control (OAC).
- [x] Solve Single Page Application (SPA) routing errors using CloudFront Custom Error Responses.
- [x] Defeat the "Mixed Content" HTTPS block using CloudFront as a Reverse Proxy.
- [x] Create a GitHub Actions pipeline for the Backend (ECR + ECS).
- [x] Create a GitHub Actions pipeline for the Frontend (S3 + CloudFront).

---

## 🔨 The Implementation Journey (Step-by-Step)

### 1. The Secure S3 Warehouse
We built the Next.js app locally using `npm run build`, which generated an `out` folder. We uploaded these files to an Amazon S3 bucket (`venuefinder-frontend-...`). 
*   **Crucial Security Decision:** We turned "Block All Public Access" **ON**. We did not expose the S3 bucket to the internet. Instead, we forced all traffic to come through CloudFront using **Origin Access Control (OAC)**. This meant only CloudFront had the "keys" to read the files.

### 2. Setting Up CloudFront (The CDN)
We created a CloudFront distribution to cache our website globally. This required us to set the **Default Root Object** to `index.html` so that visiting the base URL didn't show a directory error.

### 3. Solving the "Mixed Content" Boss Battle
This was the hardest part of the phase. 
Our CloudFront site loaded securely over **HTTPS** (`https://d46vswlv62ic2.cloudfront.net`). However, our ALB backend was running on **HTTP**. When the frontend tried to fetch data, the browser blocked it with a `Mixed Content` error to prevent man-in-the-middle attacks.

**The Solution:** We turned CloudFront into a **Reverse Proxy**. We added the ALB as a second "Origin" in CloudFront. Then, we created a behavior for `/api/*` that told CloudFront: *"If a user asks for anything starting with `/api/`, forward it internally to the ALB."* We rebuilt the frontend pointing to the CloudFront URL, and the browser security blocks vanished.

### 4. The CI/CD Pipelines (Automation)
We created two separate GitHub Actions workflows:
*   **`deploy.yml` (Backend):** Triggers when files in `route-53-backend` change. It logs into AWS, builds a new Docker image tagged with the Git commit hash, pushes it to ECR, and updates the ECS Task Definition.
*   **`deploy-frontend.yml` (Frontend):** Triggers when files in `route-53-frontend` change. It runs `npm ci`, builds the Next.js app, syncs it to S3, and creates a CloudFront invalidation to clear the cache.

---

## 🐛 Failures & Fixes (The Struggles)

This phase was a masterclass in debugging web routing, IAM permissions, and GitHub Actions.

### Failure 1: CloudFront 403 Access Denied (XML Error)
**Symptom:** Visiting the CloudFront URL resulted in an ugly XML `AccessDenied` error.
**Root Cause:** The S3 bucket policy granting CloudFront read access wasn't saved, or the Default Root Object wasn't set.
**Fix:** We manually pasted the auto-generated OAC bucket policy into S3, and set the CloudFront Default Root Object to `index.html`.

### Failure 2: SPA Routing Breaks on Refresh (403/404)
**Symptom:** Clicking `/login` worked, but refreshing the page resulted in a 404.
**Root Cause:** Next.js is a Single Page App. CloudFront was looking for a physical file named `login` in S3, which didn't exist.
**Fix:** We configured CloudFront **Custom Error Responses**. We told it to intercept any `403` or `404` error from S3 and serve `/index.html` with a `200 OK` status.

### Failure 3: The CloudFront "Ghost S3" Routing
**Symptom:** We created the `/api/*` behavior, but API calls were still being served the `index.html` file.
**Root Cause:** When editing the behavior, the Origin dropdown was accidentally left pointing to the S3 bucket instead of the newly created ALB Origin.
**Fix:** Edited the `/api/*` behavior and explicitly selected the ALB origin from the dropdown.

### Failure 4: CI/CD Frontend - `npm ci` Fails
**Symptom:** The GitHub Actions frontend pipeline failed on `npm ci` with a "lockfile" error.
**Root Cause:** The `package.json` was updated recently, but the `package-lock.json` was out of sync.
**Fix:** Ran `npm install` locally, committed the updated `package-lock.json`, and pushed.

### Failure 5: CI/CD Backend - "Unable to describe task definition"
**Symptom:** The backend deployment pipeline failed during the AWS CLI step.
**Root Cause:** The GitHub Secret `ECS_TASK_DEFINITION` was set to `venuefinder-backend-v2`, but the actual name in AWS was just `venuefinder-backend`.
**Fix:** Updated the GitHub Secret to match the exact family name in the ECS console.

### Failure 6: CI/CD Frontend - "s3:ListBucket" Access Denied
**Symptom:** The `aws s3 sync` command failed because the IAM user lacked permission.
**Root Cause:** The `AmazonS3FullAccess` policy wasn't attached correctly to the `github-actions-deployer` user.
**Fix:** Created a strict, inline IAM policy granting exactly `s3:ListBucket` on the bucket, and `s3:PutObject`/`s3:DeleteObject` on the bucket contents.

---

## 🤔 Key Decisions (ADRs)

| Decision | Alternatives Considered | Why This Way | Tradeoff Accepted |
| :--- | :--- | :--- | :--- |
| **CloudFront Reverse Proxy** | Buy a custom domain & SSL cert for ALB | Buying a domain costs money. A reverse proxy solves the Mixed Content block for free using native CloudFront routing. | Slightly more complex CloudFront configuration (Behaviors & Origin Policies). |
| **Commit Hash Image Tags** | Using `:latest` for Docker images | The `:latest` tag makes ECS rollbacks impossible because it always pulls the newest (potentially broken) code. | Slightly longer URLs in the ECS console. |
| **Path-based CI Triggers** | Running both pipelines on every push | If you change a README, you don't want to redeploy your entire backend. Using `paths` in GitHub Actions saves build minutes. | Requires carefully managing folder structures. |

---

## ✅ Verification & Evidence

- [x] **Frontend Hosted:** Site loads securely at `https://d46vswlv62ic2.cloudfront.net`.
- [x] **API Proxy Works:** The frontend successfully fetches venue data from the backend with zero browser console errors.
- [x] **Backend CI/CD:** Pushing a change to `route-53-backend` triggered a successful GitHub Actions run, updating the ECS Task.
- [x] **Frontend CI/CD:** Pushing a change to `route-53-frontend` triggered a successful build, S3 sync, and CloudFront invalidation.

*📸 [Screenshot: 45-success-frontend-working.png]*
*📸 [Screenshot: 51-success-cicd-backend-deployed.png]*
*📸 [Screenshot: 52-success-cicd-frontend-deployed.png]*

---

## 🎓 What I Learned
1.  **Modern Browser Security:** Browsers will absolutely block your app if you mix HTTP and HTTPS. CloudFront Reverse Proxying is a powerful, free way to secure traffic without buying custom domains.
2.  **SPA Architecture:** Static site hosts (like S3) don't understand client-side routing. You *must* configure error fallbacks to `index.html`.
3.  **CI/CD IAM Permissions:** Automated pipelines require strict IAM roles. Following the "Principle of Least Privilege" by writing inline policies is much safer than granting Admin access to a pipeline.
4.  **GitHub Actions Path Filtering:** By using `paths` in the workflow YAML, we created a highly efficient monorepo deployment strategy where backend and frontend deploy independently.
