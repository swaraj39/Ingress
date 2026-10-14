# =============================================================================
# kubernetes/README.md — Complete Guide to the Kubernetes Manifests
# =============================================================================
# This guide explains every Kubernetes resource in this project, why it
# exists, and how to deploy the full stack.
#
# TABLE OF CONTENTS:
#   1. Prerequisites
#   2. Architecture Overview
#   3. File-by-File Explanation
#   4. Deployment Steps
#   5. Testing the Ingress
#   6. Cleanup
#   7. Troubleshooting
#   8. Production Considerations
# =============================================================================

# =============================================================================
# 1. PREREQUISITES
# =============================================================================
# You need:
#   • A Kubernetes cluster (any of these):
#       - Docker Desktop with Kubernetes enabled (easiest for beginners)
#       - minikube
#       - kind (Kubernetes IN Docker)
#       - A cloud cluster (EKS, GKE, AKS)
#
#   • kubectl installed and configured:
#       kubectl version --client
#
#   • NGINX Ingress Controller installed:
#       # For minikube:
#       minikube addons enable ingress
#
#       # For kind:
#       kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
#
#       # For Docker Desktop:
#       # Ingress is usually available; check with: kubectl get pods -n ingress
#
#       # Verify installation:
#       kubectl get pods -n ingress
#       kubectl get ingressclass
#
#   • Docker images built locally:
#       docker build -t ingress-demo-backend:latest backend/
#       docker build -t ingress-demo-frontend:latest frontend/
#
#       # If using minikube, load images into the cluster:
#       minikube image load ingress-demo-backend:latest
#       minikube image load ingress-demo-frontend:latest
#
#       # If using kind:
#       kind load docker-image ingress-demo-backend:latest
#       kind load docker-image ingress-demo-frontend:latest
#
#       # If using Docker Desktop, images are shared automatically.
# =============================================================================

# =============================================================================
# 2. ARCHITECTURE OVERVIEW
# =============================================================================
# ┌─────────────────────────────────────────────────────────────────────┐
# │                        KUBERNETES CLUSTER                          │
# │                                                                     │
# │  ┌──────────────────────────────────────────────────────────────┐  │
# │  │                     NAMESPACE: ingress-demo                  │  │
# │  │                                                              │  │
# │  │  ┌────────────────────────────────────────────────────────┐  │  │
# │  │  │              INGRESS RESOURCE (ingress.yaml)           │  │  │
# │  │  │  Rules: /api/* → backend  |  /* → frontend            │  │  │
# │  │  └───────────────────┬──────────────────┬─────────────────┘  │  │
# │  │                      │                  │                     │  │
# │  │  ┌───────────────────▼──────┐  ┌────────▼──────────────────┐ │  │
# │  │  │  Service: frontend       │  │  Service: backend         │ │  │
# │  │  │  ClusterIP:port 80      │  │  ClusterIP:port 8080      │ │  │
# │  │  └───────────┬──────────────┘  └─────────┬─────────────────┘ │  │
# │  │              │                            │                   │  │
# │  │  ┌───────────▼──────────────┐  ┌─────────▼─────────────────┐ │  │
# │  │  │  Deployment: frontend    │  │  Deployment: backend      │ │  │
# │  │  │  Replicas: 2             │  │  Replicas: 2              │ │  │
# │  │  │  ┌────────┐ ┌────────┐  │  │  ┌────────┐ ┌────────┐   │ │  │
# │  │  │  │ nginx  │ │ nginx  │  │  │  │Spring  │ │Spring  │   │ │  │
# │  │  │  │ Pod 1  │ │ Pod 2  │  │  │  │Boot P1 │ │Boot P2 │   │ │  │
# │  │  │  │ :80    │ │ :80    │  │  │  │ :8080  │ │ :8080  │   │ │  │
# │  │  │  └────────┘ └────────┘  │  │  └────────┘ └────────┘   │ │  │
# │  │  └─────────────────────────┘  └───────────────────────────┘ │  │
# │  └──────────────────────────────────────────────────────────────┘  │
# └─────────────────────────────────────────────────────────────────────┘
#
# TRAFFIC FLOW:
#   User Browser
#       │
#       ▼
#   Ingress Controller (NGINX) ──── port 80
#       │
#       ├── path /api/*  ──▶ backend Service ──▶ backend Pod (×2)
#       │                                        Spring Boot :8080
#       │
#       └── path /*      ──▶ frontend Service ──▶ frontend Pod (×2)
#                                                nginx :80
# =============================================================================

