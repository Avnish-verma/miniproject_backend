# Database Migration & Rollback Guide: NOVA

This guide documents the procedures for non-destructive schema migration, backups, and rollbacks for the MongoDB database.

---

## 1. Safety Backup Procedure

Before applying schema upgrades, a complete snapshot of all collections is generated:

```bash
npm run backup
```

* **Script**: `src/scripts/backup.js`
* **Output Destination**: `backup/db-snapshot-<timestamp>.json`
* **Contents**: Serialized JSON document arrays for `users`, `posts`, and `comments` along with collection record counts and timestamps.

---

## 2. Idempotent Migration

The migration applies compound indexes and default preference structures to existing users without modifying, deleting, or renaming existing fields:

```bash
npm run migrate
```

* **Script**: `src/scripts/migrate.js`
* **Operations**:
  1. Creates indexes: `users.userId` (unique), `users.emailId`, `posts.postedBy`, `posts.createdAt`, `comments.postId`, `comments.createdAt`.
  2. Updates user documents missing `privacy` or `appearance` preferences using `$set` without overwriting existing data.
  3. Validates that user, post, and comment counts match the baseline snapshot.

---

## 3. Rollback Procedure

If a migration failure occurs or data needs to be restored to its exact pre-migration state:

```bash
npm run rollback
```

* **Script**: `src/scripts/rollback.js`
* **Operation**: Reads the latest snapshot from `backup/`, clears collections, and re-inserts the exact pre-migration document sets with preserved ObjectIds.
