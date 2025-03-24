import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, setDoc, arrayUnion, arrayRemove, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../configs/firebase';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

export default function CheckoutWrapper() {
  return (
    <StripeProvider
      publishableKey="pk_test_51R64TNP6W0yfsGrVwwpRz0orP5XgMIjYI6EeFWGAYlPBqaVOhfNzwLB1Bor9rKu3nZmT2pbnbWmOobuKZwwc2MOy00kyguhOTp"
      merchantIdentifier="merchant.identifier" // required for Apple Pay
      urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
    >
      <Checkout />
    </StripeProvider>
  );
}

function Checkout() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [errorMessage, setErrorMessage] = useState('');
  
  let items = [];
  try {
    items = JSON.parse(params.items || '[]');
  } catch (error) {
    console.error('Error parsing items:', error);
  }
  
  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  
  const handlePayment = async () => {
    if (!name || !address || !city || !state || !zipCode || !phone) {
      setErrorMessage("Please fill in all delivery details before proceeding.");
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch(
        "https://payment-gateway-backend-yp54.onrender.com/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: totalAmount }),
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }
      
      const { clientSecret } = await response.json();
      
      // 2️⃣ Initialize Stripe Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Your Shop Name",
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: name,
          address: {
            city: city,
            country: 'US',
            line1: address,
            postalCode: zipCode,
            state: state,
          }
        }
      });
      
      if (initError) {
        console.error("Error initializing payment sheet:", initError);
        setErrorMessage(initError.message);
        setLoading(false);
        return;
      }
      
      const { error: paymentError } = await presentPaymentSheet();
      
      if (paymentError) {
        console.error("Error during payment:", paymentError);
        if (paymentError.code !== 'Canceled') {
          setErrorMessage(paymentError.message);
        }
      } else {
        placeOrder('CARD', 'paid');
      }
    } catch (error) {
      console.error("Error during payment process:", error);
      setErrorMessage(error.message || "Something went wrong with the payment.");
    } finally {
      setLoading(false);
    }
  };
  
  const placeOrder = async (method = paymentMethod, paymentStatus = 'pending') => {
    if (!auth.currentUser) {
      Alert.alert('Authentication Error', 'Please sign in to complete your order');
      return;
    }
    
    if (!name || !address || !city || !state || !zipCode || !phone) {
      setErrorMessage('Please fill in all address fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const userId = auth.currentUser.uid;
      const orderItems = items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.Image
      }));
      
      // Create order document
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId,
        items: orderItems,
        totalAmount,
        shippingAddress: {
          name,
          address,
          city,
          state,
          zipCode,
          phone
        },
        paymentMethod: method,
        paymentStatus: method === 'CARD' ? paymentStatus : 'pending',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'users', userId), {
        orders: arrayUnion(orderRef.id)
      }, { merge: true });
      
      // Handle cart clearing based on the clearCart parameter
      if (params.clearCart) {
        const userCartRef = doc(db, 'cart', userId);
        
        if (params.clearCart === "all") {
          // Clear the entire cart
          await setDoc(userCartRef, { items: [] });
        } else if (params.clearCart === "single" && params.itemIds) {
          // Remove only the purchased items
          try {
            const itemIds = JSON.parse(params.itemIds);
            // For each item ID, remove it from the cart
            for (const itemId of itemIds) {
              await updateDoc(userCartRef, {
                items: arrayRemove(itemId)
              });
            }
          } catch (parseError) {
            console.error('Error parsing item IDs:', parseError);
          }
        }
      }
      
      Alert.alert(
        'Order Placed!',
        'Your order has been successfully placed.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/profile')
          }
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Something went wrong while placing your order');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckout = () => {
    if (paymentMethod === 'COD') {
      placeOrder();
    } else {
      handlePayment();
    }
  };
  
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('https://payment-gateway-backend-yp54.onrender.com/fk');
        console.log('Backend connection:', await response.json());
      } catch (error) {
        console.error('Backend connection error:', error);
      }
    };
    
    testConnection();
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Checkout</Text>
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryContainer}>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name || 'Unnamed Item'}
              </Text>
              <Text style={styles.itemPrice}>Rs {parseFloat(item.price).toFixed(2)}</Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rs {totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>Rs 0.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Rs {totalAmount.toFixed(2)}</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            value={city}
            onChangeText={setCity}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State"
              value={state}
              onChangeText={setState}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Zip Code"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>
        
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentContainer}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'COD' && styles.selectedPayment
            ]}
            onPress={() => setPaymentMethod('COD')}
          >
            <View style={styles.paymentRow}>
              <MaterialIcons name="monetization-on" size={24} color="#333" />
              <Text style={styles.paymentText}>Cash On Delivery</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'CARD' && styles.selectedPayment
            ]}
            onPress={() => setPaymentMethod('CARD')}
          >
            <View style={styles.paymentRow}>
              <FontAwesome name="credit-card" size={24} color="#333" />
              <Text style={styles.paymentText}>Credit/Debit Card</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.paymentInfoContainer}>
          {paymentMethod === 'CARD' && (
            <Text style={styles.paymentInfoText}>
              You'll be redirected to Stripe's secure payment screen to complete your purchase.
            </Text>
          )}
        </View>
        
        <View style={styles.spacer} />
      </ScrollView>
      
      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={handleCheckout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.checkoutButtonText}>
            {paymentMethod === 'COD' ? 'Place Order' : 'Proceed to Payment'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  errorContainer: {
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  paymentContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedPayment: {
    borderColor: '#007bff',
    backgroundColor: '#f0f7ff',
  },
  paymentText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  paymentInfoContainer: {
    padding: 8,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  spacer: {
    height: 20,
  },
  checkoutButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});