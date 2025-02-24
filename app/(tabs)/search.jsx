import React from 'react';
import { StyleSheet, View, Text, Image, TextInput, FlatList, ActivityIndicator } from 'react-native';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, useSearchBox, useInfiniteHits } from 'react-instantsearch-hooks-web';

// Initialize the Algolia client
const searchClient = algoliasearch(
  'VIX0G4CQXG',
  'e28a685420a7303098b8683c143e094d'
);

// Custom SearchBox component
function CustomSearchBox() {
  const { query, refine } = useSearchBox();
  
  return (
    <TextInput
      style={styles.searchInput}
      placeholder="Search clothes..."
      value={query}
      onChangeText={refine}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

// Custom Hits component
function CustomHits() {
  const { hits, isLastPage, showMore, isLoading } = useInfiniteHits();

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={[styles.image, styles.placeholderImage]}>
        {item.image && (
          <Image 
            source={{ uri: item.image }} 
            style={styles.image}
          />
        )}
      </View>
      <Text style={styles.itemText}>{item.name || 'Unnamed item'}</Text>
    </View>
  );

  return (
    <FlatList
      data={hits}
      renderItem={renderItem}
      keyExtractor={item => item.objectID}
      onEndReached={() => !isLastPage && showMore()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={() => (
        isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : null
      )}
      ListEmptyComponent={() => (
        <Text style={styles.noResults}>No results found</Text>
      )}
    />
  );
}

const SearchScreen = () => {
  return (
    <View style={styles.container}>
      <InstantSearch
        searchClient={searchClient}
        indexName="clothes"
      >
        <View style={styles.searchBoxContainer}>
          <CustomSearchBox />
        </View>
        <CustomHits />
      </InstantSearch>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  searchBoxContainer: {
    padding: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff'
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 4
  },
  placeholderImage: {
    backgroundColor: '#ddd'
  },
  itemText: {
    fontSize: 16,
    flex: 1
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center'
  },
  noResults: {
    textAlign: 'center',
    padding: 20,
    color: '#666'
  }
});

export default SearchScreen;