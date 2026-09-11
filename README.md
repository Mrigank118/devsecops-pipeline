# devsecops-pipeline
End-to-end DevSecOps pipeline integrating threat modeling, SAST, secret scanning, SCA, secure CI/CD, application testing, container security, IaC security, and DAST.

## Running the Application

### Prerequisites

- Node.js 20+
- npm
- Docker
- Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/<YOUR_USERNAME>/devsecops-pipeline.git
cd devsecops-pipeline
````

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
GITHUB_CLIENT=<your-github-oauth-client-id>
GITHUB_SECRET=<your-github-oauth-client-secret>
STRIPE_SECRET=<your-stripe-test-secret-key>
```


### 3. Start the application with Docker Compose

From the repository root:

```bash
docker compose --env-file .env -f docker/docker-compose.yml up --build
```

This starts:

* PostgreSQL
* Express/Node.js backend
* React frontend

### 4. Access the application

Frontend:

```text
http://localhost:3001
```

Backend:

```text
http://localhost:3000
```






