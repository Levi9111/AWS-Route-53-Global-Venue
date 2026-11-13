# Phase 6 (Part 1): Global Frontend Hosting & The HTTPS Proxy War

**Status:** ✅ Complete
**Dates:** November 13 – November 14, 2026
**Time invested:** ~4 hours (mostly debugging routing and caching)
**Cost impact:** ~$1.00 / month (S3 storage + CloudFront data transfer)

## 📌 The Big Picture (Context)
We had a globally distributed backend, but we needed a face for the application. The goal of this phase was to take our Next.js frontend, build it into static files, and serve it to users anywhere in the world with lightning speed and top-tier security. 

To do this, we used two AWS services:
1.  **Amazon S3:** A digital warehouse to store our HTML, CSS, and JS files.
2.  **Amazon CloudFront:** A Content Delivery Network (CDN). Think of it as a global network of delivery trucks that cache your website at edge locations (like New York, London, or Tokyo) so users don't have to wait for data to travel across the ocean.

But this phase wasn't just about uploading files. We ran into a classic web security roadblock that required a clever architectural workaround.

---

## 🎯 Objectives
- [x] Build the Next.js frontend with the correct production API URL.
- [x] Create a private S3 bucket and upload the static build files.
- [x] Create a CloudFront distribution with Origin Access Control (OAC) to keep the S3 bucket secure.
- [x] Fix the "403 Access Denied" error by configuring the S3 Bucket Policy.
- [x] Configure CloudFront Error Pages so Single Page App (SPA) routing works.
- [x] Solve the "Mixed Content" HTTPS security block using CloudFront as a Reverse Proxy.

---

## 🔨 The Implementation Journey (Step-by-Step)

### 1. The Build Process
Before we uploaded anything to AWS, we had to compile the Next.js application. 
*   **The Catch:** Next.js "bakes" environment variables into the static files during the build. Your frontend needs to know where the backend API is.
*   **The Action:** We ran `NEXT_PUBLIC_API_URL="https://..." npm run build`. This generated an `out` folder filled with all the static assets.

### 2. Locking Down S3 (The Digital Warehouse)
We created an S3 bucket named `venuefinder-frontend-199720489393...`. 
*   **The Security Decision:** We kept **Block All Public Access** turned ON. In the early days of the web, people made S3 buckets public, which often led to data leaks. Instead, we decided to keep the bucket strictly private and force all traffic to come through CloudFront.
*   **The Action:** We uploaded our `out` folder contents directly to the root of the S3 bucket.

### 3. Setting Up CloudFront (The Global Delivery Network)
We created a CloudFront distribution to serve the S3 bucket. We used **Origin Access Control (OAC)**, which acts like a secure digital handshake between CloudFront and S3. 
*   **The Result:** We copied the generated Bucket Policy into S3, granting *only* our specific CloudFront distribution permission to read the files.

### 4. The First Major Hurdle: "403 Access Denied"
When we visited our CloudFront URL (`https://d46vswlv62ic2.cloudfront.net`), we were greeted by an ugly `403 Access Denied` XML error.
*   **The Cause:** CloudFront was asking S3 for the root folder (`/`), but it didn't know to look for `index.html`. Because S3 didn't have a file literally named "root", it denied access.
*   **The Fix:** We went into the CloudFront settings and set the **Default Root Object** to `index.html`. Suddenly, our beautiful homepage loaded!

### 5. The Second Major Hurdle: Single Page App (SPA) Routing
When we clicked on a link like `/login` or `/register` and hit refresh, we got a 403 or 404 error.
*   **The Cause:** CloudFront asked S3 for a file named `login`. But Next.js is a Single Page App—it only has one `index.html` file. S3 didn't find a file called `login`, so it errored out.
*   **The Fix:** We configured **Custom Error Responses** in CloudFront. We told it: *"If you ever get a 403 or 404 error from S3, don't show an error page. Instead, serve `/index.html` with a 200 OK status."* This allowed the React router to take over and display the correct page.

---

## 🐛 The Boss Battle: The "Mixed Content" Block

