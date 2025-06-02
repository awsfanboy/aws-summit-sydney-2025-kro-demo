// AWS SDK Configuration for browser environment
console.log('Loading AWS configuration...');

// Enable AWS SDK load config
window.AWS_SDK_LOAD_CONFIG = 1;

// Set AWS region from environment variable
if (window.VITE_AWS_REGION && window.VITE_AWS_REGION !== '__AWS_REGION__') {
  console.log('AWS Region set to:', window.VITE_AWS_REGION);
} else {
  console.log('AWS Region not set, using default');
  window.VITE_AWS_REGION = 'ap-southeast-2';
}

// Set DynamoDB table name from environment variable
if (window.VITE_DYNAMODB_TABLE_NAME && window.VITE_DYNAMODB_TABLE_NAME !== '__DYNAMODB_TABLE_NAME__') {
  console.log('DynamoDB table name set to:', window.VITE_DYNAMODB_TABLE_NAME);
} else {
  console.log('DynamoDB table name not set, using default');
  window.VITE_DYNAMODB_TABLE_NAME = 'feijoa-stack-table';
}

// Note: We don't need to configure AWS credentials in the browser
// The server will handle all AWS API calls with pod identity

console.log('AWS configuration loaded');