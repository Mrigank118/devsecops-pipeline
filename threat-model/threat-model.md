# E-Commerce Application Threat Model

**Owner:** Ritika Jain  
**Reviewer:** Not Assigned  
**Date Generated:** Thu Sep 17 2026

## Executive Summary

### High-Level System Description

Threat model for an e-commerce web application consisting of:

- React client
- Express/Node.js REST API
- PostgreSQL database
- GitHub OAuth authentication
- Stripe payment integration

### Summary

| Metric | Count |
|---|---:|
| Total Threats | 12 |
| Total Mitigated | 0 |
| Total Open | 12 |
| Open / Critical Severity | 0 |
| Open / High Severity | 10 |
| Open / Medium Severity | 2 |
| Open / Low Severity | 0 |

> All threats in the generated Threat Dragon report are currently marked **Open**. The report contains 10 High-severity and 2 Medium-severity open threats.

## Data Flow Diagram

The application data flow consists of the following components and flows:

```text
User / Customer
       |
       v
React Client
       |
       | HTTPS REST API
       v
Express / Node.js REST API
       |
       | SQL / application data
       v
PostgreSQL

React Client / API
       |
       | OAuth authorization / profile
       v
GitHub OAuth

Express / Node.js REST API
       |
       | Checkout session / payment events
       v
Stripe
```

The Threat Dragon diagram also identifies HTTPS browser traffic, HTTPS REST API traffic, OAuth authorization/profile data, and checkout/payment events as relevant data flows.

---

# Threats

## 1. Cross-Site Scripting (XSS)

**Component:** React Client  
**Type:** Tampering  
**Severity:** Medium  
**Status:** Open

### Description

An attacker may inject malicious JavaScript into content displayed by the React client, potentially affecting users or their authenticated sessions.

### Mitigations

- Validate and sanitize untrusted input.
- Use React's safe rendering mechanisms.
- Avoid `dangerouslySetInnerHTML` where possible.
- Implement Content Security Policy (CSP).
- Use secure cookie settings.

---

## 2. Unauthorized API Access

**Component:** Express / Node.js REST API  
**Type:** Spoofing  
**Severity:** High  
**Status:** Open

### Description

An attacker may use stolen, guessed, or otherwise compromised authentication credentials or session information to impersonate a legitimate user and access protected API endpoints.

### Mitigations

- Use strong authentication.
- Implement secure session management.
- Use HTTPS.
- Use secure cookies.
- Validate tokens.
- Perform server-side authorization checks for every protected API request.

---

## 3. SQL Injection

**Component:** PostgreSQL  
**Type:** Tampering  
**Severity:** High  
**Status:** Open

### Description

An attacker may manipulate application input to alter SQL queries, potentially allowing unauthorized access to or modification of database records.

### Mitigations

- Use parameterized queries or prepared statements.
- Validate and sanitize input.
- Use least-privilege database accounts.
- Keep database credentials securely stored.

---

## 4. Sensitive Data Exposure

**Component:** PostgreSQL  
**Type:** Information Disclosure  
**Severity:** High  
**Status:** Open

### Description

Unauthorized access to the PostgreSQL database could expose sensitive application data such as user information, addresses, orders, and session data.

### Mitigations

- Restrict database access using least-privilege permissions.
- Secure database credentials.
- Use network access controls.
- Use encryption where appropriate.
- Avoid exposing the database directly to the public internet.

---

## 5. OAuth Credential Exposure

**Component:** GitHub OAuth  
**Type:** Spoofing  
**Severity:** High  
**Status:** Open

### Description

OAuth client credentials or authorization information could be exposed, allowing an attacker to misuse the application's GitHub authentication integration.

### Mitigations

- Store OAuth client credentials securely.
- Never commit secrets to source control.
- Use HTTPS for OAuth communication.
- Validate redirect URIs.
- Rotate credentials if they are exposed.

---

## 6. Payment Event Spoofing

**Component:** Stripe  
**Type:** Spoofing  
**Severity:** High  
**Status:** Open

### Description

An attacker may send forged payment events to the application, causing an order to be incorrectly treated as paid.

### Mitigations

- Validate Stripe webhook signatures.
- Verify payment status server-side.
- Use HTTPS.
- Never trust payment status supplied directly by the client.

---

## 7. API Request Tampering

