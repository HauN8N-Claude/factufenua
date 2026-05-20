#!/bin/bash

# Cursor worktree setup script for nowts app
# Runs when a worktree is created. Used for copying .env files and installing dependencies.

set -e

# Derive workspace name from current directory name
WORKSPACE_NAME=$(basename "$(pwd)")

echo "Setting up NowTS worktree: $WORKSPACE_NAME"

# Extract original database name from root .env first
ORIGINAL_DB=""
if [ -f "$ROOT_WORKTREE_PATH/.env" ]; then
    ORIGINAL_DB=$(grep "^DATABASE_URL=" "$ROOT_WORKTREE_PATH/.env" | sed 's/.*localhost:5432\///' | sed 's/".*//')
fi

if [ -z "$ORIGINAL_DB" ]; then
    echo "Error: Could not extract database name from root .env"
    exit 1
fi

NEW_DB_NAME="worktree-nowts-$WORKSPACE_NAME"

# Function to copy and update .env file with database URL replacement
update_env_file() {
    local env_path=$1
    local root_env_path="$ROOT_WORKTREE_PATH/$env_path"

    if [ -f "$root_env_path" ]; then
        cp "$root_env_path" "$env_path"
        echo "Copied $env_path"

        # Update database URLs with workspace-specific names
        if grep -q "^DATABASE_URL=" "$env_path"; then
            # Replace original db name with worktree db name
            sed -i.bak "s|postgresql://melvynx:@localhost:5432/$ORIGINAL_DB|postgresql://melvynx:@localhost:5432/$NEW_DB_NAME|g" "$env_path"
            rm -f "$env_path.bak"
            echo "Updated DATABASE_URLs in $env_path to use: $NEW_DB_NAME"
        fi
    else
        echo "Warning: $root_env_path not found"
    fi
}

# Copy and update .env files
echo "Copying .env files..."

# Update main .env file
update_env_file ".env"

# Copy .env-template if it exists
if [ -f "$ROOT_WORKTREE_PATH/.env-template" ]; then
    cp "$ROOT_WORKTREE_PATH/.env-template" ".env-template"
    echo "Copied .env-template"
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Generate Prisma client
echo "Generating Prisma client..."
pnpm prisma generate

echo "Original database: $ORIGINAL_DB"
echo "Creating database: $NEW_DB_NAME"

# Check if database already exists
if psql -U melvynx -lqt | cut -d \| -f 1 | grep -qw "$NEW_DB_NAME"; then
    echo "Database '$NEW_DB_NAME' already exists, skipping creation"
else
    createdb -U melvynx "$NEW_DB_NAME"

    # Check if original database exists and copy data
    if psql -U melvynx -lqt | cut -d \| -f 1 | grep -qw "$ORIGINAL_DB"; then
        echo "Found original database '$ORIGINAL_DB', copying data..."
        pg_dump -U melvynx --no-owner --no-privileges "$ORIGINAL_DB" | psql -U melvynx "$NEW_DB_NAME"
        echo "Data copied from '$ORIGINAL_DB' to '$NEW_DB_NAME'"
    else
        echo "Original database '$ORIGINAL_DB' not found, running migrations instead..."
        pnpm prisma migrate deploy
    fi
fi

echo "NowTS worktree '$WORKSPACE_NAME' setup completed!"
echo "Database: $NEW_DB_NAME"
echo "Ready to start development with: pnpm dev"
