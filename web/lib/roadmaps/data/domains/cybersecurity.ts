import type { RoadmapData } from "../../types";

export const cybersecurityRoadmap: RoadmapData = {
  id: "cybersecurity",
  slug: "cybersecurity",
  title: "Cybersecurity",
  description: "Complete, all-in-one guide to Cybersecurity & Ethical Hacking. Master Network Traffic Analysis (Wireshark), Nmap Reconnaissance, Linux Hardening, Applied Cryptography (AES-GCM, RSA), OWASP Top 10 Exploitation & Patching (SQLi, XSS, SSRF), Burp Suite Pro, Privilege Escalation, SIEM Threat Hunting (Splunk), and Incident Response without needing external materials.",
  category: "cybersecurity",
  badgeText: "Critical Track",
  iconName: "ShieldAlert",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Cybersecurity Roadmap" },
    },
    // 1. Networking & Reconnaissance
    {
      id: "cyber-networking",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Networking & Security Reconnaissance",
        category: "Fundamentals",
        description: `### 🔍 Network Traffic Analysis & Active Reconnaissance

Analyze packet frames and uncover vulnerable open ports across enterprise networks.
`,
        difficulty: "beginner", 
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-wireshark-tcpdump",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "Packet Capture & Analysis: Wireshark & Tcpdump",
        colorKey: "C",
        description: `### 🦈 Deep Packet Inspection (DPI) with Wireshark

\`\`\`bash
# Capture 1000 packets on interface eth0 saving to capture.pcap
tcpdump -i eth0 -c 1000 -nn -w capture.pcap

# Essential Wireshark Display Filters:
# 1. Filter HTTP POST requests carrying login passwords:
http.request.method == "POST" && (http contains "password" || http contains "token")

# 2. Filter TCP SYN packets (detecting incoming SYN port scans):
tcp.flags.syn == 1 && tcp.flags.ack == 0

# 3. Filter DNS lookups to identify malware Command & Control (C2) domains:
dns.flags.response == 0
\`\`\`
`,
      },
    },
    {
      id: "sub-nmap-recon",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "Port Scanning & Service Enumeration (Nmap)",
        colorKey: "C",
        description: `### 🎯 Targeted Port Scanning with Nmap

\`\`\`bash
# Full comprehensive port scan with service versions, default scripts, and OS detection
nmap -sS -sV -sC -O -p- -T4 -oA target_recon 10.10.10.128

# Explanation of Flags:
# -sS : Stealth TCP SYN scan (half-open scan, doesn't complete 3-way handshake)
# -sV : Probe open ports to determine service/version info (e.g., OpenSSH 8.2p1)
# -sC : Run default safe vulnerability detection NSE scripts
# -p- : Scan all 65,535 TCP ports (default is only top 1,000)
# -oA : Save output in 3 formats (nmap, gnmap, xml)
\`\`\`
`,
      },
    },

    // 2. Linux Hardening & Identity Security
    {
      id: "system-hardening",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "System Hardening & Identity Security",
        category: "Host Security",
        description: `### 🛡️ Linux Bastion Hardening & Zero-Trust IAM

Protect servers against automated brute-force attacks and credential stuffing.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-linux-hardening",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "Linux Hardening: SSH, UFW & Fail2ban",
        colorKey: "C",
        description: `### 🔒 Production SSH Configuration

\`\`\`ini
# /etc/ssh/sshd_config
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowUsers deployuser
\`\`\`

\`\`\`bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp comment 'Custom SSH'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
\`\`\`
`,
      },
    },
    {
      id: "sub-iam-least-privilege",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "Least Privilege Access & Zero Trust Architecture",
        colorKey: "C",
        description: `### 🔑 Zero Trust Identity Principles

- **Assume Breach**: Segment internal subnets; never trust internal network traffic by default.
- **Hardware MFA**: Require FIDO2 WebAuthn hardware security keys for admin dashboard access.
- **Role Scoping**: Assign granular permissions instead of granting wildcard (\`*\`) administrative roles.
`,
      },
    },

    // 3. Cryptography & PKI
    {
      id: "cryptography-pki",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Applied Cryptography & Public Key Infrastructure",
        category: "Cryptography",
        description: `### 🔐 AES-GCM Encryption, Hashing, Signatures & Certificates

Understand the mathematical foundations securing passwords and encrypted communication.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 16,
      },
    },
    {
      id: "sub-ciphers-hashing",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Symmetric (AES-GCM) vs Asymmetric (RSA/ECC) & Hashes",
        colorKey: "C",
        description: `### 🛡️ Argon2id Password Hashing Example

Never store passwords using fast algorithms like SHA-256 or MD5!

\`\`\`typescript
import * as argon2 from "argon2";

// Hash password with high memory cost
export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB RAM
    timeCost: 3,       // 3 iterations
    parallelism: 4     // 4 threads
  });
}

// Verify password
export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  return argon2.verify(hash, plainText);
}
\`\`\`
`,
      },
    },
    {
      id: "sub-pki-certificates",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Public Key Infrastructure (PKI) & TLS Certificates",
        colorKey: "C",
        description: `### 📜 PKI Trust Chain & Automated ACME Renewal

- **Chain of Trust**: Root CA $\\rightarrow$ Intermediate CA $\\rightarrow$ Server Leaf Certificate.
- **Certbot Automatic Renewal**: Runs cron daemon every 12 hours checking for certificates expiring within 30 days.
`,
      },
    },

    // 4. Web Application Security (OWASP Top 10)
    {
      id: "web-app-security",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Web Application Security & OWASP Top 10",
        category: "AppSec",
        description: `### 🚨 OWASP Top 10: Exploitation, Proof-of-Concepts & Remediation

Identify, exploit, and patch SQL Injection, Cross-Site Scripting, and SSRF flaws.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 24,
      },
    },
    {
      id: "sub-sqli-xss-csrf",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "SQL Injection (SQLi) & Cross-Site Scripting (XSS)",
        colorKey: "C",
        description: `### 💉 SQL Injection Proof of Concept & Fix

\`\`\`sql
-- VULNERABLE Query (Vulnerable to ' OR 1=1 --):
SELECT * FROM users WHERE email = 'admin@test.com' AND password = '' OR 1=1 --';

-- SECURE Parameterized Query (Fix):
SELECT * FROM users WHERE email = $1 AND password_hash = $2;
\`\`\`

---

### 🛡️ XSS Defenses with Content Security Policy
\`\`\`http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-rAnd0m123'; object-src 'none'; base-uri 'self';
\`\`\`
`,
      },
    },
    {
      id: "sub-ssrf-idor-authz",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Server-Side Request Forgery (SSRF) & IDOR",
        colorKey: "C",
        description: `### ☁️ Cloud Metadata SSRF Defense

Prevent backend webhooks from querying AWS instance metadata.

\`\`\`typescript
import ipaddr from "ipaddr.js";

// Check if destination IP is private or loopback before fetching
export function isSafePublicUrl(urlString: string): boolean {
  const url = new URL(urlString);
  const parsedIp = ipaddr.parse(url.hostname);

  // Block 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254 (AWS IMDS)
  if (parsedIp.range() !== "unicast") {
    throw new Error("Blocked SSRF request to internal private IP address!");
  }
  return true;
}
\`\`\`
`,
      },
    },

    // 5. Penetration Testing & Ethical Hacking
    {
      id: "penetration-testing",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Penetration Testing & Offensive Security",
        category: "Offensive Security",
        description: `### 🎯 Burp Suite Pro, Privilege Escalation & Active Directory

Perform authorized security assessments to uncover vulnerabilities before malicious actors.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-burpsuite-proxy",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "Burp Suite Pro: Intercepting, Repeater & Intruder",
        colorKey: "C",
        description: `### 🦊 Burp Suite Workflow

1. Configure browser proxy to \`127.0.0.1:8080\`.
2. Intercept authentication request $\\rightarrow$ send to **Repeater** (\`Ctrl + R\`).
3. Modify parameters and test boundary conditions (negative quantities, IDOR tokens, oversized buffers).
4. Send to **Intruder** (\`Ctrl + I\`) for automated password spraying and directory enumeration.
`,
      },
    },
    {
      id: "sub-privilege-escalation",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Privilege Escalation: Linux SUID & Windows AD",
        colorKey: "C",
        description: `### ⚡ Linux SUID Privilege Escalation Checks

\`\`\`bash
# Find binaries with SUID permission bit set owned by root
find / -perm -u=s -type f 2>/dev/null

# Check sudo privileges for current user
sudo -l

# Check active automated cron tasks
crontab -l
cat /etc/crontab
\`\`\`
`,
      },
    },

    // 6. SOC Operations, SIEM & Incident Response
    {
      id: "soc-siem-defense",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "SOC Operations, SIEM & Incident Response",
        category: "Defensive Security",
        description: `### 🛡️ Splunk SIEM Detection Rules, MITRE ATT&CK & Memory Forensics

Detect breaches in real time and execute digital forensic investigations.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-siem-splunk-elastic",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "SIEM Log Aggregation & Threat Detection Rules",
        colorKey: "C",
        description: `### 🚨 Splunk SPL Threat Hunting Query

\`\`\`spl
# Detect multiple failed SSH logins followed by successful login from the same IP
index=linux_auth sourcetype=syslog "Failed password"
| stats count by src_ip, user
| where count > 10
| join src_ip [ search index=linux_auth "Accepted password" | stats count by src_ip, user ]
| table _time, src_ip, user, count
\`\`\`
`,
      },
    },
    {
      id: "sub-incident-response-forensics",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "Incident Response (NIST) & Memory Forensics (Volatility)",
        colorKey: "C",
        description: `### 🔬 Volatility 3 Memory Forensics Analysis

\`\`\`bash
# 1. Analyze process tree from memory dump
vol.py -f memory.dmp windows.pstree

# 2. Identify active network connections at time of capture
vol.py -f memory.dmp windows.netscan

# 3. Detect injected DLLs and malicious memory sections
vol.py -f memory.dmp windows.malfind
\`\`\`
`,
      },
    },

    // 7. Milestone
    {
      id: "milestone-cyber-lead",
      type: "milestone",
      position: { x: 550, y: 1320 },
      data: {
        label: "Certified Cybersecurity & Penetration Tester",
        category: "Milestone",
        description: `### 🎓 Cybersecurity Mastery Attained!

Congratulations! You have mastered offensive and defensive cybersecurity:
- Network packet inspection (Wireshark) and scanning (Nmap).
- Linux and cloud host security hardening with Zero Trust.
- Applied cryptography, ciphers, and PKI certificate infrastructure.
- OWASP Top 10 web app vulnerability discovery and patching.
- Offensive pentesting with Burp Suite and privilege escalation.
- Defensive SOC operations, SIEM detection rules (Splunk), and incident response.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-cy-1", source: "cyber-networking", target: "system-hardening", type: "interactive" },
    { id: "e-cy-2", source: "system-hardening", target: "cryptography-pki", type: "interactive" },
    { id: "e-cy-3", source: "cryptography-pki", target: "web-app-security", type: "interactive" },
    { id: "e-cy-4", source: "web-app-security", target: "penetration-testing", type: "interactive" },
    { id: "e-cy-5", source: "penetration-testing", target: "soc-siem-defense", type: "interactive" },
    { id: "e-cy-6", source: "soc-siem-defense", target: "milestone-cyber-lead", type: "interactive" },

    // Subtopics
    { id: "e-cy-sub-1", source: "cyber-networking", target: "sub-wireshark-tcpdump" },
    { id: "e-cy-sub-2", source: "cyber-networking", target: "sub-nmap-recon" },

    { id: "e-cy-sub-3", source: "system-hardening", target: "sub-linux-hardening" },
    { id: "e-cy-sub-4", source: "system-hardening", target: "sub-iam-least-privilege" },

    { id: "e-cy-sub-5", source: "cryptography-pki", target: "sub-ciphers-hashing" },
    { id: "e-cy-sub-6", source: "cryptography-pki", target: "sub-pki-certificates" },

    { id: "e-cy-sub-7", source: "web-app-security", target: "sub-sqli-xss-csrf" },
    { id: "e-cy-sub-8", source: "web-app-security", target: "sub-ssrf-idor-authz" },

    { id: "e-cy-sub-9", source: "penetration-testing", target: "sub-burpsuite-proxy" },
    { id: "e-cy-sub-10", source: "penetration-testing", target: "sub-privilege-escalation" },

    { id: "e-cy-sub-11", source: "soc-siem-defense", target: "sub-siem-splunk-elastic" },
    { id: "e-cy-sub-12", source: "soc-siem-defense", target: "sub-incident-response-forensics" },
  ],
};