This was the most challenging part of Phase 6. 

Our CloudFront website was secure, loading over **HTTPS**. However, our API (the ALB) was running on **HTTP**. 
When the frontend tried to fetch venue data from `http://venuefinder-alb...`, the browser completely blocked the request. 
*   **The Error:** `Mixed Content: The page was loaded over HTTPS, but requested an insecure resource...`
*   **Why?** This is a modern browser security feature. Browsers don't allow secure sites to talk to insecure sites, because a hacker could intercept the HTTP traffic.

### 💡 The Solution: The CloudFront Reverse Proxy
We couldn't buy an SSL certificate because we don't own a custom domain (SSL certificates in AWS require a domain). So, we used a clever Cloud Engineer trick: **We turned CloudFront into a middleman.**

1.  **Added the ALB as a second Origin:** We told CloudFront about our backend ALB.
2.  **Created an `/api/*` Behavior:** We told CloudFront: *"If the user requests a static file (like an image), get it from S3. But if the user requests anything starting with `/api/`, forward it to the ALB."*
3.  **Set Caching to Disabled:** We made sure CloudFront didn't cache the API responses (because we want real-time venue data).
4.  **Set Origin Request Policy to `AllViewer`:** This ensured that user headers, tokens, and query strings were passed to the backend.
5.  **Rebuilt the Frontend:** We rebuilt the frontend using `NEXT_PUBLIC_API_URL="https://d46vswlv62ic2.cloudfront.net"`. Now, the frontend talks securely over HTTPS to CloudFront, and CloudFront talks to the ALB.

---

## 🕵️‍♂️ The Debugging Detective Work

Getting the proxy to work felt like solving a mystery. Here are the hurdles we faced:

*   **The Phantom S3 Routing:** After creating the `/api/*` behavior, the API calls were *still* hitting S3. We discovered that CloudFront takes 5–15 minutes to "Deploy" changes globally. We had to wait for the `Deployed` status before testing.
*   **The Missing ALB Origin:** The `/api/*` behavior dropdown only showed S3. We realized the ALB origin was never actually saved. We had to go back and manually add the ALB DNS name to the Origins list.
*   **The Cached Error:** Even after fixing the behavior, CloudFront kept serving the cached HTML error page. We had to create an **Invalidation** for `/*` to force CloudFront to drop its old cache and look at the new routing rules.
*   **The Health Check Illusion:** When we tested `/api/health`, we saw the frontend homepage instead of JSON. Why? Because the Express backend doesn't have an `/api/health` route (only `/health`). It returned a 404, and CloudFront's Custom Error Page masked it by serving `index.html`. The routing was actually working perfectly!

---

## ✅ Verification & Evidence

- [x] **Frontend Loaded:** Navigating to `https://d46vswlv62ic2.cloudfront.net` loads the Next.js application over a secure connection.
- [x] **Venue Data Loaded:** The frontend successfully fetches and renders venue data from the backend API.
- [x] **No Mixed Content Errors:** The browser console is clean.

*📸 [Screenshot: 42-success-s3-frontend-uploaded.png]*
*📸 [Screenshot: 43-success-cloudfront-created.png]*
*📸 [Screenshot: 45-success-frontend-working.png (The fully loaded site!)]*

---

## 🎓 What I Learned

1.  **HTTPS vs. HTTP:** Browsers are incredibly strict about Mixed Content. If your frontend is HTTPS, your backend *must* be HTTPS or proxied through an HTTPS frontdoor.
2.  **CloudFront is Powerful:** CloudFront isn't just for caching static images. By using Origins and Behaviors, it can act as a secure Reverse Proxy to route traffic to multiple different backends.
3.  **SPA Routing is a Global Problem:** Because Single Page Apps don't have physical files for every route (`/login`, `/dashboard`), you *must* configure your web server to route all 404 errors back to `index.html`.
4.  **The Invalidation Button:** CloudFront caching is aggressive. Whenever you change a behavior or upload a new S3 file, you **must** create an Invalidation to see the changes.

