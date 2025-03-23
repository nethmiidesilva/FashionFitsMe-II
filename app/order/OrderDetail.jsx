import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../configs/firebase';

export default function OrderDetail() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      if (!orderId) {
        Alert.alert('Error', 'Order ID not provided');
        router.back();
        return;
      }

      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        Alert.alert('Error', 'Order not found');
        router.back();
        return;
      }

      const orderData = orderSnap.data();
      setOrder({
        id: orderSnap.id,
        ...orderData,
        createdAt: orderData.createdAt?.toDate() || new Date()
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusBadge = (status) => {
    let badgeStyle = styles.statusBadge;
    let textStyle = styles.statusText;

    switch (status?.toLowerCase()) {
      case 'completed':
        badgeStyle = {...badgeStyle, backgroundColor: '#28a745'};
        break;
      case 'processing':
        badgeStyle = {...badgeStyle, backgroundColor: '#ffc107'};
        textStyle = {...textStyle, color: '#212529'};
        break;
      case 'shipped':
        badgeStyle = {...badgeStyle, backgroundColor: '#17a2b8'};
        break;
      case 'cancelled':
        badgeStyle = {...badgeStyle, backgroundColor: '#dc3545'};
        break;
      default:
        badgeStyle = {...badgeStyle, backgroundColor: '#6c757d'};
    }

    return (
      <View style={badgeStyle}>
        <Text style={textStyle}>{status || 'Processing'}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Order Details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.orderSummaryCard}>
        <View style={styles.orderHeaderRow}>
          <Text style={styles.orderNumber}>Order #{order?.id.slice(0, 8)}</Text>
          {renderStatusBadge(order?.status)}
        </View>
        
        <View style={styles.orderInfoRow}>
          <Text style={styles.orderInfoLabel}>Order Date:</Text>
          <Text style={styles.orderInfoValue}>{formatDate(order?.createdAt)}</Text>
        </View>
        
        <View style={styles.orderInfoRow}>
          <Text style={styles.orderInfoLabel}>Total Amount:</Text>
          <Text style={styles.orderInfoValue}>Rs {order?.totalAmount?.toFixed(2) || 'N/A'}</Text>
        </View>
        
        {order?.paymentMethod && (
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Payment Method:</Text>
            <Text style={styles.orderInfoValue}>{order.paymentMethod}</Text>
          </View>
        )}
      </View>

      {order?.shippingAddress && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.addressContent}>
            <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
            <Text style={styles.addressLine}>{order.shippingAddress.street}</Text>
            <Text style={styles.addressLine}>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
            </Text>
            <Text style={styles.addressLine}>{order.shippingAddress.country}</Text>
            {order.shippingAddress.phone && (
              <Text style={styles.addressPhone}>Phone: {order.shippingAddress.phone}</Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order?.items && order.items.length > 0 ? (
          order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Image 
                source={{ uri: item.image || 'https://via.placeholder.com/100' }} 
                style={styles.itemImage} 
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemVariant}>
                  {item.variant && `Variant: ${item.variant}`}
                </Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>Rs {item.price?.toFixed(2) || 'N/A'}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity || 1}</Text>
                </View>
                <Text style={styles.itemTotal}>
                  Total: Rs {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No items found in this order.</Text>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Price Details</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal</Text>
          <Text style={styles.priceValue}>Rs {order?.subtotal?.toFixed(2) || order?.totalAmount?.toFixed(2) || 'N/A'}</Text>
        </View>
        
        {order?.discount > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Discount</Text>
            <Text style={[styles.priceValue, styles.discountText]}>- Rs {order.discount.toFixed(2)}</Text>
          </View>
        )}
        
        {order?.shippingFee !== undefined && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping Fee</Text>
            <Text style={styles.priceValue}>Rs {order.shippingFee.toFixed(2)}</Text>
          </View>
        )}
        
        {order?.tax !== undefined && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax</Text>
            <Text style={styles.priceValue}>Rs {order.tax.toFixed(2)}</Text>
          </View>
        )}
        
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Rs {order?.totalAmount?.toFixed(2) || 'N/A'}</Text>
        </View>
      </View>

      {order?.trackingNumber && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          <View style={styles.trackingInfo}>
            <Text style={styles.trackingLabel}>Tracking Number:</Text>
            <Text style={styles.trackingValue}>{order.trackingNumber}</Text>
          </View>
          {order?.shippingProvider && (
            <View style={styles.trackingInfo}>
              <Text style={styles.trackingLabel}>Shipping Provider:</Text>
              <Text style={styles.trackingValue}>{order.shippingProvider}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.trackButton}>
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.supportButton}>
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  placeholder: {
    width: 50,
  },
  orderSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#28a745',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  addressContent: {
    marginTop: 8,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  orderItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
  },
  discountText: {
    color: '#28a745',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  trackingInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  trackingLabel: {
    fontSize: 14,
    color: '#666',
    width: 130,
  },
  trackingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  trackButton: {
    backgroundColor: '#17a2b8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    margin: 16,
    marginTop: 8,
  },
  supportButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 30,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});