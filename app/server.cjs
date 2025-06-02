const express = require("express");
const cors = require("cors");
const path = require("path");
const AWS = require("aws-sdk");
const app = express();
const port = process.env.PORT || 80;

// Configure AWS SDK
const region = process.env.AWS_REGION || "ap-southeast-2";
const tableName = process.env.DYNAMODB_TABLE_NAME || "feijoa-stack-table";
const tableArn = process.env.DYNAMODB_TABLE_ARN || "";

console.log("Starting server with configuration:");
console.log(`- AWS Region: ${region}`);
console.log(`- DynamoDB Table Name: ${tableName}`);
console.log(`- DynamoDB Table ARN: ${tableArn}`);

// Configure AWS SDK with EKS Pod Identity
AWS.config.update({ 
  region,
  // The SDK will automatically use the EKS Pod Identity credentials
  // when running in an EKS pod with the proper environment variables
  maxRetries: 3
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "dist")));

// Serve config.js with environment variables
app.get("/config.js", (req, res) => {
  res.set("Content-Type", "application/javascript");
  res.send(`
    window.VITE_AWS_REGION = "${region}";
    window.VITE_DYNAMODB_TABLE_NAME = "${tableName}";
    window.AWS_SDK_LOAD_CONFIG = 1;
  `);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("healthy");
});

// API endpoint to get item from DynamoDB
app.get("/api/items/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Getting item with id: ${id} from table: ${tableName}`);
    
    const params = {
      TableName: tableName,
      Key: { id }
    };
    
    const result = await dynamoDB.get(params).promise();
    console.log("DynamoDB get result:", result);
    res.json(result.Item || null);
  } catch (error) {
    console.error("Error getting item:", error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to update item in DynamoDB
app.post("/api/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    console.log(`Updating item with id: ${id} in table: ${tableName}`);
    console.log("Update data:", data);
    
    // Create update expression and attribute values
    const updateExpressions = [];
    const expressionAttributeValues = {};
    
    Object.entries(data).forEach(([key, value]) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = value;
    });
    
    // Create expression attribute names
    const expressionAttributeNames = {};
    Object.keys(data).forEach(key => {
      expressionAttributeNames[`#${key}`] = key;
    });
    
    const params = {
      TableName: tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    };
    
    console.log("DynamoDB update params:", JSON.stringify(params, null, 2));
    
    const result = await dynamoDB.update(params).promise();
    console.log("DynamoDB update result:", result);
    res.json(result.Attributes);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize bucket data if it doesn't exist
async function initializeBucket() {
  try {
    console.log("Checking if bucket data exists...");
    const params = {
      TableName: tableName,
      Key: { id: "bucket" }
    };
    
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
      console.log("Initializing bucket data with value 0");
      await dynamoDB.update({
        TableName: tableName,
        Key: { id: "bucket" },
        UpdateExpression: "SET #value = :value",
        ExpressionAttributeNames: { "#value": "value" },
        ExpressionAttributeValues: { ":value": 0 },
        ReturnValues: "ALL_NEW"
      }).promise();
      console.log("Bucket initialized successfully");
    } else {
      console.log("Bucket data already exists:", result.Item);
    }
  } catch (error) {
    console.error("Error initializing bucket data:", error);
  }
}

// Serve the main app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Region: ${region}, Table: ${tableName}`);
  
  // Initialize bucket data
  initializeBucket();
});