# =============================================================================
# 3. FILE-BY-FILE EXPLANATION
# =============================================================================
# Each file in the kubernetes/ directory:
#
# namespace.yaml
#   Creates the "ingress-demo" namespace for isolation.
#   All other resources live inside this namespace.
#
# backend/deployment.yaml
#   Defines how to run the Spring Boot backend:
#   • 2 replicas for availability
#   • Image: ingress-demo-backend:latest
#   • Port: 8080
#   • Readiness/liveness/startup probes for health checking
#   • CPU/memory requests and limits
#
# backend/service.yaml
#   Creates a stable network endpoint for backend Pods:
#   • Type: ClusterIP (internal only)
#   • port 8080 → targetPort 8080
#   • Selector matches backend Pod labels
#
# frontend/deployment.yaml
#   Defines how to run the React frontend (nginx):
#   • 2 replicas for availability
#   • Image: ingress-demo-frontend:latest
#   • Port: 80 (nginx default)
#   • Health checks hitting "/"
#
# frontend/service.yaml
#   Creates a stable network endpoint for frontend Pods:
#   • Type: ClusterIP
#   • port 80 → targetPort 80
#
# ingress/ingress.yaml  ← THE KEY FILE
#   Defines the Ingress routing rules:
#   • /api/* → backend Service (port 8080)
#   • /*     → frontend Service (port 80)
#   • Annotations configure the NGINX Ingress Controller
#
# configmap.yaml
#   Stores non-sensitive configuration data (optional, for demonstration).
# =============================================================================

# =============================================================================
# 4. DEPLOYMENT STEPS
# =============================================================================
# Step 1: Build the Docker images
#   docker build -t ingress-demo-backend:latest ./backend
#   docker build -t ingress-demo-frontend:latest ./frontend
#
# Step 2: Load images into your Kubernetes cluster
#   # minikube:
#   minikube image load ingress-demo-backend:latest
#   minikube image load ingress-demo-frontend:latest
#
#   # kind:
#   kind load docker-image ingress-demo-backend:latest
#   kind load docker-image ingress-demo-frontend:latest
#
#   # Docker Desktop: skip this step (images shared automatically)
#
# Step 3: Install NGINX Ingress Controller (if not already installed)
#   # minikube:
#   minikube addons enable ingress
#
#   # kind / generic:
#   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
#
#   # Wait for the controller to be ready:
#   kubectl get pods -n ingress --watch
#
# Step 4: Apply all Kubernetes manifests
#   kubectl apply -f kubernetes/
#
#   Or apply them individually:
#   kubectl apply -f kubernetes/namespace.yaml
#   kubectl apply -f kubernetes/configmap.yaml
#   kubectl apply -f kubernetes/backend/deployment.yaml
#   kubectl apply -f kubernetes/backend/service.yaml
#   kubectl apply -f kubernetes/frontend/deployment.yaml
#   kubectl apply -f kubernetes/frontend/service.yaml
#   kubectl apply -f kubernetes/ingress/ingress.yaml
#
# Step 5: Wait for all Pods to be ready
#   kubectl get pods -n ingress-demo --watch
#
#   You should see 4 pods (2 backend + 2 frontend) all in "Running" state.
#
# Step 6: Check the Ingress status
#   kubectl get ingress -n ingress-demo
#   kubectl describe ingress ingress-demo -n ingress-demo
#
#   The ADDRESS column should show the Ingress controller's IP.
# =============================================================================

