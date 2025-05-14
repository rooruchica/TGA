import { API_BASE_URL } from './api-client';

/**
 * Checks if the backend server is running
 * @returns {Promise<boolean>} True if the server is running, false otherwise
 */
export async function checkBackendServer() {
  console.log('Checking if backend server is running...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/test/mongodb`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Increased timeout to 5 seconds for slower connections
      signal: AbortSignal.timeout(5000)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`Server responded in ${responseTime}ms`);
    
    if (response.ok) {
      console.log('Backend server is running');
      return true;
    } else {
      console.error('Backend server returned an error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error checking backend server:', error);
    
    // Provide more specific error messages based on error type
    if (error.name === 'AbortError') {
      console.error('Request timed out - server might be slow or not running');
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      console.error('Network error - server might not be running');
    }
    
    return false;
  }
}

/**
 * Creates a UI overlay to show an error message when the backend server is not running
 */
export function showServerErrorMessage() {
  // Remove any existing error message first
  const existingError = document.getElementById('server-error-overlay');
  if (existingError) {
    existingError.remove();
  }
  
  // Create the error overlay
  const overlay = document.createElement('div');
  overlay.id = 'server-error-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    z-index: 9999;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 2rem;
    max-width: 500px;
    text-align: center;
  `;
  
  const title = document.createElement('h2');
  title.textContent = 'Backend Server Not Running';
  title.style.cssText = `
    color: #DC143C;
    margin-bottom: 1rem;
  `;
  
  const message = document.createElement('p');
  message.innerHTML = `
    The application cannot connect to the backend server. Please make sure the server is running by executing the following command in your terminal:
    <br><br>
    <code style="
      background-color: #f5f5f5;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-family: monospace;
      display: block;
      margin: 1rem 0;
    ">cd server && npm run dev</code>
    <br>
    Once the server is running, refresh this page.
  `;
  
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.cssText = `
    background-color: #DC143C;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1.5rem;
    margin-top: 1rem;
    cursor: pointer;
    font-weight: 500;
  `;
  closeButton.onclick = () => {
    overlay.remove();
  };
  
  content.appendChild(title);
  content.appendChild(message);
  content.appendChild(closeButton);
  overlay.appendChild(content);
  
  document.body.appendChild(overlay);
}

/**
 * Checks if the backend server is running and shows an error message if it's not
 * @returns {Promise<boolean>} True if the server is running, false otherwise
 */
export async function checkServerAndShowError() {
  try {
    // Set a timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Server check timed out')), 6000);
    });
    
    // Race between the actual check and the timeout
    const isServerRunning = await Promise.race([
      checkBackendServer(),
      timeoutPromise.then(() => {
        console.warn('Server check timed out, assuming server is running');
        return true; // Assume server is running if check times out
      }).catch(() => {
        console.warn('Server check timed out, assuming server is running');
        return true; // Assume server is running if promise rejects
      })
    ]);
    
    if (!isServerRunning) {
      showServerErrorMessage();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error during server check:', error);
    // Don't show error message on timeout, assume server might be running
    if (!error.message.includes('timed out')) {
      showServerErrorMessage();
    }
    return true; // Let the application proceed
  }
} 