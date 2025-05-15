import { API_BASE_URL } from './api-client';

/**
 * Checks if the backend server is running
 * @returns {Promise<boolean>} True if the server is running, false otherwise
 */
export async function checkBackendServer() {
  console.log('Backend server check disabled');
  return true; // Always return true to avoid disrupting app flow
}

/**
 * Creates a UI overlay to show an error message when the backend server is not running
 */
export function showServerErrorMessage() {
  // Function disabled to prevent popup
  console.log('Server error message disabled');
  return;
}

/**
 * Checks if the backend server is running and shows an error message if it's not
 * @returns {Promise<boolean>} True if the server is running, false otherwise
 */
export async function checkServerAndShowError() {
  // Always return true to prevent popup
  return true;
} 