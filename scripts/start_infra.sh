#!/bin/bash
# start_infra.sh - Automate the launch and recovery of local PostgreSQL and Redis servers.
# Evolved under the Sovereign Architect-Core protocol.

set -e

PROJECT_NAME="supernova"
POSTGRES_PORT=5432
REDIS_PORT=6379
MAX_ATTEMPTS=30

echo "=== INFRA BOOTLOADER & HEALTH RESTORER ==="

# Helper to check if a port is open
is_port_open() {
    nc -z localhost "$1" >/dev/null 2>&1
}

# 1. Start Docker if needed
start_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo "[INFRA] Docker daemon is not running."
        if [ -d "/Applications/Docker.app" ]; then
            echo "[INFRA] Found Docker Desktop. Launching..."
            open -a Docker
            echo -n "[INFRA] Waiting for Docker daemon to start..."
            for i in $(seq 1 $MAX_ATTEMPTS); do
                if docker info >/dev/null 2>&1; then
                    echo " OK!"
                    return 0
                fi
                echo -n "."
                sleep 2
            done
            echo " FAILED."
            return 1
        else
            echo "[INFRA] Docker is not installed in /Applications/Docker.app."
            return 1
        fi
    fi
    return 0
}

# 2. Check and start Postgres
if is_port_open $POSTGRES_PORT; then
    echo "[OK] Postgres port $POSTGRES_PORT is active."
else
    echo "[INFRA] Postgres is not running. Attempting start..."
    # Try Docker first
    if start_docker; then
        echo "[INFRA] Starting Postgres via Docker Compose..."
        docker-compose -p $PROJECT_NAME up -d postgres
    else
        # Try Brew
        if command -v brew >/dev/null 2>&1; then
            echo "[INFRA] Attempting Homebrew start for postgresql..."
            brew services start postgresql || brew services start postgresql@15 || brew services start postgresql@14
        else
            echo "[ERROR] No Docker or Homebrew found to launch Postgres."
            exit 1
        fi
    fi
fi

# 3. Check and start Redis
if is_port_open $REDIS_PORT; then
    echo "[OK] Redis port $REDIS_PORT is active."
else
    echo "[INFRA] Redis is not running. Attempting start..."
    # Try Docker first
    if start_docker; then
        echo "[INFRA] Starting Redis via Docker Compose..."
        docker-compose -p $PROJECT_NAME up -d redis
    else
        # Try Brew
        if command -v brew >/dev/null 2>&1; then
            echo "[INFRA] Attempting Homebrew start for redis..."
            brew services start redis
        else
            echo "[ERROR] No Docker or Homebrew found to launch Redis."
            exit 1
        fi
    fi
fi

# 4. Diagnostic Ping / Health Check
echo "[INFRA] Running diagnostic ping checks..."
PG_HEALTHY=false
REDIS_HEALTHY=false

for i in $(seq 1 $MAX_ATTEMPTS); do
    # Check Postgres
    if ! $PG_HEALTHY; then
        if is_port_open $POSTGRES_PORT; then
            if [ -n "$(docker ps --filter "name=supernova-postgres" --filter "status=running" -q)" ]; then
                if docker exec supernova-postgres pg_isready -U postgres >/dev/null 2>&1; then
                    PG_HEALTHY=true
                fi
            else
                if command -v pg_isready >/dev/null 2>&1; then
                    if pg_isready -h localhost -p $POSTGRES_PORT >/dev/null 2>&1; then
                        PG_HEALTHY=true
                    fi
                else
                    PG_HEALTHY=true
                fi
            fi
        fi
    fi

    # Check Redis
    if ! $REDIS_HEALTHY; then
        if is_port_open $REDIS_PORT; then
            if [ -n "$(docker ps --filter "name=supernova-redis" --filter "status=running" -q)" ]; then
                if [ "$(docker exec supernova-redis redis-cli ping 2>/dev/null | tr -d '\r')" = "PONG" ]; then
                    REDIS_HEALTHY=true
                fi
            else
                if command -v redis-cli >/dev/null 2>&1; then
                    if [ "$(redis-cli ping 2>/dev/null)" = "PONG" ]; then
                        REDIS_HEALTHY=true
                    fi
                else
                    REDIS_HEALTHY=true
                fi
            fi
        fi
    fi

    if $PG_HEALTHY && $REDIS_HEALTHY; then
        echo "[OK] Infrastructure is fully active and healthy."
        break
    fi

    echo -n "."
    sleep 1
done

if [ "$PG_HEALTHY" = false ] || [ "$REDIS_HEALTHY" = false ]; then
    echo "[ERROR] Health check failed."
    echo "Postgres Healthy: $PG_HEALTHY"
    echo "Redis Healthy: $REDIS_HEALTHY"
    exit 1
fi
