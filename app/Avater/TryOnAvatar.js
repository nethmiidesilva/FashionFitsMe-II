import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './../../configs/firebase';
import { useLocalSearchParams } from "expo-router";

// Updated clothing store to include product sizes
const clothingStore = {
  shirts: [
    { 
      id: "shirt1", 
      name: "Formal Shirt", 
      type: "embedded", // External GLB file
      modelPath: "Wolf3D_Outfit_Top",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      thumbnail: "/api/placeholder/100/100",
    },
  ],
  pants: [
    { 
      id: "pants1", 
      name: "Jeans", 
      type: "embedded",
      objectName: "Wolf3D_Outfit_Bottom",
      thumbnail: "https://via.placeholder.com/100",
      color: "#000080"
    }
  ]
};

// Component to display clothing selection items
const ClothingSelector = ({ title, items, selectedItem, onSelect }) => {
  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.itemsGrid}>
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.clothingItem,
                { backgroundColor: item.color },
                selectedItem === item.id && styles.selectedItem
              ]}
              onPress={() => onSelect(item.id)}
            >
              <Image 
                source={{ uri: item.thumbnail }} 
                style={styles.itemThumbnail} 
                resizeMode="contain" 
              />
              <Text style={styles.itemName}>{item.name}</Text>
              {item.type === 'external' && (
                <View style={styles.externalBadge}>
                  <Text style={styles.externalBadgeText}>E</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// The HTML content that will be injected into the WebView
const generateHtmlContent = (avatarModelUrl, selectedClothing) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>3D Avatar Try-On</title>
      <style>
        body { margin: 0; overflow: hidden; }
        canvas { width: 100%; height: 100%; display: block; }
        #error-container {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 10px;
          background-color: rgba(255,0,0,0.7);
          color: white;
          display: none;
        }
        #loading-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(255,255,255,0.8);
          flex-direction: column;
        }
        .loading-spinner {
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <script async src="https://unpkg.com/es-module-shims@1.3.6/dist/es-module-shims.js"></script>
      <script type="importmap">
        {
          "imports": {
            "three": "https://unpkg.com/three@0.149.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.149.0/examples/jsm/"
          }
        }
      </script>
    </head>
    <body>
      <div id="canvas-container"></div>
      <div id="error-container"></div>
      <div id="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading your avatar...</p>
      </div>
      
      <script type="module">
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        
        // Get the avatar model URL and selected clothing items
        const avatarModelUrl = "${avatarModelUrl}";
        const selectedClothing = ${JSON.stringify(selectedClothing)};
        
        // Setup scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1, 3);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding;
        document.getElementById('canvas-container').appendChild(renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);
        
        // Add controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 2;
        controls.maxDistance = 10;
        controls.enablePan = false;
        
        // Load avatar model
        const loader = new GLTFLoader();
        console.log("Loading avatar from: " + avatarModelUrl);
        
        // Track avatar and clothing models
        let avatarModel = null;
        let clothingModels = [];
        
        loader.load(
          avatarModelUrl,
          function(gltf) {
            avatarModel = gltf.scene;
            avatarModel.position.set(0, -1, 0);
            avatarModel.scale.set(1.5, 1.5, 1.5);
            scene.add(avatarModel);
            
            // Reset all embedded clothing visibility first
            avatarModel.traverse((child) => {
              if (child.isMesh) {
                // Hide all clothing items first
                if (child.name.includes('Outfit_Top') || child.name.includes('Outfit_Bottom')) {
                  child.visible = false;
                }
              }
            });
            
            // Show only the selected embedded items
            if (selectedClothing.shirt && selectedClothing.shirt.type === 'embedded') {
              avatarModel.traverse((child) => {
                if (child.isMesh && child.name.includes(selectedClothing.shirt.objectName)) {
                  child.visible = true;
                  // Apply color to material
                  if (child.material && selectedClothing.shirt.color) {
                    child.material.color.set(selectedClothing.shirt.color);
                  }
                }
              });
            }
            
            if (selectedClothing.pants && selectedClothing.pants.type === 'embedded') {
              avatarModel.traverse((child) => {
                if (child.isMesh && child.name.includes(selectedClothing.pants.objectName)) {
                  child.visible = true;
                  // Apply color to material
                  if (child.material && selectedClothing.pants.color) {
                    child.material.color.set(selectedClothing.pants.color);
                  }
                }
              });
            }
            
            // Load external clothing items
            if (selectedClothing.product && selectedClothing.product.modelURL) {
              loadExternalClothing(selectedClothing.product);
            }
            
            // Hide loading container
            document.getElementById('loading-container').style.display = 'none';
            
            // Notify React Native that the avatar loaded successfully
            window.ReactNativeWebView?.postMessage(JSON.stringify({ 
              type: 'avatarLoaded',
              success: true
            }));
          },
          // Progress callback
          function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
          },
          // Error callback
          function(error) {
            console.error('Error loading avatar model:', error);
            document.getElementById('error-container').style.display = 'block';
            document.getElementById('error-container').textContent = 'Error loading avatar model: ' + error.message;
            document.getElementById('loading-container').style.display = 'none';
            
            // Notify React Native about the error
            window.ReactNativeWebView?.postMessage(JSON.stringify({ 
              type: 'avatarLoadError',
              message: error.message
            }));
          }
        );
        
        // Function to load external clothing items
        function loadExternalClothing(product) {
          // Remove existing clothing models
          clothingModels.forEach(model => {
            scene.remove(model);
          });
          clothingModels = [];
          
          console.log("Loading external clothing model from:", product.modelURL);
          
          loader.load(
            product.modelURL,
            function(gltf) {
              const clothingModel = gltf.scene;
              
              // Default position/rotation/scale - should be customized based on your model requirements
              clothingModel.position.set(0, -1, 0);
              clothingModel.rotation.set(0, 0, 0);
              clothingModel.scale.set(1.5, 1.5, 1.5);
              
              // Apply color if specified
              if (product.color) {
                clothingModel.traverse((child) => {
                  if (child.isMesh && child.material) {
                    // Create a new material to avoid modifying the cached one
                    if (Array.isArray(child.material)) {
                      child.material = child.material.map(mat => {
                        const newMat = mat.clone();
                        newMat.color.set(product.color);
                        return newMat;
                      });
                    } else {
                      const newMaterial = child.material.clone();
                      newMaterial.color.set(product.color);
                      child.material = newMaterial;
                    }
                  }
                });
              }
              
              scene.add(clothingModel);
              clothingModels.push(clothingModel);
              
              // Notify React Native that the clothing loaded successfully
              window.ReactNativeWebView?.postMessage(JSON.stringify({ 
                type: 'clothingLoaded',
                productId: product.id
              }));
            },
            undefined,
            function(error) {
              console.error('Error loading external clothing model:', error);
              window.ReactNativeWebView?.postMessage(JSON.stringify({ 
                type: 'clothingLoadError',
                productId: product.id,
                message: 'Failed to load ' + product.name + ': ' + error.message
              }));
            }
          );
        }
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
        
        function onWindowResize() {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        // Animation loop
        function animate() {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        
        animate();
        
        // Message handler for communication with React Native
        window.addEventListener('message', function(event) {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'updateClothing') {
              console.log('Received clothing update:', message);
              
              // Update existing clothing visibility
              if (avatarModel) {
                // Reset all embedded clothing visibility first
                avatarModel.traverse((child) => {
                  if (child.isMesh) {
                    if (child.name.includes('Outfit_Top') || child.name.includes('Outfit_Bottom')) {
                      child.visible = false;
                    }
                  }
                });
                
                // Show selected embedded clothing
                if (message.shirt && message.shirt.type === 'embedded') {
                  avatarModel.traverse((child) => {
                    if (child.isMesh && child.name.includes(message.shirt.objectName)) {
                      child.visible = true;
                      if (child.material && message.shirt.color) {
                        child.material.color.set(message.shirt.color);
                      }
                    }
                  });
                }
                
                if (message.pants && message.pants.type === 'embedded') {
                  avatarModel.traverse((child) => {
                    if (child.isMesh && child.name.includes(message.pants.objectName)) {
                      child.visible = true;
                      if (child.material && message.pants.color) {
                        child.material.color.set(message.pants.color);
                      }
                    }
                  });
                }
              }
              
              // Load external product if provided
              if (message.product && message.product.modelURL) {
                loadExternalClothing(message.product);
              }
            }
          } catch (e) {
            console.error('Error parsing message:', e);
          }
        });
        
        // Notify React Native that the WebView is ready
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'webviewReady' }));
      </script>
    </body>
    </html>
  `;
};

const TryOnAvatar = ({ navigation }) => {
  // Get the params passed from ProductDetails page
  const params = useLocalSearchParams();
  const { productId, productName, productImage } = params;
  
  // State variables
  const [selectedShirt, setSelectedShirt] = useState(clothingStore.shirts[0].id);
  const [selectedPants, setSelectedPants] = useState(clothingStore.pants[0].id);
  const [selectedSize, setSelectedSize] = useState('clothS'); // Default to small size
  const [isLoading, setIsLoading] = useState(true);
  const [avatarModelUrl, setAvatarModelUrl] = useState('');
  const [error, setError] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [availableSizes, setAvailableSizes] = useState(['clothS', 'clothM', 'clothL', 'clothXL']);
  const webViewRef = useRef(null);
  
  // Fetch product details if productId is provided
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (productId) {
        try {
          const productDocRef = doc(db, 'clothes', productId);
          const productDoc = await getDoc(productDocRef);
          
          if (productDoc.exists()) {
            const data = productDoc.data();
            setProductDetails(data);
            console.log("Product details loaded:", data);
            
            // Check which sizes are available
            const sizes = [];
            if (data.clothS) sizes.push('clothS');
            if (data.clothM) sizes.push('clothM');
            if (data.clothL) sizes.push('clothL');
            if (data.clothXL) sizes.push('clothXL');
            
            setAvailableSizes(sizes);
            
            // Set default size (clothS if available, otherwise first available size)
            if (sizes.includes('clothS')) {
              setSelectedSize('clothS');
            } else if (sizes.length > 0) {
              setSelectedSize(sizes[0]);
            }
          }
        } catch (err) {
          console.error('Error fetching product details:', err);
        }
      }
    };
    
    fetchProductDetails();
  }, [productId]);
  
  // Get the user's avatar model URL directly from Firestore
  useEffect(() => {
    const fetchAvatarModel = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
          throw new Error('You must be logged in to view your avatar');
        }
        
        // Fetch avatar model URL directly from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().modelURL) {
          setAvatarModelUrl(userDoc.data().modelURL);
          console.log("Avatar URL loaded from Firestore:", userDoc.data().modelURL);
        } else {
          throw new Error('No avatar found. Please create one first.');
        }
      } catch (err) {
        console.error('Error fetching avatar model:', err);
        setError(err.message);
        Alert.alert(
          'Error Loading Avatar',
          err.message,
          [
            { 
              text: 'Create Avatar', 
              onPress: () => navigation.navigate('AvatarScreen') 
            },
            { 
              text: 'OK', 
              style: 'cancel' 
            }
          ]
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvatarModel();
  }, []);
  
  // Prepare clothing data for WebView
  const prepareSelectedClothing = () => {
    const selectedClothing = {
      shirt: clothingStore.shirts.find(item => item.id === selectedShirt),
      pants: clothingStore.pants.find(item => item.id === selectedPants),
    };
    
    // Add product details if available
    if (productDetails && selectedSize && productDetails[selectedSize]) {
      selectedClothing.product = {
        ...productDetails,
        modelURL: productDetails[selectedSize],
        name: productName || 'Product',
        id: productId,
        size: selectedSize
      };
    }
    
    return selectedClothing;
  };
  
  // Generate HTML content based on selected items and avatar URL
  const htmlContent = avatarModelUrl ? generateHtmlContent(avatarModelUrl, prepareSelectedClothing()) : '';
  
  // Handle messages from WebView
  const onWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'webviewReady':
          console.log('WebView is ready');
          break;
          
        case 'avatarLoaded':
          console.log('Avatar loaded successfully');
          setIsLoading(false);
          break;
          
        case 'avatarLoadError':
          console.error('Error loading avatar:', message.message);
          setError('Failed to load your avatar model. Please try again or create a new one.');
          setIsLoading(false);
          break;
          
        case 'clothingLoaded':
          console.log('Clothing loaded successfully:', message.productId);
          break;
          
        case 'clothingLoadError':
          console.error('Error loading clothing:', message.message);
          Alert.alert('Error', `Failed to load clothing: ${message.message}`);
          break;
          
        default:
          console.log('Received WebView message:', message);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Update WebView when selections change
  useEffect(() => {
    if (webViewRef.current && avatarModelUrl) {
      const selectedClothing = prepareSelectedClothing();
      const message = {
        type: 'updateClothing',
        ...selectedClothing
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [selectedShirt, selectedPants, selectedSize, productDetails, avatarModelUrl]);

  // If still loading initial data
  if (isLoading && !avatarModelUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your avatar data...</Text>
      </View>
    );
  }
  
  // If there's an error and no avatar URL
  if (error && !avatarModelUrl) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('AvatarScreen')}
        >
          <Text style={styles.buttonText}>Create Avatar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Product Info Banner */}
      {productName && (
        <View style={styles.productInfoBanner}>
          <Text style={styles.tryingOnText}>
            Trying on: <Text style={styles.productNameHighlight}>{productName}</Text>
          </Text>
        </View>
      )}
      
      <View style={styles.canvasContainer}>
        {avatarModelUrl ? (
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            onMessage={onWebViewMessage}
            onError={(error) => {
              console.error('WebView error:', error);
              setError('Failed to load viewer. Please try again later.');
            }}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>No avatar model available</Text>
          </View>
        )}
        
        {isLoading && avatarModelUrl && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading 3D Model...</Text>
          </View>
        )}
      </View>
      
      {/* Size selector if product is available */}
      {productDetails && availableSizes.length > 0 && (
        <View style={styles.sizeSelector}>
          <Text style={styles.sectionTitle}>Size:</Text>
          <View style={styles.sizeOptions}>
            {availableSizes.map(size => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeButton,
                  selectedSize === size && styles.selectedSizeButton
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={[
                  styles.sizeButtonText,
                  selectedSize === size && styles.selectedSizeButtonText
                ]}>
                  {size.replace('cloth', '')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  productInfoBanner: {
    backgroundColor: '#4361EE',
    padding: 10,
    alignItems: 'center',
  },
  tryingOnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  productNameHighlight: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e53e3e',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#4a5568',
  },
  createButton: {
    backgroundColor: '#4361EE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  canvasContainer: {
    flex: 2,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  sizeSelector: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  sizeOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  sizeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  selectedSizeButton: {
    borderColor: '#4361EE',
    backgroundColor: '#4361EE',
  },
  sizeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedSizeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controlsPanel: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  productPreviewContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  productPreviewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  selectorContainer: {
    marginBottom: 15,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  clothingItem: {
    width: 80,
    height: 80,
    margin: 5,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: '#000',
  },
  itemThumbnail: {
    width: 50,
    height: 50,
  },
  itemName: {
    marginTop: 5,
    fontSize: 12,
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    textAlign: 'center',
  },
  externalBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TryOnAvatar;