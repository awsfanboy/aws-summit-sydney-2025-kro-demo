// Mock DynamoDB implementation for development and fallback
const mockStorage = {
  bucket: { id: 'bucket', value: 0 }
};

// Mock get operation
const get = (params) => {
  console.log('Mock DynamoDB get:', params);
  const item = mockStorage[params.Key.id];
  
  return {
    promise: () => Promise.resolve({
      Item: item
    })
  };
};

// Mock update operation
const update = (params) => {
  console.log('Mock DynamoDB update:', params);
  
  // Parse the update expression
  const key = params.Key.id;
  const item = mockStorage[key] || { id: key };
  
  // Apply updates based on expression attributes
  Object.entries(params.ExpressionAttributeValues).forEach(([exprKey, value]) => {
    const actualKey = Object.entries(params.ExpressionAttributeNames)
      .find(([_, nameValue]) => `:${nameValue.substring(1)}` === exprKey)?.[1]
      .substring(1);
    
    if (actualKey) {
      item[actualKey] = value;
    }
  });
  
  // Store the updated item
  mockStorage[key] = item;
  
  return {
    promise: () => Promise.resolve({
      Attributes: item
    })
  };
};

// Export mock DynamoDB client
export default {
  get,
  update
};