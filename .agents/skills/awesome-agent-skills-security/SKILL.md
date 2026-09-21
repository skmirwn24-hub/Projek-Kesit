---
name: awesome-agent-skills-security
description: >-
  Expert guidance on AI agent security, tool-use safety, MCP security, and skill ecosystem defense.
  Use whenever designing, reviewing, or auditing AI agent tools, prompt injection defenses,
  excessive agency mitigations, permission boundaries, Model Context Protocol (MCP) servers,
  or applying the OWASP Top 10 for Agentic AI / Agentic Skills Top 10 (AST10).
metadata:
  author: LLMSecurity
  source: https://github.com/LLMSecurity/awesome-agent-skills-security
  version: "1.0.0"
---

# Awesome Agent Skills Security

This skill provides practical principles, threat models, and verification checklists for securing AI agents, tools, Model Context Protocol (MCP) servers, and skill ecosystems based on curated research from [LLMSecurity/awesome-agent-skills-security](./README.md).

---

## 1. Threat Landscape: OWASP Agentic Skills Top 10 (AST10)

When developing or integrating AI agent capabilities, evaluate against the primary threat categories:

1. **AST01: Malicious & Untrusted Skills**: Third-party skills containing hidden command payloads, backdoor behaviors, or trojanized helper scripts.
2. **AST02: Supply Chain & Registry Compromise**: Unpinned skill dependencies, silent drift in tool definitions, or hallucinated package recommendations.
3. **AST03: Tool Poisoning & Metadata Injection**: Attacker-controlled text in tool descriptions, schemas, or responses that manipulate LLM planning.
4. **AST04: Excessive Agency & Over-Privileged Execution**: Granting broad shell, file write, or database modification access when read-only or constrained actions suffice.
5. **AST05: Indirect Prompt Injection (IPI)**: Adversarial instructions embedded in untrusted external data (PDFs, websites, emails, database records) that hijack the agent's control flow.
6. **AST06: Data Exfiltration & Memory Leakage**: Covert channels, unintended PII disclosure across tools, or state leakage through inter-agent communication.
7. **AST07: Cross-Skill & Composition Attacks**: Multiple independently benign skills combining into an exploitable attack chain when chained by an agent planner.
8. **AST08: Insecure Authentication & Delegation**: Long-lived unrestricted tokens, missing cryptographic delegation bounds, or bearer credentials passed across unverified hops.
9. **AST09: Sandbox & Runtime Escape**: Flawed container isolation, unconstrained subprocess execution, or improper filesystem path traversal.
10. **AST10: Non-Deterministic & Unaudited Execution**: Missing tamper-evident audit logs, unreviewed autonomous side-effects, or lack of human-in-the-loop gates on destructive operations.

---

## 2. Defensive Engineering Principles

### A. Least Privilege & Principle of Need-to-Know
- **Tool Scoping**: Restrict tool parameters strictly to needed data types and ranges (e.g. Zod schemas). Avoid accepting free-form shell commands when dedicated APIs exist.
- **Granular RBAC**: Enforce server-side authorization checks on every tool or Server Action. Do not rely on LLM judgment to restrict unauthorized operations.
- **Read/Write Segregation**: Separate read-only query tools from state-mutating tools. Never bundle high-privilege operations into general-purpose utilities.

### B. Control-Data Separation (Defense against Prompt Injection)
- **Delimited Data Inputs**: Always clearly separate instructions from external, untrusted content using structural framing (JSON, XML tags, or typed schemas).
- **Sanitize External Data**: Strip prompt-like framing (e.g. `System:`, `Human:`, `Ignore previous instructions`) when consuming untrusted web or document feeds.
- **Pre-execution Action Auditing**: Verify that tool parameters match the user's explicit intent before executing high-impact side-effects.

### C. Human-in-the-Loop (HITL) Gateways
- **Irreversible Action Confirmation**: Destructive operations (database drops, user deletions, financial transactions, permission changes) must require explicit user confirmation.
- **Verification of State**: Present the exact intended action and diff to the user rather than executing autonomously behind the scenes.

### D. Model Context Protocol (MCP) Server Hardening
- **Pin Versions**: Pin exact versions of MCP servers and dependencies. Never pull unpinned latest versions from untrusted registries.
- **Description Integrity**: Regularly audit tool descriptions to ensure no prompt-injection payloads or conflicting instructions have been injected into schemas.
- **Transport Security**: Ensure all MCP communication occurs over authenticated, TLS-encrypted, or securely isolated local IPC channels.

---

## 3. Agent Security Review Checklist

Use this checklist during code review, feature design, or security audits:

- [ ] **Input Validation**: Are all tool parameters validated using strict schemas (e.g. Zod) with zero `any` escape hatches?
- [ ] **Authorization Verification**: Is authorization enforced on the backend server, independent of the model's intent?
- [ ] **Credential Protection**: Are secret keys, service role tokens, and database passwords stored exclusively in server environment variables and never exposed in public bundles or agent transcripts?
- [ ] **Output Sanitization**: Do tool responses redact sensitive PII and authentication tokens before returning context to the model?
- [ ] **Audit Trail**: Are all critical actions, user IDs, timestamps, and parameters logged in a tamper-resistant database table?
- [ ] **Error Handling**: Do catch blocks fail safely and return generic error messages without leaking internal stack traces or connection strings?

---

## 4. References & Full Research Catalog

For the complete, extensive catalog of papers, attack analyses, benchmarks, and threat frameworks:
- Read [README.md](./README.md) for the full 200+ academic papers and tool directory.
- Upstream repository: [LLMSecurity/awesome-agent-skills-security](https://github.com/LLMSecurity/awesome-agent-skills-security).