# =============================================================================
# 5. TESTING THE INGRESS
# =============================================================================

# -----------------------------------------------------------------------------
# TEST A: Access via minikube tunnel (recommended for minikube)
# -----------------------------------------------------------------------------
#   minikube tunnel
#   # This assigns a load-balancer IP to the Ingress
#   # Copy the IP shown in another terminal
#
#   Then from your browser:
#   http://<INGRESS-IP>/            → React frontend
#   http://<INGRESS-IP>/api/message → Spring Boot backend
#   http://<INGRESS-IP>/api/health  → Backend health check
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# TEST B: Port-forward to the Ingress controller
# -----------------------------------------------------------------------------
#   # Find the ingress controller pod:
#   kubectl get pods -n ingress -l app.kubernetes.io/name=ingress-nginx
#
#   # Port-forward to it:
#   kubectl port-forward -n ingress <POD_NAME> 8080:80
#
#   Then:
#   http://localhost:8080/
#   http://localhost:8080/api/message
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# TEST C: Port-forward directly to a Service (bypasses Ingress)
# -----------------------------------------------------------------------------
#   # Frontend directly:
#   kubectl port-forward -n ingress-demo service/ingress-demo-frontend 3000:80
#   http://localhost:3000/
#
#   # Backend directly:
#   kubectl port-forward -n ingress-demo service/ingress-demo-backend 8080:8080
#   http://localhost:8080/api/message
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# TEST D: curl from inside the cluster
# -----------------------------------------------------------------------------
#   kubectl run curl-test --image=curlimages/curl:latest --rm -it -- \
#     sh -c "curl -s http://ingress-demo-frontend.ingress-demo.svc.cluster.local/ && echo '---' && curl -s http://ingress-demo-backend.ingress-demo.svc.cluster.local/api/message"
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# TEST E: Verify Ingress routing rules are working
# -----------------------------------------------------------------------------
#   # This should return React HTML:
#   curl http://<INGRESS-IP>/ | head -20
#
#   # This should return JSON from Spring Boot:
#   curl http://<INGRESS-IP>/api/message
#
#   # This should return health JSON:
#   curl http://<INGRESS-IP>/api/health
#
#   # This should return info JSON:
#   curl http://<INGRESS-IP>/api/info
# =============================================================================

# =============================================================================
# 6. CLEANUP
# =============================================================================
# Delete everything in the namespace:
#   kubectl delete namespace ingress-demo
#
# Delete individual resources:
#   kubectl delete ingress ingress-demo -n ingress-demo
#   kubectl delete deployment,service -n ingress-demo
#
# Delete the Ingress Controller (if you installed it just for this demo):
#   kubectl delete namespace ingress-nginx
#
# Remove Docker images (optional):
#   docker rmi ingress-demo-backend:latest
#   docker rmi ingress-demo-frontend:latest
# =============================================================================

# =============================================================================
# 7. TROUBLESHOOTING
# =============================================================================

