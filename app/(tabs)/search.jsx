import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, TextInput, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Animated, Dimensions, Keyboard } from 'react-native';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, useSearchBox, useInfiniteHits, Configure } from 'react-instantsearch-hooks-web';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // For navigation

// Get screen dimensions for responsive grid layout
const { width } = Dimensions.get('window');
const itemWidth = (width - 40) / 2; // For 2-column layout with margins

// Initialize the Algolia client with your credentials
const searchClient = algoliasearch(
  'VIX0G4CQXG',
  'e28a685420a7303098b8683c143e094d'
);

// Recent searches storage
class RecentSearchesManager {
  constructor(limit = 5) {
    this.limit = limit;
    this.searches = ["dress", "jacket", "summer collection", "jeans"];
    this.loadFromStorage();
  }

  loadFromStorage() {
    // In a real app, you would load this from AsyncStorage
  }

  saveToStorage() {
    // In a real app, you would save this to AsyncStorage
  }

  getSearches() {
    return this.searches;
  }

  addSearch(query) {
    if (!query || query.trim() === '') return;
    
    // Remove if already exists
    this.searches = this.searches.filter(item => item !== query);
    
    // Add to beginning
    this.searches.unshift(query);
    
    // Limit the number of items
    if (this.searches.length > this.limit) {
      this.searches = this.searches.slice(0, this.limit);
    }
    
    this.saveToStorage();
  }

  removeSearch(query) {
    this.searches = this.searches.filter(item => item !== query);
    this.saveToStorage();
  }

  clearSearches() {
    this.searches = [];
    this.saveToStorage();
  }
}

const recentSearchesManager = new RecentSearchesManager(5);

