#!/bin/bash
export ACK_K8S_NAMESPACE=ack-system
export AWS_REGION=ap-southeast-2
export EKS_CLUSTER_NAME=dev-demo-cluster

SERVICES=("iam" "dynamodb" "eks")

for SERVICE in "${SERVICES[@]}"; do
  RELEASE_VERSION=$(curl -sL https://api.github.com/repos/aws-controllers-k8s/${SERVICE}-controller/releases/latest | jq -r '.tag_name | ltrimstr("v")')
  
  aws ecr-public get-login-password --region us-east-1 | helm registry login --username AWS --password-stdin public.ecr.aws
  helm install --create-namespace -n $ACK_K8S_NAMESPACE ack-$SERVICE-controller \
    oci://public.ecr.aws/aws-controllers-k8s/$SERVICE-chart --version=$RELEASE_VERSION --set=aws.region=$AWS_REGION
done

