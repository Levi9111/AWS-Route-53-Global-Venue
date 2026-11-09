# ADR 0002: Dedicated EBS Volume for MongoDB Data

## Status
Accepted

## Context
In Phase 02, MongoDB is deployed on an EC2 host to provide the shared stateful persistence tier for the stateless multi-region backend services. Storing data on the root EC2 volume creates a tight coupling between host compute lifecycles and database persistence.

## Decision
Attached a dedicated 10 GiB EBS volume for MongoDB data.

## Why / Rationale
Decouples the database state from the EC2 lifecycle, allowing the instance to be terminated/upgraded without data loss, and enables dedicated EBS snapshots for backups.

## Consequences
- **Positive:**
  - Zero data loss during EC2 instance reboots, resizing, or complete host termination.
  - Dedicated EBS volume snapshots without snapshotting the root OS disk.
  - Isolated I/O channel for WiredTiger storage engine.
- **Negative / Considerations:**
  - Requires mounting `/dev/xvdf` to `/var/lib/mongodb` and configuring `/etc/fstab` with `nofail` on system boot.

