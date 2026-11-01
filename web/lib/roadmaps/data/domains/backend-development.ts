import type { RoadmapData } from "../../types";

export const backendDevelopmentRoadmap: RoadmapData = {
  id: "backend-development",
  slug: "backend-development",
  title: "Backend Development",
  description: "Complete, all-in-one guide to Backend Systems Architecture. Master Network Protocols (TCP/UDP, HTTP/3), Language Runtimes (Node.js, Go, Python), Relational SQL & ACID Transactions, Redis Caching, Microservices, OAuth 2.0/OIDC Security, Kafka Event Streaming, and System Design for Scale.",
  category: "systems",
  badgeText: "Recommended",
  iconName: "Server",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Backend Developer Roadmap" },
    },
    // 1. Networking & Protocols
    {
      id: "networking-protocols",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Internet & Networking Protocols",
        category: "Fundamentals",
        description: `### 🌐 Low-Level Network Protocols & Socket Programming

Backend servers live on the transport and application layers of the OSI stack.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 8,
      },
    },
    {
      id: "sub-tcp-udp",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "TCP/IP, UDP & Sockets",
        colorKey: "C",
        description: `### 🔌 TCP vs UDP vs Unix Sockets

Choose the right transport protocol for your backend service.

---

### 1. TCP 3-Way Handshake & Teardown
- **Connection Establishment**:
  1. Client $\\rightarrow$ Server: \`SYN\` (Synchronize with sequence number $X$).
  2. Server $\\rightarrow$ Client: \`SYN-ACK\` (Acknowledge $X+1$, Synchronize with sequence $Y$).
  3. Client $\\rightarrow$ Server: \`ACK\` (Acknowledge $Y+1$). Connection established!
- **Connection Teardown**: \`FIN\` $\\rightarrow$ \`ACK\` $\\rightarrow$ \`FIN\` $\\rightarrow$ \`ACK\` with \`TIME_WAIT\` socket state.

---

### 2. TCP vs UDP Tradeoffs
- **TCP**: Guaranteed packet ordering, automatic retransmission on loss, flow control (sliding window), and congestion avoidance (CUBIC/BBR).
- **UDP**: Zero handshake overhead, stateless datagrams, no retransmissions. Ideal for real-time multiplayer games, voice streaming, and DNS lookups.
`,
      },
    },
    {
      id: "sub-http-tls",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "HTTP/1.1 vs HTTP/2 vs HTTP/3 & TLS",
        colorKey: "C",
        description: `### ⚡ TLS 1.3 Asymmetric Handshake & Zero Round-Trip Time

How modern TLS 1.3 encrypts traffic with minimum latency.

---

### 1. TLS 1.3 Handshake (1-RTT & 0-RTT)
- **1-RTT Handshake**: Client sends supported ciphers + Diffie-Hellman key share in the very first \`ClientHello\`. The server responds with its key share and certificate. Data encryption begins immediately!
- **0-RTT Resumption (Early Data)**: Returning clients can send encrypted request data in the first packet using pre-shared keys (PSK).
`,
      },
    },

    // 2. Language & Runtimes
    {
      id: "backend-languages",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Server Languages & Concurrency Models",
        category: "Runtimes",
        description: `### ⚙️ Concurrency Models: Async Event Loops vs Multithreading vs Goroutines

Pick a backend language and understand how the OS and runtime manage memory and CPU threads.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-nodejs-runtime",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "Node.js & TypeScript (Libuv / Event Loop)",
        colorKey: "C",
        description: `### 🟢 Node.js Architecture & Streaming I/O

Leverage V8 and Libuv for high-throughput I/O.

\`\`\`typescript
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

// Process gigabytes of log files with minimal RAM usage:
async function compressLogFile(sourcePath: string, destPath: string) {
  await pipeline(
    createReadStream(sourcePath),
    createGzip(),
    createWriteStream(destPath)
  );
  console.log('Compression complete with constant memory footprint!');
}
\`\`\`
`,
      },
    },
    {
      id: "sub-golang-goroutines",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "Golang & Concurrency (Goroutines / Channels)",
        colorKey: "C",
        description: `### 🐹 Go Concurrency Primitives

Lightweight M:N goroutine scheduler with CSP channels.

\`\`\`go
package main

import (
	"fmt"
	"sync"
	"time"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		time.Sleep(time.Millisecond * 50) // simulate work
		results <- j * 2
	}
}

func main() {
	jobs := make(chan int, 100)
	results := make(chan int, 100)
	var wg sync.WaitGroup

	// Spawn 3 concurrent worker goroutines
	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	for j := 1; j <= 9; j++ {
		jobs <- j
	}
	close(jobs)

	wg.Wait()
	close(results)

	for r := range results {
		fmt.Println("Result:", r)
	}
}
\`\`\`
`,
      },
    },
    {
      id: "sub-python-fastapi",
      type: "subtopic",
      position: { x: 240, y: 380 },
      data: {
        label: "Python (FastAPI & AsyncIO)",
        colorKey: "C",
        description: `### 🐍 FastAPI & Pydantic Data Validation

High-performance asynchronous Python REST APIs.

\`\`\`python
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr

app = FastAPI(title="CodeBreakers API", version="1.0.0")

class UserRegisterDto(BaseModel):
    name: str
    email: EmailStr
    age: int

@app.post("/api/v1/users", status_code=status.HTTP_201_CREATED)
async def create_user(dto: UserRegisterDto):
    if dto.age < 18:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be at least 18 years old"
        )
    return {"status": "success", "data": dto}
\`\`\`
`,
      },
    },

    // 3. Relational Databases & SQL
    {
      id: "relational-databases",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Relational Databases & SQL Deep Dive",
        category: "Databases",
        description: `### 🗄️ PostgreSQL, B-Tree Indexes, ACID & Normalization

The reliable backbone of enterprise data persistence.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-postgres-acid",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "PostgreSQL & ACID Transactions",
        colorKey: "C",
        description: `### 🛡️ ACID Guarantees & Isolation Anomalies

Prevent race conditions like Dirty Reads, Non-Repeatable Reads, and Phantom Reads.

---

### 1. SQL Isolation Levels
| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Serialization Anomaly |
|---|:---:|:---:|:---:|:---:|
| **Read Uncommitted** | Allowed | Allowed | Allowed | Allowed |
| **Read Committed (Postgres Default)** | **Prevented** | Allowed | Allowed | Allowed |
| **Repeatable Read** | **Prevented** | **Prevented** | **Prevented** | Allowed |
| **Serializable** | **Prevented** | **Prevented** | **Prevented** | **Prevented** |
`,
      },
    },
    {
      id: "sub-sql-indexes",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "B-Tree Indexes & EXPLAIN ANALYZE",
        colorKey: "C",
        description: `### ⚡ PostgreSQL Query Optimization & Indexing

Inspect query execution plans with \`EXPLAIN (ANALYZE, BUFFERS)\`.

\`\`\`sql
-- 1. Create composite B-Tree index for filtered ordering
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);

-- 2. Create partial index to index only active records (saves 90% disk RAM!)
CREATE INDEX idx_active_users ON users (email) WHERE is_active = true;

-- 3. Analyze execution plan
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders 
WHERE user_id = 'usr_102' 
ORDER BY created_at DESC 
LIMIT 20;
\`\`\`
`,
      },
    },

    // 4. NoSQL & In-Memory Stores
    {
      id: "nosql-caching",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "NoSQL Databases & In-Memory Caching",
        category: "Databases",
        description: `### ⚡ Redis, MongoDB, DynamoDB & In-Memory Caching

Scale read-heavy and unstructured document workloads.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-redis-structures",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "Redis Data Structures & Eviction",
        colorKey: "C",
        description: `### 📊 Redis Real-Time Leaderboards (Sorted Sets)

Implement global leaderboard ranking in $O(\\log N)$ time.

\`\`\`bash
# Add member points into Sorted Set (ZSET)
ZADD leaderboard 1500 "Alex"
ZADD leaderboard 1850 "Priya"
ZADD leaderboard 1200 "Rohan"

# Get top 3 players with scores (highest first)
ZREVRANGE leaderboard 0 2 WITHSCORES

# Get user rank (0-indexed)
ZREVRANK leaderboard "Alex"
\`\`\`
`,
      },
    },
    {
      id: "sub-mongodb-dynamo",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "MongoDB & DynamoDB (Document / Key-Value)",
        colorKey: "C",
        description: `### 📑 Document Databases & Single-Table DynamoDB Design

Choose between rich document queries and single-digit millisecond key-value lookups.

#### Key Takeaways:
- **MongoDB**: Aggregation pipelines (\`$match\`, \`$group\`, \`$lookup\`), dynamic schemas, replica sets with automated leader election.
- **DynamoDB**: Overload Partition Key (\`PK\`) and Sort Key (\`SK\`) to store multiple entity types in a single table without joins.
`,
      },
    },

    // 5. API Architecture & Standards
    {
      id: "api-architectures",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "API Architecture: REST, GraphQL & gRPC",
        category: "APIs",
        description: `### 🔌 API Design, gRPC Protobufs & WebSockets

Build predictable public APIs and ultra-fast microservice RPC channels.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-rest-openapi",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "RESTful APIs & OpenAPI Specifications",
        colorKey: "C",
        description: `### 📑 REST API Contract & Versioning Strategy

Version APIs safely without breaking existing mobile and web clients.

#### Versioning Strategies:
- **URI Path Versioning (Recommended)**: \`/api/v1/users\` $\\rightarrow$ \`/api/v2/users\`.
- **Header Versioning**: \`Accept: application/vnd.company.v2+json\`.
- **Query Parameter**: \`/api/users?version=2\`.
`,
      },
    },
    {
      id: "sub-grpc-protobuf",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "gRPC & Protocol Buffers (Protobuf)",
        colorKey: "C",
        description: `### 🚀 Microservice gRPC Schema

Define type-safe binary contracts between backend services.

\`\`\`protobuf
syntax = "proto3";

package auth;

service AuthService {
  rpc VerifyToken (TokenRequest) returns (UserResponse);
}

message TokenRequest {
  string token = 1;
}

message UserResponse {
  string user_id = 1;
  string email = 2;
  repeated string roles = 3;
}
\`\`\`
`,
      },
    },

    // 6. Security, Authentication & Authorisation
    {
      id: "auth-security-backend",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Authentication, Authorization & Security",
        category: "Security",
        description: `### 🔐 OAuth 2.0, JWT Tokens, RBAC & OWASP Defenses

Protect backend endpoints against data breaches and unauthorized mutations.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-oauth-jwt",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "OAuth 2.0, OIDC & JWT Tokens",
        colorKey: "C",
        description: `### 🔑 OAuth 2.0 Authorization Code Flow with PKCE

The gold standard for single-page apps and mobile authentication.

1. Client generates \`code_verifier\` (random string) and computes \`code_challenge = SHA256(code_verifier)\`.
2. Client redirects user to OAuth Provider with \`code_challenge\`.
3. User approves $\\rightarrow$ Provider returns short-lived \`auth_code\`.
4. Client exchanges \`auth_code\` + \`code_verifier\` for JWT Access & Refresh Tokens.
`,
      },
    },
    {
      id: "sub-rbac-owasp",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "RBAC, Rate Limiting & OWASP Top 10",
        colorKey: "C",
        description: `### 🛡️ Token Bucket Rate Limiting Algorithm

Prevent DDoS and brute-force attacks on login endpoints.

\`\`\`typescript
import { redis } from "@/lib/redis";

export async function checkRateLimit(ip: string, limit = 60, windowSec = 60): Promise<boolean> {
  const key = \`rate_limit:\${ip}\`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSec);
  }

  return current <= limit;
}
\`\`\`
`,
      },
    },

    // 7. Message Brokers & Asynchronous Queues
    {
      id: "message-brokers-stream",
      type: "topic",
      position: { x: 550, y: 1320 },
      data: {
        label: "Message Queues & Event Streaming",
        category: "Architecture",
        description: `### 📨 Apache Kafka, RabbitMQ & Asynchronous Event Processing

Decouple compute-heavy jobs and stream millions of events per second.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-kafka-eventing",
      type: "subtopic",
      position: { x: 860, y: 1280 },
      data: {
        label: "Apache Kafka & Event-Driven Architecture",
        colorKey: "C",
        description: `### 📦 Kafka Partitions, Consumer Groups & Offsets

High-throughput distributed commit log architecture.

#### Key Mechanics:
- **Partitions**: Horizontal units of parallelism. Messages with the same key are guaranteed to land on the same partition and preserve strict ordering.
- **Consumer Groups**: Multiple worker instances share the partition load.
- **Replays**: Consumers can rewind offsets to re-process historical events!
`,
      },
    },
    {
      id: "sub-rabbitmq-bullmq",
      type: "subtopic",
      position: { x: 860, y: 1330 },
      data: {
        label: "RabbitMQ & BullMQ (Background Workers)",
        colorKey: "C",
        description: `### 🐂 BullMQ Background Job Queue Example

Process background emails and PDF generation with automatic retry backoff.

\`\`\`typescript
import { Queue, Worker } from 'bullmq';

const emailQueue = new Queue('email-queue', { connection: { host: 'localhost', port: 6379 } });

// 1. Add job from API endpoint
await emailQueue.add('sendWelcomeEmail', { email: 'alex@example.com' }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
});

// 2. Worker executes in background
const worker = new Worker('email-queue', async (job) => {
  console.log(\`Sending email to \${job.data.email}...\`);
}, { connection: { host: 'localhost', port: 6379 } });
\`\`\`
`,
      },
    },

    // 8. System Design, Scaling & Observability
    {
      id: "system-design-microservices",
      type: "topic",
      position: { x: 550, y: 1520 },
      data: {
        label: "System Design & Distributed Scaling",
        category: "System Design",
        description: `### 🏗️ Horizontal Scaling, Microservices, Sharding & OpenTelemetry

Design resilient distributed systems that scale to millions of concurrent users.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 30,
      },
    },
    {
      id: "sub-load-balancer-proxy",
      type: "subtopic",
      position: { x: 240, y: 1480 },
      data: {
        label: "Load Balancing & Reverse Proxies (Nginx/HAProxy)",
        colorKey: "C",
        description: `### ⚖️ Load Balancing Algorithms & Reverse Proxies

- **Round Robin**: Distributes requests sequentially across active backend pools.
- **Least Connections**: Sends requests to the server with fewest active connections.
- **Consistent Hashing**: Minimizes key remapping when cache servers are added or removed.
`,
      },
    },
    {
      id: "sub-observability-tracing",
      type: "subtopic",
      position: { x: 240, y: 1530 },
      data: {
        label: "Observability: Metrics, Logs & Distributed Tracing",
        colorKey: "C",
        description: `### 🔭 Distributed Tracing with OpenTelemetry (Jaeger)

Trace a single request as it hops across 10 microservices.

#### The Trace Context:
- **Trace ID**: Unique 128-bit hex string identifying the overall user transaction.
- **Span ID**: Identifies individual operation timings (DB query, gRPC call, cache read).
- Injected into HTTP headers via W3C Trace Context: \`traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01\`.
`,
      },
    },

    // 9. Milestone
    {
      id: "milestone-backend-architect",
      type: "milestone",
      position: { x: 550, y: 1720 },
      data: {
        label: "Certified Backend Architect",
        category: "Milestone",
        description: `### 🎓 Backend Systems Mastery Attained!

You have completed the entire Backend Engineering curriculum:
- Low-level network transport (TCP/UDP, HTTP/3, TLS 1.3).
- Concurrency runtimes (Node.js event loop, Go goroutines, Python ASGI).
- PostgreSQL ACID transactions, query execution plans & Redis caching.
- RESTful OpenAPI, gRPC Protocol Buffers & OAuth 2.0 PKCE authentication.
- Kafka distributed event streaming & BullMQ background job orchestration.
- Distributed system design, horizontal sharding & OpenTelemetry tracing.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-be-1", source: "networking-protocols", target: "backend-languages", type: "interactive" },
    { id: "e-be-2", source: "backend-languages", target: "relational-databases", type: "interactive" },
    { id: "e-be-3", source: "relational-databases", target: "nosql-caching", type: "interactive" },
    { id: "e-be-4", source: "nosql-caching", target: "api-architectures", type: "interactive" },
    { id: "e-be-5", source: "api-architectures", target: "auth-security-backend", type: "interactive" },
    { id: "e-be-6", source: "auth-security-backend", target: "message-brokers-stream", type: "interactive" },
    { id: "e-be-7", source: "message-brokers-stream", target: "system-design-microservices", type: "interactive" },
    { id: "e-be-8", source: "system-design-microservices", target: "milestone-backend-architect", type: "interactive" },

    // Subtopics
    { id: "e-be-sub-1", source: "networking-protocols", target: "sub-tcp-udp" },
    { id: "e-be-sub-2", source: "networking-protocols", target: "sub-http-tls" },

    { id: "e-be-sub-3", source: "backend-languages", target: "sub-nodejs-runtime" },
    { id: "e-be-sub-4", source: "backend-languages", target: "sub-golang-goroutines" },
    { id: "e-be-sub-5", source: "backend-languages", target: "sub-python-fastapi" },

    { id: "e-be-sub-6", source: "relational-databases", target: "sub-postgres-acid" },
    { id: "e-be-sub-7", source: "relational-databases", target: "sub-sql-indexes" },

    { id: "e-be-sub-8", source: "nosql-caching", target: "sub-redis-structures" },
    { id: "e-be-sub-9", source: "nosql-caching", target: "sub-mongodb-dynamo" },

    { id: "e-be-sub-10", source: "api-architectures", target: "sub-rest-openapi" },
    { id: "e-be-sub-11", source: "api-architectures", target: "sub-grpc-protobuf" },

    { id: "e-be-sub-12", source: "auth-security-backend", target: "sub-oauth-jwt" },
    { id: "e-be-sub-13", source: "auth-security-backend", target: "sub-rbac-owasp" },

    { id: "e-be-sub-14", source: "message-brokers-stream", target: "sub-kafka-eventing" },
    { id: "e-be-sub-15", source: "message-brokers-stream", target: "sub-rabbitmq-bullmq" },

    { id: "e-be-sub-16", source: "system-design-microservices", target: "sub-load-balancer-proxy" },
    { id: "e-be-sub-17", source: "system-design-microservices", target: "sub-observability-tracing" },
  ],
};