**Component:** HTTPS REST API  
**Data Flow:** `/api/auth`, `/api/products`, `/api/cart`, `/api/orders`, `/api/checkout`  
**Type:** Tampering  
**Severity:** High  
**Status:** Open

### Description

An attacker may modify API requests sent from the client to alter parameters or application data, potentially affecting products, carts, orders, or checkout operations.

### Mitigations

- Validate all input on the server.
- Use HTTPS.
- Enforce server-side authorization.
- Validate request parameters.
- Never rely on client-side validation for security decisions.

---

## 8. Session Cookie Theft

**Component:** HTTPS — browser traffic  
**Type:** Information Disclosure  
**Severity:** High  
**Status:** Open

### Description

An attacker may obtain a user's session cookie or authentication information and use it to impersonate the legitimate user.

### Mitigations

- Use HTTPS for all browser traffic.
- Set authentication cookies with `Secure` and `HttpOnly` attributes.
- Use appropriate `SameSite` settings.
- Expire or rotate sessions appropriately.

---

## 9. Unauthorized Database Access

**Component:** SQL / application data  
**Type:** Information Disclosure  
**Severity:** High  
**Status:** Open

### Description

An attacker who gains unauthorized access to the database connection may retrieve sensitive application data such as user information, addresses, orders, and session data.

### Mitigations

- Use encrypted database connections.
- Use least-privilege database credentials.
- Use strong authentication.
- Use network access controls.
- Store database credentials securely.
- Do not expose the database directly to the public internet.

---

## 10. API Denial of Service

**Component:** API  
**Type:** Denial of Service  
**Severity:** Medium  
**Status:** Open

### Description

An attacker may send a large number of requests to the API, consuming server resources and preventing legitimate users from accessing application functionality.

### Mitigations

- Implement rate limiting and request throttling.
- Validate request sizes.
- Monitor API traffic.
- Use appropriate resource limits and availability controls.

---

## 11. Payment Event Tampering

**Component:** Checkout session / payment events  
**Type:** Tampering  
**Severity:** High  
**Status:** Open

### Description

An attacker may manipulate or forge payment-related data or events, potentially causing an order to be incorrectly marked as paid or creating an incorrect payment state.

### Mitigations

- Validate Stripe webhook signatures.
- Verify payment status on the server.
- Use HTTPS.
- Do not trust payment or order status supplied directly by the client.

---

## 12. OAuth Credential Exposure

**Component:** OAuth authorization / profile  
**Type:** Information Disclosure  
**Severity:** High  
**Status:** Open

### Description

OAuth client credentials or authorization information could be exposed, allowing an attacker to misuse the application's GitHub authentication integration.

### Mitigations

- Store OAuth client credentials securely.
- Never commit secrets to source control.
- Use HTTPS for OAuth communication.
- Validate redirect URIs.
- Rotate credentials if they are exposed.

> **Note:** The Threat Dragon report labels this threat as **#13**, while the executive summary reports **12 total threats**. This Markdown preserves the report's content without inventing or renumbering an additional threat.

---

# Threat Model Coverage

The generated model covers the following security areas:

- **Spoofing**
  - Unauthorized API Access
  - OAuth Credential Exposure
  - Payment Event Spoofing

- **Tampering**
  - Cross-Site Scripting (XSS)
  - SQL Injection
  - API Request Tampering
  - Payment Event Tampering

- **Information Disclosure**
  - Sensitive Data Exposure
  - Unauthorized Database Access
  - Session Cookie Theft
  - OAuth Credential Exposure

- **Denial of Service**
  - API Denial of Service

## Key Security Controls Identified

The Threat Dragon report repeatedly identifies the following controls as mitigations:

1. HTTPS for browser, API, OAuth, and payment communication.
2. Server-side authentication and authorization.
3. Secure session and cookie configuration.
4. Input validation and sanitization.
5. Parameterized SQL queries / prepared statements.
6. Least-privilege database access.
7. Secure storage of credentials and OAuth secrets.
8. Stripe webhook signature validation.
9. Server-side payment verification.
10. Rate limiting and request throttling.
11. Content Security Policy (CSP).
12. Secure handling of OAuth redirect URIs.

## Threat Status

At the time the Threat Dragon report was generated:

```text
Total Threats       : 12
Mitigated           : 0
Open                : 12
Critical            : 0
High                : 10
Medium              : 2
Low                 : 0
```

The mitigations listed above are recommendations recorded in the Threat Dragon model; the report does not mark any of the threats as mitigated.
