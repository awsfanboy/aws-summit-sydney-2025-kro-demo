import { useState, useEffect } from 'react'
import { getItem, updateItem } from './dynamodbService'
import { FeijoaIcon, FeijoaBucketIcon } from './feijoa-icon'
import './App.css'

// Check if we're running in development mode
const isDev = import.meta.env.DEV;

function App() {
  const [bucketCount, setBucketCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [animateAdd, setAnimateAdd] = useState(false)
  const [debugInfo, setDebugInfo] = useState({})
  const [updateInProgress, setUpdateInProgress] = useState(false)

  // Load initial data from DynamoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Collect debug info
        const debug = {
          region: window.VITE_AWS_REGION || 'not set',
          tableName: window.VITE_DYNAMODB_TABLE_NAME || 'not set',
          timestamp: new Date().toISOString()
        }
        setDebugInfo(debug)
        console.log('Debug info:', debug)
        
        // Get bucket data
        const bucketData = await getItem('bucket')
        console.log('Bucket data:', bucketData)
        
        if (bucketData) {
          setBucketCount(bucketData.value || 0)
        } else {
          console.log('No bucket data found, initializing with 0')
          // Initialize bucket if it doesn't exist
          await updateItem('bucket', { value: 0 })
          setBucketCount(0)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update bucket in DynamoDB and local state
  const updateBucket = async (newCount) => {
    if (updateInProgress) return;
    
    try {
      setUpdateInProgress(true);
      setError(null);
      
      if (newCount > bucketCount) {
        setAnimateAdd(true)
        setTimeout(() => setAnimateAdd(false), 1000)
      }
      
      console.log(`Updating bucket count to ${newCount}`)
      
      // Update local state first for better UX
      setBucketCount(newCount)
      
      // Then update in DynamoDB
      await updateItem('bucket', { value: newCount })
      console.log('Update successful')
    } catch (err) {
      console.error('Error updating bucket:', err)
      setError('Failed to update bucket: ' + err.message)
      // Revert to previous count on error
      setBucketCount(bucketCount)
    } finally {
      setUpdateInProgress(false);
    }
  }

  if (loading) return (
    <div className="container">
      <div className="icon-container">
        <FeijoaIcon size={60} />
      </div>
      <h2>Loading...</h2>
    </div>
  )

  return (
    <div className="container">
      <div className="app-header">
        <FeijoaIcon size={40} />
        <h1>Feijoa Bucket</h1>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <div className="card">
        <h2>Your Feijoa Collection</h2>
        
        <div className="bucket-display">
          <FeijoaBucketIcon size={100} count={bucketCount} />
          {animateAdd && (
            <div className="feijoa-animation" style={{ position: 'absolute', top: '-20px' }}>
              <FeijoaIcon size={30} />
            </div>
          )}
        </div>
        
        <div className="bucket-value">
          {bucketCount} {bucketCount === 1 ? 'Feijoa' : 'Feijoas'}
        </div>
        
        <div className="bucket-controls">
          <button 
            onClick={() => updateBucket(Math.max(0, bucketCount - 1))}
            disabled={bucketCount <= 0 || updateInProgress}
            className="bucket-button"
          >
            <FeijoaIcon size={20} /> Remove Feijoa
          </button>
          <button 
            onClick={() => updateBucket(bucketCount + 1)}
            disabled={updateInProgress}
            className="bucket-button"
          >
            <FeijoaIcon size={20} /> Add Feijoa
          </button>
        </div>
        
        
      </div>
    </div>
  )
}

export default App