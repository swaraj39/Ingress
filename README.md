# =============================================================================
# Ingress Demo — Spring Boot + React + Kubernetes Ingress
# =============================================================================
# A complete full-stack demonstration of Kubernetes Ingress with path-based
# routing, featuring a Spring Boot backend and a React frontend.
#
# ████████████████████████████████████████████████████████████████████████████
# ██  WHAT YOU'LL LEARN                                                     ██
# ████████████████████████████████████████████████████████████████████████████
#   • How to build a REST API with Spring Boot
#   • How to build a React frontend that calls the API
#   • How to containerize both apps with Docker
#   • How to deploy to Kubernetes with Deployments and Services
#   • How to use Kubernetes Ingress for path-based routing
#   • How one domain can serve multiple services
#
# ████████████████████████████████████████████████████████████████████████████
# ██  PROJECT STRUCTURE                                                     ██
# ████████████████████████████████████████████████████████████████████████████
#
#   Ingress/
#   ├── backend/                          # Spring Boot REST API
#   │   ├── pom.xml                       # Maven build configuration
#   │   ├── Dockerfile                    # Multi-stage Docker build
#   │   └── src/main/
#   │       ├── java/com/example/demo/
#   │       │   ├── DemoApplication.java          # App entry point
#   │       │   ├── config/WebConfig.java         # CORS configuration
#   │       │   ├── controller/MessageController.java  # REST endpoints
#   │       │   └── model/Message.java            # Data model
#   │       └── resources/
#   │           └── application.properties        # App configuration
#   │
#   ├── frontend/                         # React application
#   │   ├── package.json                  # npm dependencies & scripts
#   │   ├── vite.config.js                # Vite build tool configuration
#   │   ├── .env.development              # Dev environment variables
#   │   ├── .env.production               # Prod environment variables
#   │   ├── Dockerfile                    # Multi-stage Docker build (node → nginx)
#   │   ├── nginx.conf                    # nginx config for serving React
#   │   └── src/
#   │       ├── main.jsx                  # React entry point
#   │       ├── App.jsx                   # Main component (calls API)
#   │       ├── App.css                   # Component styles
#   │       └── index.css                 # Global styles
#   │
#   ├── kubernetes/                       # Kubernetes manifests
#   │   ├── namespace.yaml                # Namespace for isolation
#   │   ├── configmap.yaml                # Configuration data
#   │   ├── backend/
#   │   │   ├── deployment.yaml           # Backend pods (×2 replicas)
#   │   │   └── service.yaml              # Backend service (ClusterIP:8080)
#   │   ├── frontend/
#   │   │   ├── deployment.yaml           # Frontend pods (×2 replicas)
#   │   │   └── service.yaml              # Frontend service (ClusterIP:80)
#   │   ├── ingress/
#   │   │   └── ingress.yaml              # ★ Ingress routing rules ★
#   │   └── README.md                     # Detailed K8s guide
#   │
#   ├── docker-compose.yml                # Local multi-container setup
#   └── README.md                         # This file
#
# ████████████████████████████████████████████████████████████████████████████
# ██  ARCHITECTURE                                                          ██
# ████████████████████████████████████████████████████████████████████████████
#
#   ┌──────────┐
#   │  Browser │
#   └────┬─────┘
#        │
#        ▼
#   ┌───────────────────────────────────────────────────────────┐
#   │              KUBERNETES INGRESS (port 80)                │
#   │         NGINX Ingress Controller                         │
#   │                                                           │
#   │   Path matching:                                          │
#   │     /api/*  ──────────────┐                              │
#   │     /*      ──────────┐   │                              │
#   │                       ▼   ▼                              │
#   │              ┌─────────┐ ┌──────────┐                    │
#   │              │frontend │ │ backend  │                    │
#   │              │Service  │ │ Service  │                    │
#   │              │ port 80 │ │ port 8080│                    │
#   │              └────┬────┘ └────┬─────┘                    │
#   │                   │           │                           │
#   │              ┌────▼────┐ ┌────▼──────┐                   │
#   │              │ nginx   │ │ Spring    │                   │
#   │              │ Pods ×2 │ │ Boot ×2   │                   │
#   │              │ (React) │ │ (REST API)│                   │
#   │              └─────────┘ └───────────┘                   │
#   └───────────────────────────────────────────────────────────┘
#
#   KEY INSIGHT: Both services share ONE domain/port.
#   Ingress routes by URL path:
#     http://myapp.example.com/            → React frontend
#     http://myapp.example.com/api/message → Spring Boot backend
#
# ████████████████████████████████████████████████████████████████████████████
# ██  QUICK START — LOCAL (Docker Compose, no Kubernetes)                    ██
# ████████████████████████████████████████████████████████████████████████████
#
#   1. Build and start both services:
#      docker compose up --build
#
#   2. Open your browser:
#      Frontend:  http://localhost:3000
#      Backend:   http://localhost:8080/api/message
#
#   3. Stop everything:
#      docker compose down
#
# ████████████████████████████████████████████████████████████████████████████
# ██  QUICK START — KUBERNETES                                               ██
# ████████████████████████████████████████████████████████████████████████████
#
#   Prerequisites:
#     • A Kubernetes cluster (Docker Desktop, minikube, kind, or cloud)
#     • kubectl configured
#     • NGINX Ingress Controller installed
#
#   Steps:
#     1. Build Docker images:
#        docker build -t ingress-demo-backend:latest ./backend
#        docker build -t ingress-demo-frontend:latest ./frontend
#
#     2. Load images into your cluster:
#        # minikube:
#        minikube image load ingress-demo-backend:latest
#        minikube image load ingress-demo-frontend:latest
#
#        # kind:
#        kind load docker-image ingress-demo-backend:latest
#        kind load docker-image ingress-demo-frontend:latest
#
#        # Docker Desktop: skip (images shared automatically)
#
#     3. Install NGINX Ingress Controller (if needed):
#        # minikube:
#        minikube addons enable ingress
#
#        # kind / generic:
#        kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
#
#     4. Apply all Kubernetes manifests:
#        kubectl apply -f kubernetes/
#
#     5. Wait for Pods:
#        kubectl get pods -n ingress-demo --watch
#        # Wait until all 4 pods show "Running" and "2/2" ready
#
#     6. Access via Ingress:
#        # minikube:
#        minikube tunnel
#        # Use the IP shown, e.g., http://192.168.49.2/
#
#        # Or port-forward to the ingress controller:
#        kubectl port-forward -n ingress <INGRESS_POD> 8080:80
#        # Then: http://localhost:8080/
#
#     7. Test the API through Ingress:
#        curl http://<INGRESS_IP>/api/message
#        curl http://<INGRESS_IP>/api/health
#
# ████████████████████████████████████████████████████████████████████████████
# ██  API ENDPOINTS                                                         ██
# ████████████████████████████████████████████████████████████████████████████
#
#   GET /api/message
#     Returns a JSON message from the backend:
#     {
#       "text": "Hello from the Spring Boot backend!",
#       "source": "backend-service",
#       "timestamp": 1696483200000
#     }
#
#   GET /api/health
#     Returns health status (used by Kubernetes probes):
#     {
#       "status": "UP",
#       "service": "Ingress Demo Backend",
#       "timestamp": 1696483200000
#     }
#
#   GET /api/info
#     Returns application metadata for debugging.
#
# ████████████████████████████████████████████████████████████████████████████
# ██  LOCAL DEVELOPMENT (without Docker)                                     ██
# ████████████████████████████████████████████████████████████████████████████
#
#   Backend (requires Java 17+ and Maven):
#     cd backend
#     mvn spring-boot:run
#     # API available at http://localhost:8080
#
#   Frontend (requires Node.js 18+):
#     cd frontend
#     npm install
#     npm run dev
#     # React app at http://localhost:5173
#     # It calls http://localhost:8080/api/message directly (CORS enabled)
#
# ████████████████████████████████████████████████████████████████████████████
# ██  KEY CONCEPTS                                                          ██
# ████████████████████████████████████████████████████████████████████████████
#
#   INGRESS
#     A Kubernetes resource that manages external HTTP(S) access to services.
#     It provides path-based and host-based routing through a single entry point.
#
#   DEPLOYMENT
#     Defines how Pods should run (image, replicas, resources, health checks).
#     Manages ReplicaSets and enables rolling updates and rollbacks.
#
#   SERVICE
#     Provides a stable virtual IP and DNS name for accessing Pods.
#     Load-balances traffic across all matching Pods.
#
#   NAMESPACE
#     Logical isolation within a cluster. All demo resources live in
#     the "ingress-demo" namespace.
#
#   DOCKER
#     Containerizes each application so it runs identically anywhere.
#     Multi-stage builds keep production images small and secure.
#
# ████████████████████████████████████████████████████████████████████████████
# ██  TROUBLESHOOTING                                                       ██
# ████████████████████████████████████████████████████████████████████████████
#
#   Pods not starting?
#     kubectl describe pod <POD_NAME> -n ingress-demo
#     kubectl logs <POD_NAME> -n ingress-demo
#
#   Ingress not working?
#     kubectl get ingress -n ingress-demo
#     kubectl describe ingress ingress-demo -n ingress-demo
#     kubectl logs -n ingress -l app.kubernetes.io/name=ingress-nginx
#
#   Frontend shows errors calling API?
#     • Local dev: ensure backend is running on port 8080
#     • Kubernetes: verify Ingress rules route /api/* to backend
#
#   Full troubleshooting guide: see kubernetes/README.md
#
# ████████████████████████████████████████████████████████████████████████████
# ██  CLEANUP                                                             ██
# ████████████████████████████████████████████████████████████████████████████
#
#   Kubernetes:
#     kubectl delete namespace ingress-demo
#
#   Docker Compose:
#     docker compose down
#
#   Remove images:
#     docker rmi ingress-demo-backend:latest ingress-demo-frontend:latest
# =============================================================================
