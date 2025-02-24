// algolia.js
import algoliasearch from 'algoliasearch';  // Use the default version (not 'lite')

// Initialize Algolia with your app ID and API key
const client = algoliasearch('VIX0G4CQXG', 'e28a685420a7303098b8683c143e094d'); // Your credentials

// Initialize the index
const index = client.initIndex('clothes');  // Replace 'clothes' with your actual index name
export { index };  // Export the index to use it elsewhere
