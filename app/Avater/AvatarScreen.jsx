import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView
} from 'react-native';
import WebView from 'react-native-webview';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './../../configs/firebase';

export default function AvatarScreen({ navigation }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarId, setAvatarId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  const [modelLink, setModelLink] = useState(null);
  const [savingToDb, setSavingToDb] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const webViewRef = useRef(null);
  
  // Get current user
  const user = auth.currentUser;
  
  // Ready Player Me configuration
  const RPM_CONFIG = {
    appId: '671e7cac45f8fd0eb854d681', // Replace with actual app ID
    clearCache: true,
    frameApi: true
  };
  
  // Construct the Ready Player Me URL with query parameters
  const queryParams = Object.entries(RPM_CONFIG)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const RPM_URL = `https://fasionfitsme.readyplayer.me/avatar`;
  
  // JavaScript to inject to monitor clipboard events and UI interactions
  const injectedJavaScript = `
    (function() {
      // Track if we've already added our clipboard listeners
      window.clipboardListenerAdded = window.clipboardListenerAdded || false;
      window.lastCopiedGlbLink = null;
      
      // Function to look for copy buttons and add listeners
      function addCopyButtonListeners() {
        // Look for buttons that might be "Copy to clipboard" buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          if (!button.hasClipboardListener && 
              (button.innerText.toLowerCase().includes('copy') || 
               button.title?.toLowerCase().includes('copy') ||
               button.getAttribute('aria-label')?.toLowerCase().includes('copy') ||
               button.className.toLowerCase().includes('copy'))) {
            
            button.hasClipboardListener = true;
            button.addEventListener('click', () => {
              // Send event to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'copyButtonClicked',
                data: { buttonText: button.innerText }
              }));
              
              // Check the page for any GLB links that might be getting copied
              setTimeout(() => {
                // Look for elements containing GLB links
                const glbLinkElems = Array.from(document.querySelectorAll('*')).filter(el => {
                  const text = el.textContent || el.value || '';
                  return (text.includes('.glb') || text.includes('models.readyplayer.me')) && 
                         text.length < 200; // Avoid large blocks of text
                });
                
                glbLinkElems.forEach(el => {
                  const text = el.textContent || el.value || '';
                  const glbPattern = /(https?:\\/\\/[\\w\\.-]+\\/[\\w\\.-\\/]+\\.glb|https?:\\/\\/models\\.readyplayer\\.me\\/[\\w\\d]+(?:\\.glb)?)/i;
                  const match = text.match(glbPattern);
                  
                  if (match && match[0]) {
                    window.lastCopiedGlbLink = match[0];
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      event: 'potentialGlbLinkDetected',
                      data: { url: match[0] }
                    }));
                  }
                });
              }, 100);
            });
          }
        });
      }
      
      // Create a MutationObserver to detect DOM changes
      const observer = new MutationObserver((mutations) => {
        // Add listeners to any copy buttons
        addCopyButtonListeners();
        
        // Look for buttons with 'next' or 'continue' text
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          if (!button.hasNavigationListener && 
              (button.innerText.toLowerCase().includes('next') || 
               button.innerText.toLowerCase().includes('continue') ||
               button.innerText.toLowerCase().includes('finish') ||
               button.innerText.toLowerCase().includes('complete'))) {
            
            button.hasNavigationListener = true;
            button.addEventListener('click', () => {
              // Send event to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'navigationButtonClicked',
                data: { buttonText: button.innerText }
              }));
              
              // Look for copy buttons after a slight delay
              setTimeout(addCopyButtonListeners, 1000);
            });
          }
        });
        
        // Look for the avatar ID when it appears in the URL
        if (window.location.href.includes('models.readyplayer.me') || 
            window.location.href.includes('avatar/') || 
            window.location.href.includes('download')) {
          
          const urlMatch = window.location.href.match(/avatar\\/([\\w\\d]+)|\\/([\\w\\d]+)(?:\\.glb|$)/i);
          if (urlMatch && (urlMatch[1] || urlMatch[2])) {
            const avatarId = urlMatch[1] || urlMatch[2];
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'avatarIdDetected',
              data: { id: avatarId }
            }));
          }
        }
      });
      
      // Start observing the document for button additions
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        characterData: true,
        subtree: true
      });
      
      // Override the clipboard API to capture GLB links
      if (!window.clipboardListenerAdded) {
        window.clipboardListenerAdded = true;
        
        // Store the original clipboard functions
        const originalWriteText = navigator.clipboard.writeText;
        
        // Override writeText to capture the data
        navigator.clipboard.writeText = function(text) {
          // Check if it's a GLB link
          if (text && typeof text === 'string' &&
              (text.includes('.glb') || text.includes('models.readyplayer.me'))) {
            
            window.lastCopiedGlbLink = text;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'clipboardWrite',
              data: { text: text }
            }));
          }
          
          // Call the original function
          return originalWriteText.apply(navigator.clipboard, arguments);
        };
        
        // Add global event listener for copy events
        document.addEventListener('copy', function() {
          setTimeout(() => {
            if (window.lastCopiedGlbLink) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'documentCopy',
                data: { lastKnownGlbLink: window.lastCopiedGlbLink }
              }));
            }
          }, 100);
        });
        
        // Wait for page to be ready, then check for links
        if (document.readyState === 'complete') {
          addCopyButtonListeners();
        } else {
          window.addEventListener('load', addCopyButtonListeners);
        }
      }
      
      // Listen for messages from the iframe if there's one
      window.addEventListener('message', function(event) {
        if (event.data && typeof event.data === 'object') {
          // Forward any relevant events to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'iframeMessage',
            data: event.data
          }));
          
          // Check if it's an avatar exported event
          if (event.data.type === 'v1.avatar.exported') {
            const avatarUrl = event.data.data?.url;
            if (avatarUrl) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'avatarExported',
                data: { url: avatarUrl, id: event.data.data?.id }
              }));
            }
          }
        }
      });
      
      // Initial call to add listeners to any existing buttons
      addCopyButtonListeners();
      
      true;
    })();
  `;

  // Save model URL to Firestore
  const saveModelUrlToFirestore = async (modelUrl) => {
    if (!user || !user.uid) {
      console.error('Cannot save model URL: No user is logged in');
      return false;
    }

    try {
      setSavingToDb(true);
      
      // Reference to the user's document
      const userDocRef = doc(db, 'users', user.uid);
      
      // Update the user document with the model URL
      await updateDoc(userDocRef, {
        modelURL: modelUrl,
        lastUpdated: new Date()
      }).catch(async (error) => {
        // If the document doesn't exist yet, create it
        if (error.code === 'not-found') {
          await setDoc(userDocRef, {
            modelURL: modelUrl,
            lastUpdated: new Date(),
            createdAt: new Date()
          });
        } else {
          throw error;
        }
      });
      
      console.log('Model URL saved to Firestore successfully');
      setSaveSuccess(true);
      return true;
    } catch (error) {
      console.error('Error saving model URL to Firestore:', error);
      return false;
    } finally {
      setSavingToDb(false);
    }
  };

  // Handle messages from the WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (!data || !data.event) return;
      
      console.log('Received WebView event:', data.event, data.data);
      
      switch (data.event) {
        case 'clipboardWrite':
        case 'potentialGlbLinkDetected':
        case 'documentCopy':
          // Handle GLB link that was copied to clipboard
          if (data.data?.text || data.data?.url || data.data?.lastKnownGlbLink) {
            const glbLink = data.data.text || data.data.url || data.data.lastKnownGlbLink;
            console.log('GLB link detected from clipboard:', glbLink);
            
            // Make sure it's a valid GLB URL
            if (glbLink.includes('.glb') || glbLink.includes('models.readyplayer.me')) {
              setModelLink(glbLink);
              // No longer automatically save the model link
            }
          }
          break;
          
        case 'copyButtonClicked':
          console.log('Copy button clicked:', data.data?.buttonText);
          // The potentialGlbLinkDetected event should follow this
          break;
          
        case 'navigationButtonClicked':
          console.log('Navigation button clicked:', data.data?.buttonText);
          // We'll wait for copy buttons to appear after this
          break;
          
        case 'avatarIdDetected':
          if (data.data?.id) {
            console.log('Avatar ID detected in URL:', data.data.id);
            setAvatarId(data.data.id);
            
            // Construct the GLB file URL
            const glbUrl = `https://models.readyplayer.me/${data.data.id}.glb`;
            console.log('Generated GLB URL:', glbUrl);
            setModelLink(glbUrl);
          }
          break;
          
        case 'avatarExported':
          // Avatar creation completed
          if (data.data?.url) {
            const avatarUrl = data.data.url;
            const avatarId = data.data.id;
            
            setAvatarUrl(avatarUrl);
            setAvatarId(avatarId);
            
            // Construct the GLB file URL
            const glbUrl = `https://models.readyplayer.me/${avatarId}.glb`;
            console.log('GLB URL from avatar export:', glbUrl);
            setModelLink(glbUrl);
          }
          break;
          
        case 'iframeMessage':
          // Handle messages from iframe if needed
          console.log('Message from iframe:', data.data);
          if (data.data?.type === 'v1.avatar.exported' && data.data?.data?.url) {
            const avatarUrl = data.data.data.url;
            const avatarId = data.data.data.id;
            setAvatarUrl(avatarUrl);
            setAvatarId(avatarId);
          }
          break;
          
        case 'error':
          setIsWebViewLoading(false);
          setIsLoading(false);
          console.error('Avatar creation error', data);
          break;
          
        default:
          console.log('Unhandled event:', data);
          break;
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
      setIsLoading(false);
    }
  };
  
  // For manual save button
  const saveModelLink = () => {
    if (modelLink) {
      saveModelUrlToFirestore(modelLink);
    } else if (avatarId) {
      const glbUrl = `https://models.readyplayer.me/${avatarId}.glb`;
      setModelLink(glbUrl);
      saveModelUrlToFirestore(glbUrl);
    } else {
      console.error('No avatar model link available');
    }
  };
  
  // Navigate to home screen after successful save
  const navigateToHome = () => {
    if (navigation?.navigate) {
      navigation.navigate('Home', { 
        modelLink: modelLink
      });
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Avatar Creator</Text>
      </View>
      
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: RPM_URL }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          injectedJavaScript={injectedJavaScript}
          startInLoadingState={true}
          onLoadStart={() => setIsWebViewLoading(true)}
          onLoadEnd={() => setIsWebViewLoading(false)}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading avatar editor...</Text>
            </View>
          )}
        />
        
        {savingToDb && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.overlayText}>Saving model link to database...</Text>
          </View>
        )}
      </View>
      
      <View style={styles.controlsContainer}>
        {/* Instructions for user */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>How to save your avatar:</Text>
          <Text style={styles.instructionText}>
            1. Create your avatar{'\n'}
            2. Click "Copy" when you see it{'\n'}
            3. Click "Save Avatar" button below to save your avatar
          </Text>
        </View>
      
        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          {saveSuccess ? (
            <TouchableOpacity 
              style={[styles.button, styles.continueButton]}
              onPress={navigateToHome}
            >
              <Text style={styles.buttonText}>Continue to Home</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]}
              onPress={saveModelLink}
              disabled={savingToDb}
            >
              <Text style={styles.buttonText}>
                {savingToDb ? 'Saving...' : 'Save Avatar'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Show success message */}
        {saveSuccess && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Your avatar model link has been saved successfully!
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#4361EE',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  webviewContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  controlsContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  instructionContainer: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#fff8e8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe4b8',
  },
  instructionTitle: {
    fontWeight: 'bold',
    color: '#b45309',
    marginBottom: 8,
    fontSize: 16,
  },
  instructionText: {
    color: '#4b5563',
    lineHeight: 20,
  },
  successContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  successText: {
    color: '#065f46',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 5,
  },
  saveButton: {
    backgroundColor: '#34D399',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});