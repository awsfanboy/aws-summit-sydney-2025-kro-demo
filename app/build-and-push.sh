#!/bin/bash
set -e

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-ap-southeast-2}
REPO_NAME=feijoa-app
IMAGE_TAG=latest
ECR_REPO=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME

echo "Building and pushing to ECR in account $ACCOUNT_ID, region $REGION"

# Ensure repository exists
aws ecr describe-repositories --repository-names $REPO_NAME --region $REGION || \
  aws ecr create-repository --repository-name $REPO_NAME --region $REGION

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Set up Docker buildx for multi-architecture builds
docker buildx inspect multiarch >/dev/null 2>&1 || docker buildx create --name multiarch --use

# Build and push multi-architecture image directly to ECR
echo "Building and pushing multi-architecture Docker image..."
docker buildx build --platform linux/amd64,linux/arm64 \
  --tag $ECR_REPO:$IMAGE_TAG \
  --push \
  .

echo "Done! Multi-architecture image pushed to $ECR_REPO:$IMAGE_TAG"