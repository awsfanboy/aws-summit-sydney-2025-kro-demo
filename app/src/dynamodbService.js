// No need to import AWS SDK in the frontend anymore
import mockDynamoDb from './mockDynamoDb';

// Initialize variables
const isLocalDev = import.meta.env.DEV;

console.log('DynamoDB Service Initialization:');
console.log('- Using API endpoints for DynamoDB access');
console.log('- Local Dev Mode:', isLocalDev);
console.log('- Table Name:', window.VITE_DYNAMODB_TABLE_NAME);

// Function to get an item from DynamoDB via API
export const getItem = async (id) => {
  try {
    console.log(`Getting item ${id} from API`);
    
    if (isLocalDev) {
      // Use mock in development
      const params = { TableName: 'feijoa-table', Key: { id } };
      const result = await mockDynamoDb.get(params).promise();
      return result.Item;
    }
    
    // Call API endpoint
    const response = await fetch(`/api/items/${id}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Get result:', data);
    return data;
  } catch (error) {
    console.error('Error getting item:', error);
    throw error;
  }
};

// Function to update an item in DynamoDB via API
export const updateItem = async (id, data) => {
  try {
    console.log(`Updating item ${id} with data:`, data);
    
    if (isLocalDev) {
      // Use mock in development
      const params = {
        TableName: 'feijoa-table',
        Key: { id },
        UpdateExpression: `SET ${Object.keys(data).map(k => `#${k} = :${k}`).join(', ')}`,
        ExpressionAttributeNames: Object.keys(data).reduce((acc, k) => ({ ...acc, [`#${k}`]: k }), {}),
        ExpressionAttributeValues: Object.entries(data).reduce((acc, [k, v]) => ({ ...acc, [`:${k}`]: v }), {}),
        ReturnValues: 'ALL_NEW'
      };
      const result = await mockDynamoDb.update(params).promise();
      return result.Attributes;
    }
    
    // Call API endpoint with debugging
    console.log(`Sending POST request to /api/items/${id}`);
    
    const response = await fetch(`/api/items/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Update result:', result);
    return result;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};
