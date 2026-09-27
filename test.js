const axios = require('axios'); // पहले 'npm install axios' कर लें

const API_URL = 'https://logiclords955485.netlify.app/';
const TEST_DURATION_MS = 600000; // 1 मिनट

let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
const startTime = Date.now();

async function sendRequest() {
  if (Date.now() - startTime >= TEST_DURATION_MS) {
    return; // 1 मिनट पूरा होने पर रुक जाएँ
  }

  totalRequests++;
  try {
    const response = await axios.get(API_URL);
    if (response.status === 200) {
      successfulRequests++;
    }
  } catch (error) {
    failedRequests++;
  }

  // अगला रिक्वेस्ट तुरंत भेजने के लिए (Asynchronous Loop)
  setImmediate(sendRequest);
}

console.log("1 मिनट का टेस्ट शुरू हो रहा है...");

// एक साथ 10 पैरेलल रिक्वेस्ट चैन शुरू करें
for (let i = 0; i < 1000; i++) {
  sendRequest();
}

// 1 मिनट बाद रिजल्ट प्रिंट करें
setTimeout(() => {
  console.log("\n--- टेस्ट रिजल्ट ---");
  console.log(`कुल भेजे गए रिक्वेस्ट: ${totalRequests}`);
  console.log(`सफल रिक्वेस्ट (200 OK): ${successfulRequests}`);
  console.log(`फ़ेल रिक्वेस्ट: ${failedRequests}`);
  console.log(`प्रति सेकंड रिक्वेस्ट (RPS): ${(totalRequests / 60).toFixed(2)}`);
  process.exit(0);
}, TEST_DURATION_MS);
