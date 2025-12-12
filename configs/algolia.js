// algolia.js
import algoliasearch from 'algoliasearch/lite';  // ✅ Correct for React Native

// Initialize Algolia with your app ID and API key
const client = algoliasearch(
  '5PA520MX69',                         // your App ID (looks correct)
  '6fbf6787bcf2731ac19c6ded1644c202'    // your Search-Only API key
);

// Initialize the index
const index = client.initIndex('clothes');

export { index };