// Custom Search Box Component
const CustomSearchBox = ({ showPanel, hidePanel, handleSearch, hasSearched }) => {
  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query);

  // Handle input change and refine search
  const handleInputChange = (text) => {
    setInputValue(text);
    refine(text);
  };

  // Handle search submission
  const onSubmit = () => {
    if (inputValue.trim() !== '') {
      recentSearchesManager.addSearch(inputValue);
      handleSearch(inputValue);
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.searchBarContainer}>
      <TouchableOpacity 
        style={styles.searchInputContainer}
        activeOpacity={0.8}
        onPress={showPanel}
      >
        <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clothes..."
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={showPanel}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
        />
        {inputValue.length > 0 && (
          <TouchableOpacity onPress={() => {
            setInputValue('');
            refine('');
          }}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {showPanel && (
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={hidePanel}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Main SearchScreen component
const SearchScreen = () => {
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  
  // Animation value for the search panel
  const searchPanelAnim = useRef(new Animated.Value(0)).current;

  // Function to show search panel with animation
  const showPanel = () => {
    setShowSearchPanel(true);
    Animated.timing(searchPanelAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Function to hide search panel with animation
  const hidePanel = () => {
    Animated.timing(searchPanelAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSearchPanel(false);
    });
  };

  // Handle search submission
  const handleSearch = (query) => {
    if (query.trim() !== '') {
      setSearchQuery(query);
      setHasSearched(true);
      hidePanel();
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  // Navigate to product details
  const navigateToProduct = (productId) => {
    router.push({
      pathname: '/Product/productDetails',
      params: { itemId: productId },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <InstantSearch
        searchClient={searchClient}
        indexName="clothes"
        initialUiState={{
          clothes: {
            query: searchQuery
          }
        }}
      >
        {/* Configure component to ensure filtering works correctly */}
        <Configure 
          hitsPerPage={20}
          query={searchQuery}
          attributesToRetrieve={['name', 'price', 'Image', 'discount', 'clotheId']}
        />

        {/* Custom Search Box */}
        <CustomSearchBox 
          showPanel={showPanel} 
          hidePanel={hidePanel}
          handleSearch={handleSearch}
          hasSearched={hasSearched}
        />

        {/* Search Panel (Overlay) */}
        {showSearchPanel && (
          <Animated.View 
            style={[
              styles.searchPanelOverlay,
              {
                opacity: searchPanelAnim,
                transform: [
                  { 
                    translateY: searchPanelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <SearchPanel 
              onSelectSuggestion={handleSelectSuggestion}
              currentQuery={searchQuery}
            />
          </Animated.View>
        )}

        {/* Search Results */}
        {hasSearched && !showSearchPanel && (
          <SearchResultsGrid 
            query={searchQuery}
            onProductPress={navigateToProduct}
          />
        )}
      </InstantSearch>
    </SafeAreaView>
  );
};

// Search Panel Component
const SearchPanel = ({ onSelectSuggestion, currentQuery }) => {
  const { refine } = useSearchBox();
  const popularSearches = ["trending", "summer", "casual", "shirts", "shoes", "dresses"];
  const recentSearches = recentSearchesManager.getSearches();
  
  // Auto-suggestions based on current query
  const suggestions = currentQuery ? 
    popularSearches.filter(item => 
      item.toLowerCase().includes(currentQuery.toLowerCase())
    ) : [];

  // Render a suggestion item
  const renderSuggestionItem = (item, icon = "search-outline") => (
    <TouchableOpacity 
      style={styles.suggestionItem} 
      onPress={() => {
        refine(item);
        onSelectSuggestion(item);
      }}
    >
      <Ionicons name={icon} size={18} color="#888" style={styles.suggestionIcon} />
      <Text style={styles.suggestionText}>{item}</Text>
      <Ionicons name="arrow-forward-outline" size={16} color="#888" style={styles.arrowIcon} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.searchPanel}>
      {/* Auto-suggestions based on current query */}
      {currentQuery && suggestions.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Suggestions</Text>
          {suggestions.map((item, index) => (
            <View key={`suggestion-${index}`}>
              {renderSuggestionItem(item)}
            </View>
          ))}
        </View>
      )}
      
      {/* Popular searches */}
      {(!currentQuery || suggestions.length === 0) && (
        <View>
          <Text style={styles.sectionTitle}>Popular searches</Text>
          {popularSearches.slice(0, 4).map((item, index) => (
            <View key={`popular-${index}`}>
              {renderSuggestionItem(item, "trending-up-outline")}
            </View>
          ))}
        </View>
      )}

      {/* Recent searches */}
      {recentSearches.length > 0 && (!currentQuery || suggestions.length === 0) && (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={() => recentSearchesManager.clearSearches()}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {recentSearches.map((item, index) => (
            <View key={`recent-${index}`}>
              <TouchableOpacity 
                style={styles.suggestionItem}
                onPress={() => {
                  refine(item);
                  onSelectSuggestion(item);
                }}
              >
                <Ionicons name="time-outline" size={18} color="#888" style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>{item}</Text>
                <View style={styles.recentActionButtons}>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      recentSearchesManager.removeSearch(item);
                    }}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  >
                    <Ionicons name="close" size={16} color="#888" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Grid Search Results Component
const SearchResultsGrid = ({ query, onProductPress }) => {
  const { hits, isLastPage, showMore, isLoading } = useInfiniteHits();

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.productCard, { width: itemWidth }]}
      onPress={() => onProductPress(item.clotheId || item.objectID)}
    >
      <Image
        source={{ uri: item.Image || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
      />
      <Text style={styles.productName}>{item.name || 'Unknown Item'}</Text>
      
      <View style={styles.row}>
        <Text style={[styles.productPrice, { marginRight: 40 }]}>
          ${item.price || '0.00'}
        </Text>
        <Text style={styles.productDiscount}>
          {item.discount ? item.discount : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && hits.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.carouselSection}>
      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>Results for "{query}"</Text>
        <Text style={styles.resultsCount}>{hits.length} items found</Text>
      </View>

      <FlatList
        data={hits}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.objectID || item.clotheId}
        numColumns={2}
        onEndReached={() => !isLastPage && showMore()}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.flatListContent}
        ListFooterComponent={() => (
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0000ff" />
            </View>
          ) : hits.length > 0 ? (
            <Text style={styles.endOfResults}>End of results</Text>
          ) : null
        )}
        ListEmptyComponent={() => (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={40} color="#888" style={styles.noResultsIcon} />
            <Text style={styles.noResults}>No results found for "{query}"</Text>
            <Text style={styles.noResultsSubtext}>Try different keywords or check for spelling errors</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    marginLeft: 10,
    paddingVertical: 8,
  },
  cancelText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  searchPanelOverlay: {
    position: 'absolute',
    top: 58, // Height of search bar + padding
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 5,
  },
  searchPanel: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#333',
    marginTop: 16,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  recentSearchesContainer: {
    marginTop: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    color: '#2196F3',
    fontSize: 14,
  },
  recentActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Grid layout styles
  carouselSection: {
    flex: 1,
    marginTop: 10,
  },
  flatListContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  productCard: {
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    padding: 10,
    alignItems: 'center',
    height: 220,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  productPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: "#fe380e",
  },
  productDiscount: {
    fontSize: 14,
    color: "#53b21c",
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noResultsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  noResultsIcon: {
    marginBottom: 16,
  },
  noResults: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  noResultsSubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
  },
  endOfResults: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
    fontSize: 14,
  },
});

export default SearchScreen;