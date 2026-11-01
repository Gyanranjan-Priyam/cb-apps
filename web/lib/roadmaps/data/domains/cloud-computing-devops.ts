import type { RoadmapData } from "../../types";

export const cloudComputingDevOpsRoadmap: RoadmapData = {
  id: "cloud-computing-devops",
  slug: "cloud-computing-devops",
  title: "Cloud Computing & DevOps",
  description: "Complete, all-in-one guide to Cloud Architecture & DevOps Engineering. Master Linux Administration, VPC Cloud Networking, Docker Containerization, Kubernetes (K8s) Cluster Orchestration, Infrastructure as Code (Terraform), GitHub Actions CI/CD, GitOps with ArgoCD, and Prometheus/Grafana SRE Observability without needing external materials.",
  category: "cloud-devops",
  badgeText: "Enterprise Track",
  iconName: "Cloud",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Cloud Computing & DevOps Roadmap" },
    },
    // 1. Linux & Bash Scripting
    {
      id: "linux-fundamentals",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Linux Systems & Bash Scripting",
        category: "Operating Systems",
        description: `### 🐧 Linux Administration & Shell Automation

The underlying OS running the world's cloud servers, containers, and Kubernetes nodes.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-linux-permissions-proc",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "Linux File Hierarchy, Permissions & Systemd",
        colorKey: "C",
        description: `### ⚙️ Systemd Service Unit Configuration

Manage background daemon services with automatic crash restarts.

\`\`\`ini
# /etc/systemd/system/api-server.service
[Unit]
Description=CodeBreakers Node API Backend
After=network.target postgresql.service

[Service]
Type=simple
User=appuser
WorkingDirectory=/var/www/app
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target
\`\`\`

\`\`\`bash
sudo systemctl daemon-reload
sudo systemctl enable --now api-server
\`\`\`
`,
      },
    },
    {
      id: "sub-bash-automation",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "Bash Scripting, Pipes & Cron Automation",
        colorKey: "C",
        description: `### 📜 Production Bash Script Template

\`\`\`bash
#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -euo pipefail
IFS=$'\n\t'

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_NAME="codebreakers_db"

mkdir -p "\${BACKUP_DIR}"

echo "[$(date)] Starting backup for \${DATABASE_NAME}..."
pg_dump -U postgres -d "\${DATABASE_NAME}" | gzip > "\${BACKUP_DIR}/\${DATABASE_NAME}_\${TIMESTAMP}.sql.gz"

# Retain only last 7 days of backups
find "\${BACKUP_DIR}" -type f -mtime +7 -name "*.sql.gz" -delete
echo "[$(date)] Backup completed successfully!"
\`\`\`
`,
      },
    },

    // 2. Networking & Cloud Protocols
    {
      id: "networking-cloud-infra",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Cloud Networking & Security Groups",
        category: "Networking",
        description: `### 🌐 VPCs, Subnets, CIDR Blocks, NAT Gateways & DNS

Design isolated, secure virtual network topographies in AWS/GCP.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 14,
      },
    },
    {
      id: "sub-vpc-subnets",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "VPC Architecture: Public/Private Subnets & NAT",
        colorKey: "C",
        description: `### 🛡️ Enterprise VPC Topology

- **VPC CIDR**: \`10.0.0.0/16\` ($65,536$ addresses).
- **Public Subnet** (\`10.0.1.0/24\`): Connected to Internet Gateway (\`IGW\`). Hosts Application Load Balancers.
- **Private App Subnet** (\`10.0.10.0/24\`): Outbound routing via NAT Gateway. Hosts ECS/K8s app nodes.
- **Isolated DB Subnet** (\`10.0.20.0/24\`): Zero internet access. Hosts RDS PostgreSQL replica cluster.
`,
      },
    },
    {
      id: "sub-security-groups-nacl",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "Security Groups vs Network ACLs",
        colorKey: "C",
        description: `### 🔒 Security Groups (Stateful) vs NACLs (Stateless)

- **Security Group (Instance level)**: Inbound allow rule for port 443 automatically permits outgoing response traffic without explicit egress rules.
- **NACL (Subnet boundary)**: Evaluated in numbered rule order ($100, 200, 300$). Requires both inbound and ephemeral outbound port allowances (\`1024-65535\`).
`,
      },
    },

    // 3. Containerization (Docker)
    {
      id: "docker-containers",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Docker Containerization & Multi-Stage Builds",
        category: "Containers",
        description: `### 🐳 Production Docker Images, Layers & Docker Compose

Package software along with its complete runtime dependencies into immutable container images.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 16,
      },
    },
    {
      id: "sub-dockerfile-opt",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Production Dockerfile Optimization & Security",
        colorKey: "C",
        description: `### 📦 Multi-Stage Dockerfile with Distroless Base

\`\`\`dockerfile
# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Minimal Distroless execution image (No shell, no package manager = ZERO CVEs)
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER nonroot
EXPOSE 8080
CMD ["dist/index.js"]
\`\`\`
`,
      },
    },
    {
      id: "sub-docker-compose-net",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Docker Compose, Networks & Persistent Volumes",
        colorKey: "C",
        description: `### 🛠️ Multi-Service Development \`docker-compose.yml\`

\`\`\`yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://cb_user:secretpass@postgres:5432/codebreakers
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cb_user
      POSTGRES_PASSWORD: secretpass
      POSTGRES_DB: codebreakers
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
\`\`\`
`,
      },
    },

    // 4. Container Orchestration (Kubernetes)
    {
      id: "kubernetes-orchestration",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Kubernetes (K8s) Cluster Orchestration",
        category: "Orchestration",
        description: `### ☸️ Deployments, Ingress, Helm & Horizontal Pod Auto-Scaling

Automate self-healing and zero-downtime rolling deployments across worker nodes.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 30,
      },
    },
    {
      id: "sub-k8s-objects",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "Pods, Deployments, Services & ConfigMaps",
        colorKey: "C",
        description: `### ☸️ Production Kubernetes Deployment Manifest

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
        - name: api
          image: codebreakers/api:v1.4.0
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
\`\`\`
`,
      },
    },
    {
      id: "sub-ingress-helm-hpa",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Ingress Controllers, Helm Charts & HPA",
        colorKey: "C",
        description: `### 📈 Horizontal Pod Autoscaler (HPA)

Scale pods dynamically when CPU exceeds 70%:

\`\`\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-deployment
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
\`\`\`
`,
      },
    },

    // 5. Infrastructure as Code (Terraform)
    {
      id: "infrastructure-as-code",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Infrastructure as Code (Terraform)",
        category: "IaC",
        description: `### 🌍 Declarative Cloud Infrastructure with Terraform (HCL)

Provision cloud clusters, VPCs, RDS instances, and IAM roles reproducibly.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-terraform-state",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "Terraform State, Remote Backends & Locking",
        colorKey: "C",
        description: `### 🔒 Remote State with S3 & DynamoDB Locking

\`\`\`hcl
terraform {
  required_version = ">= 1.7.0"
  
  backend "s3" {
    bucket         = "codebreakers-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "terraform-lock-table"
    encrypt        = true
  }
}
\`\`\`
`,
      },
    },
    {
      id: "sub-terraform-modules",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Reusable Terraform Modules & Workspaces",
        colorKey: "C",
        description: `### 🏗️ Parameterized Terraform Module Example

\`\`\`hcl
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr            = "10.0.0.0/16"
  public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs= ["10.0.10.0/24", "10.0.11.0/24"]
  environment         = "production"
}
\`\`\`
`,
      },
    },

    // 6. CI/CD Pipelines & GitOps
    {
      id: "cicd-gitops-automation",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "CI/CD Automation & GitOps (ArgoCD)",
        category: "CI/CD",
        description: `### 🤖 GitHub Actions, OIDC Authentication & ArgoCD GitOps

Automate deployments from Git commit to Kubernetes cluster.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-github-actions-matrix",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "GitHub Actions Matrix Builds & OIDC Deployments",
        colorKey: "C",
        description: `### 🔑 Keyless AWS Deployments with OIDC

Eliminate long-lived static AWS access keys by exchanging GitHub Actions OIDC tokens for temporary AWS IAM roles.
`,
      },
    },
    {
      id: "sub-gitops-argocd",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "GitOps Continuous Delivery with ArgoCD",
        colorKey: "C",
        description: `### 🐙 GitOps Continuous Reconciliation

ArgoCD watches Git repository for manifest updates and automatically synchronizes the live cluster state, rolling back immediately on failure.
`,
      },
    },

    // 7. Site Reliability & Observability
    {
      id: "sre-observability",
      type: "topic",
      position: { x: 550, y: 1320 },
      data: {
        label: "Observability (Prometheus, Grafana) & SRE",
        category: "SRE",
        description: `### 📊 Prometheus Metrics, PromQL, Grafana Dashboards & Incident Alerts

Maintain four nines (99.99%) uptime with proactive telemetry.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-prometheus-promql",
      type: "subtopic",
      position: { x: 860, y: 1280 },
      data: {
        label: "Prometheus Metric Scraping & PromQL Alerting",
        colorKey: "C",
        description: `### 📈 Essential PromQL Queries

\`\`\`promql
# 1. 5-minute request rate per second:
sum(rate(http_requests_total[5m])) by (status)

# 2. 99th percentile request latency:
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# 3. Memory utilization percentage:
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
\`\`\`
`,
      },
    },
    {
      id: "sub-sli-slo-errorbudget",
      type: "subtopic",
      position: { x: 860, y: 1330 },
      data: {
        label: "SLIs, SLOs & Error Budgets (Google SRE)",
        colorKey: "C",
        description: `### 📐 Google SRE Error Budget Policy

$$\\text{Error Budget} = 100\\% - \\text{SLO}$$

- If 30-day SLO is $99.9\\%$, allowed downtime is **43.2 minutes / month**.
- If error budget is depleted, all feature deployments are blocked until reliability improvements are merged.
`,
      },
    },

    // 8. Milestone
    {
      id: "milestone-devops-lead",
      type: "milestone",
      position: { x: 550, y: 1520 },
      data: {
        label: "Certified Cloud & DevOps Architect",
        category: "Milestone",
        description: `### 🎓 Cloud & DevOps Mastery Attained!

Congratulations! You have mastered enterprise cloud and DevOps engineering:
- Linux systems administration and shell automation.
- Cloud networking (VPCs, Subnets, NAT Gateways, Security Groups).
- Production containerization with Docker and multi-stage builds.
- Scalable cluster orchestration with Kubernetes and Helm.
- Infrastructure as Code with Terraform modules and remote state.
- Automated CI/CD pipelines with GitHub Actions OIDC and GitOps (ArgoCD).
- SRE practices, Prometheus metric alerting, and Grafana observability.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-cd-1", source: "linux-fundamentals", target: "networking-cloud-infra", type: "interactive" },
    { id: "e-cd-2", source: "networking-cloud-infra", target: "docker-containers", type: "interactive" },
    { id: "e-cd-3", source: "docker-containers", target: "kubernetes-orchestration", type: "interactive" },
    { id: "e-cd-4", source: "kubernetes-orchestration", target: "infrastructure-as-code", type: "interactive" },
    { id: "e-cd-5", source: "infrastructure-as-code", target: "cicd-gitops-automation", type: "interactive" },
    { id: "e-cd-6", source: "cicd-gitops-automation", target: "sre-observability", type: "interactive" },
    { id: "e-cd-7", source: "sre-observability", target: "milestone-devops-lead", type: "interactive" },

    // Subtopics
    { id: "e-cd-sub-1", source: "linux-fundamentals", target: "sub-linux-permissions-proc" },
    { id: "e-cd-sub-2", source: "linux-fundamentals", target: "sub-bash-automation" },

    { id: "e-cd-sub-3", source: "networking-cloud-infra", target: "sub-vpc-subnets" },
    { id: "e-cd-sub-4", source: "networking-cloud-infra", target: "sub-security-groups-nacl" },

    { id: "e-cd-sub-5", source: "docker-containers", target: "sub-dockerfile-opt" },
    { id: "e-cd-sub-6", source: "docker-containers", target: "sub-docker-compose-net" },

    { id: "e-cd-sub-7", source: "kubernetes-orchestration", target: "sub-k8s-objects" },
    { id: "e-cd-sub-8", source: "kubernetes-orchestration", target: "sub-ingress-helm-hpa" },

    { id: "e-cd-sub-9", source: "infrastructure-as-code", target: "sub-terraform-state" },
    { id: "e-cd-sub-10", source: "infrastructure-as-code", target: "sub-terraform-modules" },

    { id: "e-cd-sub-11", source: "cicd-gitops-automation", target: "sub-github-actions-matrix" },
    { id: "e-cd-sub-12", source: "cicd-gitops-automation", target: "sub-gitops-argocd" },

    { id: "e-cd-sub-13", source: "sre-observability", target: "sub-prometheus-promql" },
    { id: "e-cd-sub-14", source: "sre-observability", target: "sub-sli-slo-errorbudget" },
  ],
};
