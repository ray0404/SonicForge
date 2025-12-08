# The "Headless Sentinel" (Docker/Python Background Worker)
​**Intent:** Backend automation for Raspberry Pi/Server usage. No UI, just logic.
**Key Features:** Docker-first, Logging-first, structured for stability.

## Project Specification: "Headless Sentinel" Automation Template

**Role:** DevOps & Backend Engineer
**Task:** Generate a template for a Headless Microservice designed to run in a Docker container or as a systemd service on a Raspberry Pi or Linux Server.

### 1. Technical Stack
* **Language:** Python 3.11+
* **Core Library:** FastAPI (for lightweight webhook handling) + Typer (for CLI commands).
* **Task Queue:** Celery or RQ (Redis Queue) for background processing.
* **Containerization:** Docker + Docker Compose.

### 2. Architecture & Functionality
* **Purpose:** A skeleton to listen for triggers (cron schedules or HTTP requests) and execute heavy scripts (e.g., file conversion, scraping, data aggregation).
* **Structure:**
    * `/app/tasks/`: Directory for individual task scripts.
    * `/app/core/config.py`: Pydantic-based settings management reading from `.env`.
    * `/scripts/`: Shell scripts for setup and health checks.

### 3. Logging & Debugging (Strict Requirement)
* **Accessibility:** Since this runs in a CLI/Headless environment (Termux/Pi), standard GUI debugging is impossible.
* **Implementation:** Configure `Loguru` or `Structlog` to output JSON-formatted logs to a rotating file (`/logs/app.log`) AND `stdout`.
* **Health Check:** Include a `/health` endpoint that returns the status of the Redis connection and system uptime.

### 4. Output Requirements
* Provide a `Dockerfile` optimized for multi-arch (ARM64/AMD64).
* Provide a `docker-compose.yml` that spins up the App and a Redis instance.
* Provide the `requirements.txt` and main `main.py` entry point.