# -----------------------------------------------------------------------------
# PROBLEM: Pods stuck in "Pending" or "ImagePullBackOff"
# -----------------------------------------------------------------------------
#   # Check pod status and events:
#   kubectl get pods -n ingress-demo
#   kubectl describe pod <POD_NAME> -n ingress-demo
#
#   # If ImagePullBackOff: the image isn't in the cluster.
#   # Rebuild and reload:
#   docker build -t ingress-demo-backend:latest ./backend
#   minikube image load ingress-demo-backend:latest   # or kind load docker-image
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# PROBLEM: Pods in "CrashLoopBackOff"
# -----------------------------------------------------------------------------
#   # Check container logs:
#   kubectl logs <POD_NAME> -n ingress-demo
#   kubectl logs <POD_NAME> -n ingress-demo --previous   # logs from last crash
#
#   # Common causes:
#   # • Application fails to start (port conflict, missing config)
#   # • Liveness probe failing → container keeps restarting
#   # • Insufficient memory → OOMKilled
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# PROBLEM: Ingress returns 404 or 502
# -----------------------------------------------------------------------------
#   # 404 = Ingress rules don't match the request path
#   # 502 = Ingress can't reach the backend Service
#
#   # Check Ingress status:
#   kubectl get ingress -n ingress-demo
#   kubectl describe ingress ingress-demo -n ingress-demo
#
#   # Check that Services and Endpoints exist:
#   kubectl get svc,endpoints -n ingress-demo
#
#   # Check NGINX Ingress Controller logs:
#   kubectl logs -n ingress -l app.kubernetes.io/name=ingress-nginx --tail=100
#
#   # Check the generated nginx config:
#   kubectl exec -n ingress <INGRESS_POD> -- cat /etc/nginx/nginx.conf | grep -A 20 "location /api"
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# PROBLEM: Frontend loads but API calls fail (CORS or 404)
# -----------------------------------------------------------------------------
#   # In the browser DevTools → Network tab:
#   # • Look at the failing /api/* request
#   # • Check the response status code
#
#   # 404: The path /api/* isn't reaching the backend
#   #   → Verify Ingress rules: kubectl describe ingress ingress-demo -n ingress-demo
#   #   → Verify backend Pods are running: kubectl get pods -n ingress-demo
#
#   # CORS errors (in dev only, not behind Ingress):
#   #   → Backend CORS config should allow the frontend origin
#   #   → See WebConfig.java
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# PROBLEM: "ingress-class nginx not found"
# -----------------------------------------------------------------------------
#   # The NGINX Ingress Controller isn't installed.
#   # Install it (see Prerequisites section above).
#   # Verify: kubectl get ingressclass
# -----------------------------------------------------------------------------

# =============================================================================
# 8. PRODUCTION CONSIDERATIONS
# =============================================================================
# When moving this demo to production, consider:
#
# 1. TLS/HTTPS
#    • Use cert-manager for automatic Let's Encrypt certificates
#    • Enable ssl-redirect in Ingress annotations
#    • Uncomment the tls section in ingress.yaml
#
# 2. Image Registry
#    • Push images to a private registry (ECR, GCR, ACR, Docker Hub)
#    • Use specific version tags (never :latest in production)
#    • Set imagePullPolicy: IfNotPresent or Always
#    • Configure imagePullSecrets for private registries
#
# 3. Resource Limits
#    • Tune CPU/memory requests and limits based on load testing
#    • Set resource quotas on the namespace
#
# 4. Horizontal Pod Autoscaler (HPA)
#    • Automatically scale Pods based on CPU/memory usage:
#      kubectl autoscale deployment ingress-demo-backend --cpu-percent=70 --min=2 --max=10
#
# 5. Pod Disruption Budget (PDB)
#    • Ensure minimum availability during node maintenance:
#      apiVersion: policy/v1
#      kind: PodDisruptionBudget
#      metadata:
#        name: backend-pdb
#        namespace: ingress-demo
#      spec:
#        minAvailable: 1
#        selector:
#          matchLabels:
#            app: ingress-demo-backend
#
# 6. Network Policies
#    • Restrict which Pods can communicate with each other
#
# 7. Monitoring
#    • Prometheus + Grafana for metrics
#    • Alerting on error rates, latency, pod restarts
#
# 8. Logging
#    • Centralized logging (ELK stack, Loki, CloudWatch)
#
# 9. Security
#    • Run containers as non-root user
#    • Use Pod Security Standards/Admission
#    • Scan images for vulnerabilities (Trivy, Snyk)
#    • Use Secrets for sensitive data (not ConfigMaps)
# =============================================================================
