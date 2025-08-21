// const admin = require('firebase-admin');
// const express = require('express');
// const bodyParser = require('body-parser');
// const path = require('path');
// const { sendPushNotification, schedulePushNotification } = require('./fbno');

// // Initialize Firebase Admin SDK
// const serviceAccount = require(path.join(__dirname, 'fb.json'));
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://revol-734dd-default-rtdb.firebaseio.com/"

//   // databaseURL: "https://deal2all-dd99f-default-rtdb.firebaseio.com/"
// });

// const app = express();
// app.use(bodyParser.json());

// // Route to send push notification
// app.post('/sendPushNotification', async (req, res) => {
//   const { title, body, imageUrl, userId } = req.body;
//   try {
//     const response = await sendPushNotification(title, body, imageUrl, userId);
//     return res.status(200).send(response);
//   } catch (error) {
//     console.error('Error sending push notification:', error);
//     return res.status(500).send(`Error sending push notification: ${error.message}`);
//   }
// });

// // Route to schedule push notification
// app.post('/schedulePushNotification', (req, res) => {
//   const { title, body, imageUrl, userId, scheduleTime } = req.body;
//   try {
//     schedulePushNotification(title, body, imageUrl, userId, new Date(scheduleTime));
//     return res.status(200).send('Notification scheduled successfully');
//   } catch (error) {
//     console.error('Error scheduling push notification:', error);
//     return res.status(500).send(`Error scheduling push notification: ${error.message}`);
//   }
// });

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const http = require('http'); // Add this
const WebSocket = require('ws'); // Add this - you'll need to install it with npm
const { sendPushNotification, schedulePushNotification } = require('./fbno');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, 'fb.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://revol-734dd-default-rtdb.firebaseio.com/"
});

const app = express();
app.use(bodyParser.json());

// Create HTTP server from Express app
const server = http.createServer(app); // Add this

// Create WebSocket server
const wss = new WebSocket.Server({ server }); // Add this

// Store connected clients
const clients = new Set(); // Add this

// Handle WebSocket connections
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('WebSocket client connected');
  
  // Send a connection confirmation
  ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
  
  ws.on('message', (message) => {
    console.log('Received message from client:', message);
  });
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });
});

// Route to send push notification
app.post('/sendPushNotification', async (req, res) => {
  const { title, body, imageUrl, userId } = req.body;
  try {
    const response = await sendPushNotification(title, body, imageUrl, userId);
    return res.status(200).send(response);
  } catch (error) {
    console.error('Error sending push notification:', error);
    return res.status(500).send(`Error sending push notification: ${error.message}`);
  }
});

// Route to schedule push notification
app.post('/schedulePushNotification', (req, res) => {
  const { title, body, imageUrl, userId, scheduleTime } = req.body;
  try {
    schedulePushNotification(title, body, imageUrl, userId, new Date(scheduleTime));
    return res.status(200).send('Notification scheduled successfully');
  } catch (error) {
    console.error('Error scheduling push notification:', error);
    return res.status(500).send(`Error scheduling push notification: ${error.message}`);
  }
});

// ======== RAZORPAY WEBHOOK HANDLER ========
app.post('/api/payments/razorpay-webhook', (req, res) => {
  // Get the webhook signature from headers
  const razorpaySignature = req.headers['x-razorpay-signature'];
  
  // Your webhook secret from Razorpay dashboard
  const webhookSecret = 'Revol@123';
  
  // Verify signature
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
  
  // Verify that signatures match
  if (expectedSignature === razorpaySignature) {
    // Process the webhook event
    const event = req.body;
    console.log('Received Razorpay webhook:', event.event);
    
    // Handle the event based on type
    switch (event.event) {
      case 'payment.authorized':
        handlePaymentAuthorized(event.payload.payment.entity);
        break;
        
      case 'payment.failed':
        handlePaymentFailed(event.payload.payment.entity);
        break;
        
      case 'refund.created':
        handleRefundCreated(event.payload.refund.entity);
        break;
        
      // Add more event handlers as needed
    }
    
    // Broadcast the event to all connected WebSocket clients
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log('Forwarding webhook event to WebSocket client');
        client.send(JSON.stringify(event));
      }
    });
    
    // Return a 200 response to acknowledge receipt
    res.status(200).send({status: 'ok'});
  } else {
    // Signature verification failed
    console.log('Webhook signature verification failed');
    res.status(400).send({status: 'invalid signature'});
  }
});

