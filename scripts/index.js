// const http = require('http');
// const ngrok = require('@ngrok/ngrok');

// // Create webserver
// http.createServer((req, res) => {
// 	res.writeHead(200, { 'Content-Type': 'text/html' });
// 	res.end('Congrats you have created an ngrok web server');
// }).listen(8080, () => console.log('Node.js web server at 8080 is running...'));

// // Get your endpoint online
// ngrok.connect({ addr: 8080, authtoken_from_env: true })
// 	.then(listener => console.log(`Ingress established at: ${listener.url()}`));

// const http = require('http');
// const ngrok = require('@ngrok/ngrok');
// const crypto = require('crypto');

// const WEBHOOK_SECRET = 'Revol@123'; // Get from Razorpay dashboard

// // Create webserver
// const server = http.createServer((req, res) => {
//   if (req.method === 'POST' && req.url === '/razorpay-webhook') {
//     let body = '';
    
//     req.on('data', chunk => {
//       body += chunk.toString();
//     });
    
//     req.on('end', () => {
//       try {
//         const razorpaySignature = req.headers['x-razorpay-signature'];
//         const isValid = verifyWebhookSignature(body, razorpaySignature);
        
//         if (!isValid) {
//           res.writeHead(401, { 'Content-Type': 'application/json' });
//           return res.end(JSON.stringify({ error: 'Invalid signature' }));
//         }
        
//         const event = JSON.parse(body);
//         console.log('Received webhook:', event);
        
//         // Here you would typically:
//         // 1. Process the event
//         // 2. Forward to your Flutter app (via Firebase or other means)
        
//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ status: 'success' }));
//       } catch (err) {
//         console.error('Webhook error:', err);
//         res.writeHead(400, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ error: err.message }));
//       }
//     });
//   } else {
//     res.writeHead(200, { 'Content-Type': 'text/html' });
//     res.end('Webhook server is running');
//   }
// }).listen(8080, () => console.log('Node.js web server at 8080 is running...'));

// // Verify Razorpay webhook signature
// function verifyWebhookSignature(body, signature) {
//   const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
//   hmac.update(body);
//   const generatedSignature = hmac.digest('hex');
//   return generatedSignature === signature;
// }

// // Get your endpoint online
// ngrok.connect({ addr: 8080, authtoken_from_env: true })
//   .then(listener => console.log(`Ingress established at: ${listener.url()}`));

// const http = require('http');
// const WebSocket = require('ws');
// const ngrok = require('@ngrok/ngrok');
// const crypto = require('crypto');

// const WEBHOOK_SECRET = 'Revol@123'; // Your Razorpay webhook secret

// // Create HTTP server
// const server = http.createServer((req, res) => {
//   if (req.method === 'POST' && req.url === '/razorpay-webhook') {
//     let body = '';
    
//     req.on('data', chunk => {
//       body += chunk.toString();
//     });
    
//     req.on('end', () => {
//       try {
//         const razorpaySignature = req.headers['x-razorpay-signature'];
//         // Only verify signature if it's provided (for production)
//         const isValid = razorpaySignature ? verifyWebhookSignature(body, razorpaySignature) : true;
        
//         if (!isValid) {
//           res.writeHead(401, { 'Content-Type': 'application/json' });
//           return res.end(JSON.stringify({ error: 'Invalid signature' }));
//         }
        
//         const event = JSON.parse(body);
//         console.log('Received webhook:', event);
        
//         // Forward the webhook data to all connected WebSocket clients
//         wss.clients.forEach(client => {
//           if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify(event));
//           }
//         });
        
//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ status: 'success' }));
//       } catch (err) {
//         console.error('Webhook error:', err);
//         res.writeHead(400, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ error: err.message }));
//       }
//     });
//   } else {
//     res.writeHead(200, { 'Content-Type': 'text/html' });
//     res.end('Webhook server is running');
//   }
// });

// // Create WebSocket server
// const wss = new WebSocket.Server({ server });

// wss.on('connection', (ws) => {
//   console.log('WebSocket client connected');
  
