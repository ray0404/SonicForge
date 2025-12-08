# The "Real-Time Nexus" (WebSocket Server)
​**Intent:** High-performance communication for multiplayer apps, chat, or device control.
**Key Features:** Low latency, Go or Node, Pub/Sub logic.

## Project Specification: "Real-Time Nexus" WebSocket Server

**Role:** Network Engineer
**Task:** Build a high-concurrency WebSocket Server template capable of broadcasting messages between multiple connected clients (Pub/Sub architecture).

### 1. Technical Stack
* **Language:** Go (Golang) - chosen for raw performance and low memory footprint on devices like Raspberry Pi.
* **Library:** `github.com/gorilla/websocket` or `melody`.
* **Protocol:** Raw WebSockets (universal compatibility).

### 2. Core Features
* **Hub Pattern:** Implement a "Hub" that maintains a registry of active clients.
* **Channels/Rooms:** Allow clients to join specific "topics" (e.g., `{"action": "join", "room": "lobby"}`).
* **Keep-Alive:** Automatic Ping/Pong handling to maintain connections on unstable mobile networks (Termux).

### 3. Developer Tools (CLI Focused)
* **Simulation:** specific `client_test.go` script that connects to the server and floods it with messages to test stability.
* **Makefile:**
    * `make run`: Runs the server.
    * `make build-pi`: Cross-compiles for Linux ARM64.

### 4. Output Requirements
* Generate the full Go module structure (`go.mod`, `main.go`, `hub.go`, `client.go`).
* Ensure the code is heavily commented to explain the concurrency model (Goroutines).
