export EKS_CLUSTER_NAME=dev-demo-cluster
export AWS_REGION=ap-southeast-2
export ACK_K8S_NAMESPACE=ack-system

SERVICES=("iam" "dynamodb" "eks")

for SERVICE in "${SERVICES[@]}"; do
  echo "Processing service: $SERVICE"

  # Update the service name variables as needed
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
  OIDC_PROVIDER=$(aws eks describe-cluster --name $EKS_CLUSTER_NAME --region $AWS_REGION --query "cluster.identity.oidc.issuer" --output text | sed -e "s/^https:\/\///")
  echo "OIDC_PROVIDER: $OIDC_PROVIDER"
  ACK_K8S_SERVICE_ACCOUNT_NAME=ack-$SERVICE-controller

  read -r -d '' TRUST_RELATIONSHIP <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/${OIDC_PROVIDER}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "${OIDC_PROVIDER}:sub": "system:serviceaccount:${ACK_K8S_NAMESPACE}:${ACK_K8S_SERVICE_ACCOUNT_NAME}"
        }
      }
    }
  ]
}
EOF
  echo "${TRUST_RELATIONSHIP}" > trust.json

  ACK_CONTROLLER_IAM_ROLE="ack-${SERVICE}-controller"
  ACK_CONTROLLER_IAM_ROLE_DESCRIPTION="IRSA role for ACK ${SERVICE} controller deployment on EKS cluster using Helm charts"

  # Check if the role exists
  if aws iam get-role --role-name "${ACK_CONTROLLER_IAM_ROLE}" > /dev/null 2>&1; then
    echo "Role ${ACK_CONTROLLER_IAM_ROLE} already exists. Updating trust relationship..."
    aws iam update-assume-role-policy --role-name "${ACK_CONTROLLER_IAM_ROLE}" --policy-document file://trust.json
  else
    echo "Creating role ${ACK_CONTROLLER_IAM_ROLE}..."
    aws iam create-role --role-name "${ACK_CONTROLLER_IAM_ROLE}" --assume-role-policy-document file://trust.json --description "${ACK_CONTROLLER_IAM_ROLE_DESCRIPTION}"
  fi

  ACK_CONTROLLER_IAM_ROLE_ARN=$(aws iam get-role --role-name=$ACK_CONTROLLER_IAM_ROLE --query Role.Arn --output text)

  # Download the recommended managed and inline policies and apply them to the
  # newly created or existing IRSA role
  BASE_URL=https://raw.githubusercontent.com/aws-controllers-k8s/${SERVICE}-controller/main
  POLICY_ARN_URL=${BASE_URL}/config/iam/recommended-policy-arn
  POLICY_ARN_STRINGS="$(wget -qO- ${POLICY_ARN_URL})"

  INLINE_POLICY_URL=${BASE_URL}/config/iam/recommended-inline-policy
  INLINE_POLICY="$(wget -qO- ${INLINE_POLICY_URL})"

  while IFS= read -r POLICY_ARN; do
      # Skip empty lines and validate ARN length
      if [ -n "$POLICY_ARN" ] && [ ${#POLICY_ARN} -ge 20 ]; then
          echo -n "Attaching $POLICY_ARN ... "
          aws iam attach-role-policy \
              --role-name "${ACK_CONTROLLER_IAM_ROLE}" \
              --policy-arn "${POLICY_ARN}"
          echo "ok."
      elif [ -n "$POLICY_ARN" ]; then
          echo "Skipping invalid policy ARN: $POLICY_ARN (length: ${#POLICY_ARN}, minimum required: 20)"
      fi
  done <<< "$POLICY_ARN_STRINGS"

  if [ ! -z "$INLINE_POLICY" ]; then
      echo -n "Putting inline policy ... "
      aws iam put-role-policy \
          --role-name "${ACK_CONTROLLER_IAM_ROLE}" \
          --policy-name "ack-recommended-policy" \
          --policy-document "$INLINE_POLICY"
      echo "ok."
  fi

  # Annotate the service account with the ARN
  export IRSA_ROLE_ARN=eks.amazonaws.com/role-arn=$ACK_CONTROLLER_IAM_ROLE_ARN
  kubectl annotate serviceaccount -n $ACK_K8S_NAMESPACE ack-$SERVICE-controller $IRSA_ROLE_ARN --overwrite

  # kubectl describe serviceaccount/ack-iam-controller -n $ACK_K8S_NAMESPACE
  kubectl describe serviceaccount/ack-$SERVICE-controller -n $ACK_K8S_NAMESPACE

  # restart the ACK controller deployment
  kubectl rollout restart deployment ack-$SERVICE-controller-$SERVICE-chart -n $ACK_K8S_NAMESPACE
done