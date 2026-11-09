# Phase 02: Database Tier Infrastructure & Persistence Architecture

## 1. Overview & Objectives
Phase 02 establishes the stateful data tier for the **Global VenueFinder** platform on AWS. The objective is to provide a reliable, performant, and isolated database host capable of serving stateless backend nodes across multiple AWS availability zones and regions.

---

## 2. Infrastructure Provisioned

- **Compute:** Dedicated AWS EC2 Instance running MongoDB 7.x LTS.
- **Security & Network Boundary:**
  - Dedicated Security Group (`mongo-sg`) restricting inbound port `27017` to authorized application tiers / VPC CIDRs.
  - SSH access restricted to bastion / administrator IP.
- **Storage Tier:**
  - Dedicated 10 GiB General Purpose SSD (gp3) EBS volume (`/dev/xvdf` / `/dev/nvme1n1`) attached to the instance and mounted to `/var/lib/mongodb`.

---

## 3. Key Decisions

### Decision: Attached a dedicated 10 GiB EBS volume for MongoDB data.

- **Why:** Decouples the database state from the EC2 lifecycle, allowing the instance to be terminated/upgraded without data loss, and enables dedicated EBS snapshots for backups.

### Architectural Benefits:
1. **Immutable Compute / Ephemeral Host Safety:** If the underlying EC2 instance fails or needs resizing (e.g. scaling from `t3.micro` to `t3.medium` or upgrading the OS), the root volume can be discarded while the 10 GiB data volume remains intact and immediately re-attachable.
2. **Snapshot Lifecycle & Point-in-Time Recovery:** Enables automated AWS Data Lifecycle Manager (DLM) snapshots specifically for the MongoDB data volume without snapshotting unnecessary operating system files.
3. **I/O Performance Predictability:** Separates MongoDB disk writes (WiredTiger journal and collection data) from OS logging, eliminating disk I/O starvation.

---

## 4. Verification Artifacts & Visual Proof

The following infrastructure milestones were verified and captured during provisioning:

- **Security Group Inbound Rules:** `docs/screenshots/07-mongo-sg-inbound-rules.png` — verified port `27017` ingress policies.
- **Compute Instance State:** `docs/screenshots/08-ec2-instance-running.png` — verified EC2 instance in `running` state with 2/2 status checks passed.
- **Storage Attachment:** `docs/screenshots/09-ebs-volume-attached.png` — verified 10 GiB EBS volume attached in `in-use` state to the database instance.

