#!/bin/bash

# Cleanup script to delete all worktree databases
# Usage: ./cleanup-worktree-dbs.sh [--dry-run]

set -e

DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
    DRY_RUN=true
    echo "DRY RUN MODE - No databases will be deleted"
    echo ""
fi

echo "Looking for worktree databases (prefix: worktree-nowts-)..."
echo ""

# Get all databases matching the worktree pattern
WORKTREE_DBS=$(psql -U melvynx -lqt | cut -d \| -f 1 | grep -E "^\s*worktree-nowts-" | tr -d ' ' || true)

if [ -z "$WORKTREE_DBS" ]; then
    echo "No worktree databases found."
    exit 0
fi

echo "Found worktree databases:"
echo "$WORKTREE_DBS" | while read db; do
    echo "  - $db"
done
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "Would delete the above databases. Run without --dry-run to execute."
    exit 0
fi

read -p "Delete all these databases? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Deleting databases..."

echo "$WORKTREE_DBS" | while read db; do
    if [ -n "$db" ]; then
        echo "Dropping $db..."
        # Terminate connections
        psql -U melvynx -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db';" > /dev/null 2>&1 || true
        # Drop database
        dropdb -U melvynx "$db"
        echo "  Deleted $db"
    fi
done

echo ""
echo "All worktree databases cleaned up."
