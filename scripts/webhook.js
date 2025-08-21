// webhooks-controller.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/order');
const Payment = require('../models/payment');
const User = require('../models/user');
const Cart = require('../models/cart');
const admin = require('firebase-admin'); // For sending notifications

// Webhook endpoint for Razorpay
router.post('/razorpay-webhook', async (req, res) => {
  try {
    // 1. Verify webhook signature
    const razorpaySignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Verify the webhook signature
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');
    
    if (digest !== razorpaySignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // 2. Process the webhook event
    const event = req.body;
    console.log(`Webhook received: ${event.event}`);
    
    if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
      const payment = event.payload.payment.entity;
      
      // 3. Extract order details from payment notes
      const { cartId, userId, orderId, shippingAddress, billingAddress } = payment.notes;
      
      if (!cartId || !userId) {
        console.error('Missing required order information in payment notes');
        return res.status(200).json({ status: 'missing information but acknowledged' });
      }
      
      // 4. Check if order already exists (idempotency check)
      const existingOrder = await Order.findOne({ 
        $or: [
          { razorpayPaymentId: payment.id },
          { razorpayOrderId: payment.order_id },
          { orderId: orderId }
        ]
      });
      
      if (existingOrder) {
        console.log(`Order already exists for payment ${payment.id}`);
        return res.status(200).json({ status: 'order exists' });
      }
      
      // 5. Get cart details
      const cart = await Cart.findById(cartId).populate('items.product');
      if (!cart) {
        console.error(`Cart not found: ${cartId}`);
        return res.status(200).json({ status: 'cart not found but acknowledged' });
      }
      
      // 6. Create the order
      const newOrder = new Order({
        orderId: orderId || `ORD${Date.now()}`,
        user: userId,
        items: cart.items,
        totalAmount: payment.amount / 100, // Convert from paise to rupees
        shippingAddress: JSON.parse(shippingAddress || '{}'),
        billingAddress: JSON.parse(billingAddress || '{}'),
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        razorpayPaymentId: payment.id,
        razorpayOrderId: payment.order_id,
        createdAt: new Date()
      });
      
      await newOrder.save();
      console.log(`Order created via webhook: ${newOrder.orderId}`);
      
      // 7. Clear the cart
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
      
      // 8. Store payment details
      const paymentRecord = new Payment({
        razorpayPaymentId: payment.id,
        razorpayOrderId: payment.order_id,
        orderId: newOrder.orderId,
        amount: payment.amount / 100,
        status: payment.status,
        method: payment.method,
        user: userId,
        createdAt: new Date(payment.created_at * 1000)
      });
      
      await paymentRecord.save();
      
      // 9. Send notification to user
      try {
        const user = await User.findById(userId);
        if (user && user.fcmToken) {
          await admin.messaging().send({
            notification: {
              title: 'Order Confirmed!',
              body: `Your order #${newOrder.orderId} has been confirmed.`
            },
            data: {
              type: 'order_confirmation',
              orderId: newOrder.orderId,
              click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            token: user.fcmToken
          });
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Continue processing even if notification fails
      }
      
      return res.status(200).json({ 
        status: 'success',
        orderId: newOrder.orderId
      });
    }
    
    // For other event types, just acknowledge
    return res.status(200).json({ status: 'acknowledged' });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Always return 200 to Razorpay even on error to prevent retries
    return res.status(200).json({ 
      status: 'error but acknowledged',
      error: error.message
    });
  }
});

module.exports = router;