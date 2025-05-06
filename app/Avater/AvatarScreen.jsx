import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  Alert,
  Image
} from 'react-native';
import WebView from 'react-native-webview';

export default function AvatarScreen({ navigation }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarId, setAvatarId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('body');
  const webViewRef = useRef(null);
  
  // Customization categories and options
  const [customizationOptions, setCustomizationOptions] = useState({
    body: [
      { id: 'body_default', name: 'Default', imageUrl: '/api/placeholder/60/60' },
      { id: 'body_athletic', name: 'Athletic', imageUrl: '/api/placeholder/60/60' },
      { id: 'body_slim', name: 'Slim', imageUrl: '/api/placeholder/60/60' }
    ],
    face: [
      { id: 'face_default', name: 'Default', imageUrl: '/api/placeholder/60/60' },
      { id: 'face_round', name: 'Round', imageUrl: '/api/placeholder/60/60' },
      { id: 'face_square', name: 'Square', imageUrl: '/api/placeholder/60/60' }
    ],
    hair: [
      { id: 'hair_default', name: 'Default', imageUrl: '/api/placeholder/60/60' },
      { id: 'hair_short', name: 'Short', imageUrl: '/api/placeholder/60/60' },
      { id: 'hair_long', name: 'Long', imageUrl: '/api/placeholder/60/60' },
      { id: 'hair_none', name: 'None', imageUrl: '/api/placeholder/60/60' }
    ],
    tops: [
      { id: 'top_tshirt', name: 'T-Shirt', imageUrl: '/api/placeholder/60/60' },
      { id: 'top_shirt', name: 'Shirt', imageUrl: '/api/placeholder/60/60' },
      { id: 'top_sweater', name: 'Sweater', imageUrl: '/api/placeholder/60/60' },
      { id: 'top_none', name: 'No Top', imageUrl: '/api/placeholder/60/60' }
    ],
    bottoms: [
      { id: 'bottom_jeans', name: 'Jeans', imageUrl: '/api/placeholder/60/60' },
      { id: 'bottom_shorts', name: 'Shorts', imageUrl: '/api/placeholder/60/60' },
      { id: 'bottom_skirt', name: 'Skirt', imageUrl: '/api/placeholder/60/60' },
      { id: 'bottom_none', name: 'No Bottom', imageUrl: '/api/placeholder/60/60' }
    ],
    shoes: [
      { id: 'shoes_sneakers', name: 'Sneakers', imageUrl: '/api/placeholder/60/60' },
      { id: 'shoes_boots', name: 'Boots', imageUrl: '/api/placeholder/60/60' },
      { id: 'shoes_formal', name: 'Formal', imageUrl: '/api/placeholder/60/60' },
      { id: 'shoes_none', name: 'No Shoes', imageUrl: '/api/placeholder/60/60' }
    ],
    accessories: [
      { id: 'acc_glasses', name: 'Glasses', imageUrl: '/api/placeholder/60/60' },
      { id: 'acc_hat', name: 'Hat', imageUrl: '/api/placeholder/60/60' },
      { id: 'acc_jewelry', name: 'Jewelry', imageUrl: '/api/placeholder/60/60' },
      { id: 'acc_none', name: 'None', imageUrl: '/api/placeholder/60/60' }
    ]
  });
  
  // Track selected options
  const [selectedOptions, setSelectedOptions] = useState({
    body: 'body_default',
    face: 'face_default',
    hair: 'hair_default',
    tops: 'top_tshirt',
    bottoms: 'bottom_jeans',
    shoes: 'shoes_sneakers',
    accessories: 'acc_none'
  });
  
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
  
  // Handle messages from the WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (!data || !data.event) return;
      
      console.log('Received WebView event:', data.event);
      
      switch (data.event) {
        case 'loaded':
          setIsLoading(false);
          console.log('Ready Player Me loaded');
          break;
          
        case 'avatarExported':
          // Avatar creation completed
          const avatarUrl = data.data.url;
          const avatarId = data.data.id;
          
          setAvatarUrl(avatarUrl);
          setAvatarId(avatarId);
          break;
          
        case 'error':
          setIsLoading(false);
          console.error('Avatar creation error', data);
          Alert.alert('Error', 'Failed to create avatar. Please try again.');
          break;
          
        default:
          console.log('Unhandled event:', data);
          break;
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };
  
  // Apply a customization option
  const applyCustomization = (category, optionId) => {
    setSelectedOptions({
      ...selectedOptions,
      [category]: optionId
    });
    
    // Map our custom option IDs to Ready Player Me asset IDs
    // In a production app, you'd have a more comprehensive mapping
    const rpmAssetMap = {
      // Body types
      body_default: { type: 'BodyType', value: 'default' },
      body_athletic: { type: 'BodyType', value: 'athletic' },
      body_slim: { type: 'BodyType', value: 'slim' },
      
      // Face
      face_default: { type: 'FaceShape', value: 'default' },
      face_round: { type: 'FaceShape', value: 'round' },
      face_square: { type: 'FaceShape', value: 'square' },
      
      // Hair
      hair_default: { type: 'Hairstyle', value: 'default' },
      hair_short: { type: 'Hairstyle', value: 'short1' },
      hair_long: { type: 'Hairstyle', value: 'long1' },
      hair_none: { type: 'Hairstyle', value: 'none' },
      
      // Clothing and accessories - these would need actual asset IDs from RPM
      top_tshirt: { type: 'Outfit', assetId: 'tshirt1' },
      top_shirt: { type: 'Outfit', assetId: 'shirt1' },
      top_sweater: { type: 'Outfit', assetId: 'sweater1' },
      top_none: { type: 'RemoveOutfit', target: 'top' },
      
      bottom_jeans: { type: 'Outfit', assetId: 'jeans1' },
      bottom_shorts: { type: 'Outfit', assetId: 'shorts1' },
      bottom_skirt: { type: 'Outfit', assetId: 'skirt1' },
      bottom_none: { type: 'RemoveOutfit', target: 'bottom' },
      
      shoes_sneakers: { type: 'Outfit', assetId: 'sneakers1' },
      shoes_boots: { type: 'Outfit', assetId: 'boots1' },
      shoes_formal: { type: 'Outfit', assetId: 'formal_shoes1' },
      shoes_none: { type: 'RemoveOutfit', target: 'shoes' },
      
      acc_glasses: { type: 'Accessory', assetId: 'glasses1' },
      acc_hat: { type: 'Accessory', assetId: 'hat1' },
      acc_jewelry: { type: 'Accessory', assetId: 'jewelry1' },
      acc_none: { type: 'RemoveAccessory', target: 'all' }
    };
    
    const assetInfo = rpmAssetMap[optionId];
    if (!assetInfo) return;
    
    // Prepare message based on type of customization
    let message;
    if (assetInfo.type === 'Outfit' || assetInfo.type === 'Accessory') {
      message = {
        target: 'readyplayerme',
        type: 'outfit',
        data: {
          outfitId: assetInfo.assetId
        }
      };
    } else if (assetInfo.type === 'RemoveOutfit' || assetInfo.type === 'RemoveAccessory') {
      message = {
        target: 'readyplayerme',
        type: 'removeOutfit',
        data: {
          target: assetInfo.target
        }
      };
    } else {
      // For body, face, hair, etc.
      message = {
        target: 'readyplayerme',
        type: 'setFeature',
        data: {
          feature: assetInfo.type,
          value: assetInfo.value
        }
      };
    }
    
    // Send message to WebView
    const script = `
      try {
        const avatar = document.getElementById('avatar');
        if (avatar && avatar.contentWindow) {
          avatar.contentWindow.postMessage(${JSON.stringify(message)}, '*');
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'customizationApplied',
            data: { category: '${category}', option: '${optionId}' }
          }));
        }
      } catch(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          event: 'error',
          data: { message: 'Failed to apply customization', error: e.toString() }
        }));
      }
      true;
    `;
    
    webViewRef.current?.injectJavaScript(script);
  };
  
  // Apply nude or clothing-free setting
  const applyNudeAvatar = () => {
    setSelectedOptions({
      ...selectedOptions,
      tops: 'top_none',
      bottoms: 'bottom_none',
      shoes: 'shoes_none'
    });
    
    // This script would remove all clothing
    const script = `
      try {
        const avatar = document.getElementById('avatar');
        if (avatar && avatar.contentWindow) {
          // Remove top
          avatar.contentWindow.postMessage({
            target: 'readyplayerme',
            type: 'removeOutfit',
            data: { target: 'top' }
          }, '*');
          
          // Remove bottom
          avatar.contentWindow.postMessage({
            target: 'readyplayerme',
            type: 'removeOutfit',
            data: { target: 'bottom' }
          }, '*');
          
          // Remove shoes
          avatar.contentWindow.postMessage({
            target: 'readyplayerme',
            type: 'removeOutfit',
            data: { target: 'shoes' }
          }, '*');
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'nudeAvatarApplied',
            data: { status: 'success' }
          }));
        }
      } catch(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          event: 'error',
          data: { message: 'Failed to apply nude avatar', error: e.toString() }
        }));
      }https://models.readyplayer.me/6818b138b283fcb4110c7373.glb
      true;
    `;
    
    webViewRef.current?.injectJavaScript(script);
  };
  
  // Save the avatar
  const saveAvatar = () => {
    if (!avatarId || !avatarUrl) {
      Alert.alert('Error', 'Please create an avatar first');
      return;
    }
    
    setIsLoading(true);
    
    // Simulating an API call - replace with your actual API
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Success',
        'Avatar saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation?.navigate ? navigation.navigate('Home', { avatarUrl }) : null
          }
        ]
      );
    }, 1000);
  };
  
  // Reset the avatar
  const resetAvatar = () => {
    const script = `
      try {
        const avatar = document.getElementById('avatar');
        if (avatar && avatar.contentWindow) {
          avatar.contentWindow.postMessage({
            target: 'readyplayerme',
            type: 'reset'
          }, '*');
        }
      } catch(e) {
        console.error(e);
      }
      true;
    `;
    
    webViewRef.current?.injectJavaScript(script);
    
    // Reset all selections to defaults
    setSelectedOptions({
      body: 'body_default',
      face: 'face_default',
      hair: 'hair_default',
      tops: 'top_tshirt',
      bottoms: 'bottom_jeans',
      shoes: 'shoes_sneakers',
      accessories: 'acc_none'
    });
    
    setAvatarUrl(null);
    setAvatarId(null);
  };
  
  // Render customization options
  const renderCustomizationOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {customizationOptions[activeTab].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                selectedOptions[activeTab] === option.id && styles.selectedOption
              ]}
              onPress={() => applyCustomization(activeTab, option.id)}
            >
              <Image 
                source={{ uri: option.imageUrl }} 
                style={styles.optionImage} 
              />
              <Text style={[
                styles.optionText,
                selectedOptions[activeTab] === option.id && styles.selectedOptionText
              ]}>
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Customize Your Avatar</Text>
      </View>
      
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: RPM_URL }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading avatar editor...</Text>
            </View>
          )}
        />
      </View>
      
      
      <View style={styles.controlsContainer}>
        {/* Tabs for different customization categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'body' && styles.activeTab]} 
            onPress={() => setActiveTab('body')}
          >
            <Text style={[styles.tabText, activeTab === 'body' && styles.activeTabText]}>Body</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'face' && styles.activeTab]} 
            onPress={() => setActiveTab('face')}
          >
            <Text style={[styles.tabText, activeTab === 'face' && styles.activeTabText]}>Face</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'hair' && styles.activeTab]} 
            onPress={() => setActiveTab('hair')}
          >
            <Text style={[styles.tabText, activeTab === 'hair' && styles.activeTabText]}>Hair</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'tops' && styles.activeTab]} 
            onPress={() => setActiveTab('tops')}
          >
            <Text style={[styles.tabText, activeTab === 'tops' && styles.activeTabText]}>Tops</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bottoms' && styles.activeTab]} 
            onPress={() => setActiveTab('bottoms')}
          >
            <Text style={[styles.tabText, activeTab === 'bottoms' && styles.activeTabText]}>Bottoms</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'shoes' && styles.activeTab]} 
            onPress={() => setActiveTab('shoes')}
          >
            <Text style={[styles.tabText, activeTab === 'shoes' && styles.activeTabText]}>Shoes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'accessories' && styles.activeTab]} 
            onPress={() => setActiveTab('accessories')}
          >
            <Text style={[styles.tabText, activeTab === 'accessories' && styles.activeTabText]}>Accessories</Text>
          </TouchableOpacity>
        </ScrollView>
        
        {/* Options for the selected category */}
        {renderCustomizationOptions()}
        
        {/* Quick options */}
        <View style={styles.quickOptionsContainer}>
          <TouchableOpacity 
            style={styles.quickOption}
            onPress={applyNudeAvatar}
          >
            <Text style={styles.quickOptionText}>No Clothing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickOption}
            onPress={resetAvatar}
          >
            <Text style={styles.quickOptionText}>Reset All</Text>
          </TouchableOpacity>
        </View>
        
        {/* Save button */}
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveAvatar}
          disabled={!avatarId}
        >
          <Text style={styles.saveButtonText}>Save Avatar</Text>
        </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#4361EE',
  },
  tabText: {
    color: '#333',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
  optionsContainer: {
    marginBottom: 15,
  },
  optionItem: {
    alignItems: 'center',
    marginRight: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    width: 80,
  },
  selectedOption: {
    backgroundColor: '#4361EE',
  },
  optionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ddd',
    marginBottom: 5,
  },
  optionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  selectedOptionText: {
    color: 'white',
  },
  quickOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  quickOption: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    margin: 5,
  },
  quickOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CC9F0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});