// ======== PAYMENT HANDLERS ========
// Your existing payment handlers remain unchanged
async function handlePaymentAuthorized(payment) {
  try {
    // Extract relevant information
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const amount = payment.amount / 100; // Convert from paise to rupees
    
    // 1. Update order status in Firebase
    const db = admin.database();
    const orderRef = db.ref(`orders/${orderId}`);
    
    await orderRef.update({
      paymentStatus: 'paid',
      paymentId: paymentId,
      paidAmount: amount,
      paidAt: admin.database.ServerValue.TIMESTAMP
    });
    
    // 2. Send notification to user
    const orderSnapshot = await orderRef.once('value');
    const order = orderSnapshot.val();
    
    if (order && order.userId) {
      await sendPushNotification(
        'Payment Successful',
        `Your payment of ₹${amount} for order #${orderId.substring(0, 8)} was successful.`,
        null, // No image
        order.userId
      );
    }
    
    console.log(`Payment successful for order: ${orderId}`);
  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
}

async function handlePaymentFailed(payment) {
  try {
    const orderId = payment.order_id;
    const errorCode = payment.error_code;
    const errorDescription = payment.error_description;
    
    // 1. Update order status in Firebase
    const db = admin.database();
    const orderRef = db.ref(`orders/${orderId}`);
    
    await orderRef.update({
      paymentStatus: 'failed',
      paymentError: `${errorCode}: ${errorDescription}`,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });
    
    // 2. Send notification to user
    const orderSnapshot = await orderRef.once('value');
    const order = orderSnapshot.val();
    
    if (order && order.userId) {
      await sendPushNotification(
        'Payment Failed',
        `Your payment for order #${orderId.substring(0, 8)} failed. Please try again.`,
        null,
        order.userId
      );
    }
    
    console.log(`Payment failed for order: ${orderId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleRefundCreated(refund) {
  try {
    const paymentId = refund.payment_id;
    const refundId = refund.id;
    const amount = refund.amount / 100; // Convert from paise to rupees
    
    // Find the order by payment ID
    const db = admin.database();
    const ordersRef = db.ref('orders');
    const query = ordersRef.orderByChild('paymentId').equalTo(paymentId);
    
    const snapshot = await query.once('value');
    if (snapshot.exists()) {
      // Update the first matching order
      const orders = snapshot.val();
      const orderId = Object.keys(orders)[0];
      const orderRef = db.ref(`orders/${orderId}`);
      
      await orderRef.update({
        refundStatus: 'refunded',
        refundId: refundId,
        refundAmount: amount,
        refundedAt: admin.database.ServerValue.TIMESTAMP
      });
      
      // Send notification to user
      const order = orders[orderId];
      if (order && order.userId) {
        await sendPushNotification(
          'Refund Processed',
          `Your refund of ₹${amount} for order #${orderId.substring(0, 8)} has been processed.`,
          null,
          order.userId
        );
      }
      
      console.log(`Refund processed for payment: ${paymentId}`);
    }
  } catch (error) {
    console.error('Error handling refund:', error);
  }
}

// ======== HELPER ENDPOINTS FOR RAZORPAY ========
// Create order endpoint
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;
    
    // You'll need to install the Razorpay SDK
    // npm install razorpay
    const Razorpay = require('razorpay');
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'your_key_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret'
    });
    
    const order = await razorpay.orders.create({
      amount: amount, // amount in paise
      currency,
      receipt,
      notes
    });
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment endpoint
app.post('/api/payments/verify', (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    
    // Your key secret from Razorpay dashboard
    const secret = process.env.RAZORPAY_KEY_SECRET || 'your_key_secret';
    
    // Create the signature verification string
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    
    // Generate the expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');
    
    // Verify signature
    if (expectedSignature === razorpay_signature) {
      res.status(200).json({ status: 'ok' });
    } else {
      res.status(400).json({ status: 'invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server using the HTTP server that has WebSocket support
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { // Changed from app.listen to server.listen
  console.log(`Server is running on port ${PORT} with WebSocket support`);
});