//   // Send a welcome message
//   ws.send(JSON.stringify({
//     type: 'connection_established',
//     message: 'Connected to Razorpay webhook server'
//   }));
  
//   ws.on('message', (message) => {
//     console.log('Received message from client:', message);
//   });
  
//   ws.on('close', () => {
//     console.log('WebSocket client disconnected');
//   });
// });

// // Verify Razorpay webhook signature
// function verifyWebhookSignature(body, signature) {
//   const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
//   hmac.update(body);
//   const generatedSignature = hmac.digest('hex');
//   return generatedSignature === signature;
// }

// // Start server
// server.listen(8080, () => console.log('Node.js web server at 8080 is running...'));

// // Get your endpoint online
// ngrok.connect({ addr: 8080, authtoken_from_env: true })
//   .then(listener => console.log(`Ingress established at: ${listener.url()}`));
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');

const WEBHOOK_SECRET = 'Revol@123';
const PORT = process.env.PORT || 8080;
const LOG_FILE = './webhook-logs.log';

// Setup logging
const logStream = fs.createWriteStream(LOG_FILE, {flags: 'a'});
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}
`;
  logStream.write(logMessage);
  console.log(message);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  log(`Received ${req.method} request to ${req.url}`);
  
  // Test endpoint
  if (req.method === 'GET' && req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'Server is up and running' }));
  }
  
  // Webhook simulation endpoint
  if (req.method === 'GET' && req.url === '/simulate-webhook') {
    const simulatedEvent = {
      event: 'payment.authorized',
      payload: {
        payment: {
          entity: {
            id: 'pay_test123',
            amount: 50000,
            status: 'authorized'
          }
        }
      }
    };
    
    log(`Simulating webhook: ${JSON.stringify(simulatedEvent)}`);
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(simulatedEvent));
      }
    });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'Webhook simulated' }));
  }
  
  // Razorpay webhook endpoint
  if (req.method === 'POST' && req.url === '/order/RazorPayWebhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('error', (error) => {
      log(`Request error: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    });
    
    req.on('end', () => {
      try {
        log(`Received webhook body: ${body}`);
        const razorpaySignature = req.headers['x-razorpay-signature'];
        log(`Razorpay signature: ${razorpaySignature || 'none'}`);
        
        // Only verify signature if it's provided
        const isValid = razorpaySignature ? verifyWebhookSignature(body, razorpaySignature) : true;
        
        if (!isValid) {
          log('Invalid webhook signature');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid signature' }));
        }
        
        const event = JSON.parse(body);
        log(`Processed webhook event type: ${event.event || 'unknown'}`);
        
        // Forward the webhook data to all connected WebSocket clients
        let clientCount = 0;
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(event));
            clientCount++;
          }
        });
        log(`Forwarded webhook to ${clientCount} WebSocket clients`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));
      } catch (err) {
        log(`Webhook error: ${err.message}`);
        log(`Raw webhook body: ${body}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Webhook server is running');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  log(`WebSocket client connected from ${clientIp}`);
  
  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to Razorpay webhook server'
  }));
  
  ws.on('message', (message) => {
    log(`Received message from client: ${message}`);
  });
  
  ws.on('close', () => {
    log(`WebSocket client from ${clientIp} disconnected`);
  });
  
  ws.on('error', (error) => {
    log(`WebSocket error for client ${clientIp}: ${error.message}`);
  });
});

// Verify Razorpay webhook signature
function verifyWebhookSignature(body, signature) {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(body);
  const generatedSignature = hmac.digest('hex');
  const isValid = generatedSignature === signature;
  log(`Signature verification: ${isValid ? 'valid' : 'invalid'}`);
  return isValid;
}

// Start server
server.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
  log('Your webhook URL is: https://dealtoallgateway.revollims.com/order/RazorPayWebhook');
  log(`WebSocket URL is: wss://dealtoallgateway.revollims.com`);
});

// Handle server errors
server.on('error', (error) => {
  log(`Server error: ${error.message}`);
});