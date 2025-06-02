# AWS Summit Sydney 2025 Demo
## Using kro Balancing Governance and Agility in Amazon EKS for Platform Teams

**This GitHub repo contains the demo we did in AWS Summit Sydney 2025.**

**Speakers:**
- [Arshad Zackeriya, AWS Hero](https://awsfanboy.com/)
- [Ramaswamy Arunachalam, AWS Community Builder](https://linktr.ee/ramulagam)

## Prerequisites

- **Amazon EKS Cluster** (EKS Auto Mode enabled is recommended for easier setup and no need to install core addons)
  - To learn about EKS Auto Mode, check this blog post: https://blog.awsfanboy.com/lets-explore-amazon-eks-auto-mode
- kubectl configured to access your cluster
- Helm v3
- AWS CLI configured with appropriate permissions
- jq installed

## Installation Guide

### 1. Install AWS Controllers for Kubernetes (ACK)

ACK lets you define and use AWS service resources directly from Kubernetes.

> **Note:**
> - Before running these scripts, review and update any variables such as the AWS region and EKS cluster name in the scripts (`install.sh` and `iam.sh`) to match your environment.

First, install the ACK controllers:

```bash
# Navigate to the ACK installation directory
cd platform-team/ack

# Run the installation script
./install.sh
```

After installing the controllers, set up the necessary IAM roles and policies by running the IAM setup script:

This script requires AWS CLI credentials with permissions to create IAM roles and policies.

```bash
./iam.sh
```

This will install the following ACK controllers:
- IAM Controller
- DynamoDB Controller
- EKS Controller

### 2. Install Kubernetes Resource Orchestrator (KRO)

KRO enables declarative resource orchestration for Kubernetes.

```bash
# Navigate to the KRO installation directory
cd platform-team/kro

# Run the installation script
./install.sh
```

### 3. Install KRO Resource Graph Definition (RGD)

The Resource Graph Definition defines the Feijoa application stack.

- **If you are using a custom domain name, use `feijoa-rgd-with-hostname.yaml` and make sure to install the External DNS add-on.**
- **Otherwise, use `feijoa-rgd.yaml`.**

```bash
# Apply the RGD to your cluster
kubectl apply -f platform-team/feijoa-rgd.yaml
# For custom domain:
kubectl apply -f platform-team/feijoa-rgd-with-hostname.yaml
```

### 4. Build and Push the Feijoa Application Docker Image

The `app/` folder contains the source code for the Feijoa sample application, including frontend, backend, and supporting files.

1. **Set up your ECR repository** (if not already created):
   ```zsh
   aws ecr create-repository --repository-name feijoa-app
   ```

2. **Authenticate Docker to your ECR registry:**
   ```zsh
   aws ecr get-login-password | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
   ```
   Replace `<aws_account_id>` and `<region>` with your AWS account ID and region.

3. **Build and push the Docker image using the provided script:**
   Update your region
   ```zsh
   cd app
   ./build-and-push.sh
   ```
   This script will build the Docker image and push it to your ECR repository.

4. **Update the image in `dev-team/feijoa-store.yml`** with the ECR image URL you just pushed.

### 5. Deploy the Feijoa Application

Deploy the sample Feijoa application using the defined RGD.

```bash
# Apply the application configuration
kubectl apply -f dev-team/feijoa-store.yml
```

## Application Components

The Feijoa application stack includes:
- Kubernetes Deployment with configurable replicas
- Service for internal communication
- Optional Ingress for external access
- DynamoDB table for data storage
- IAM roles and policies for AWS service access
- Pod Identity Association for secure AWS authentication

## Monitoring and Management

To check the status of your deployment:

```bash
# View the Feijoa application status
kubectl get feijoaappstack -n default

# Check the underlying resources
kubectl get deployment,service,ingress -n default
kubectl get table -n default
```

## Troubleshooting

If you encounter issues:

1. Check ACK controller status:
   ```bash
   kubectl get pods -n ack-system
   ```

2. Check KRO controller status:
   ```bash
   kubectl get pods -n kro
   ```

3. View application logs:
   ```bash
   kubectl logs -l app=store -n default
   ```

## License

See the [LICENSE](LICENSE) file for details.

---

**References:**
- ACK: https://aws-controllers-k8s.github.io/community/docs/community/overview/
- KRO: https://kro.run/