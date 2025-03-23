import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Modal,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../configs/firebase';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

export default function Checkout() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  let items = [];
  try {
    items = JSON.parse(params.items || '[]');
  } catch (error) {
    console.error('Error parsing items:', error);
  }
  
  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  
  const validateCardDetails = () => {
    if (!cardNumber || cardNumber.length < 16) {
      Alert.alert('Invalid Card', 'Please enter a valid card number');
      return false;
    }
    
    if (!expiryDate || !expiryDate.includes('/')) {
      Alert.alert('Invalid Expiry Date', 'Please enter a valid expiry date (MM/YY)');
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV');
      return false;
    }
    
    if (!nameOnCard) {
      Alert.alert('Missing Information', 'Please enter the name on card');
      return false;
    }
    
    return true;
  };
  
  const formatCardNumber = (text) => {
    // Remove any non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Limit to 16 digits
    const limited = cleaned.slice(0, 16);
    // Format with spaces every 4 digits
    let formatted = '';
    for (let i = 0; i < limited.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += limited[i];
    }
    return formatted;
  };
  
  const formatExpiryDate = (text) => {
    // Remove any non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Limit to 4 digits
    const limited = cleaned.slice(0, 4);
    // Format as MM/YY
    if (limited.length > 2) {
      return limited.slice(0, 2) + '/' + limited.slice(2);
    }
    return limited;
  };
  
  const handleCardNumberChange = (text) => {
    setCardNumber(formatCardNumber(text));
  };
  
  const handleExpiryDateChange = (text) => {
    setExpiryDate(formatExpiryDate(text));
  };
  
  const handleCvvChange = (text) => {
    // Only allow digits and limit to 4 (for Amex)
    const cleaned = text.replace(/\D/g, '');
    setCvv(cleaned.slice(0, 4));
  };
  
  const processPayment = () => {
    if (!validateCardDetails()) return;
    
    setProcessingPayment(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setProcessingPayment(false);
      setShowPaymentModal(false);
      // After successful payment, place the order
      placeOrder();
    }, 2000);
  };
  
  const placeOrder = async () => {
    if (!auth.currentUser) {
      Alert.alert('Authentication Error', 'Please sign in to complete your order');
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
          address,
          city,
          state,
          zipCode,
          phone
        },
        paymentMethod,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Add order to user's orders collection
      await setDoc(doc(db, 'users', userId), {
        orders: arrayUnion(orderRef.id)
      }, { merge: true });
      
      // Clear cart only if these were cart items
      if (params.clearCart) {
        await setDoc(doc(db, 'cart', userId), {
          items: []
        });
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
    if (!address || !city || !state || !zipCode || !phone) {
      Alert.alert('Missing Information', 'Please fill in all address fields');
      return;
    }
    
    if (paymentMethod === 'COD') {
      placeOrder();
    } else {
      setShowPaymentModal(true);
    }
  };
  
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
        <View style={styles.formContainer}>
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
      
      {/* Payment Gateway Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Details</Text>
              <TouchableOpacity 
                onPress={() => setShowPaymentModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <View style={styles.paymentLogos}>
                <Image 
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/1920px-Mastercard_2019_logo.svg.png' }} 
                  style={styles.paymentLogo} 
                  resizeMode="contain"
                />
                <Image 
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1920px-Visa_Inc._logo.svg.png' }} 
                  style={styles.paymentLogo} 
                  resizeMode="contain"
                />
                <Image 
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1920px-American_Express_logo_%282018%29.svg.png' }} 
                  style={styles.paymentLogo} 
                  resizeMode="contain"
                />
              </View>
              
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="numeric"
                maxLength={19} // 16 digits + 3 spaces
              />
              
              <Text style={styles.inputLabel}>Name on Card</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="John Doe"
                value={nameOnCard}
                onChangeText={setNameOnCard}
              />
              
              <View style={styles.row}>
                <View style={styles.halfColumn}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.cardInput}
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChangeText={handleExpiryDateChange}
                    keyboardType="numeric"
                    maxLength={5} // MM/YY
                  />
                </View>
                
                <View style={styles.halfColumn}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.cardInput}
                    placeholder="123"
                    value={cvv}
                    onChangeText={handleCvvChange}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
              
              <View style={styles.secureNote}>
                <MaterialIcons name="lock" size={16} color="#666" />
                <Text style={styles.secureText}>
                  Your payment information is secure and encrypted
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.payButton}
                onPress={processPayment}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.payButtonText}>
                    Pay Rs {totalAmount.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 20,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  paymentLogos: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  paymentLogo: {
    width: 60,
    height: 40,
    marginHorizontal: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  cardInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  halfColumn: {
    width: '48%',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  secureText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  payButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  payButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});