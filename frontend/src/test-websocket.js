/**
 * Simple WebSocket test for debugging
 */

async function testWebSocket() {
  const sessionId = "test-session-1";
  const token = localStorage.getItem("access_token");

  if (!token) {
    console.error("No token found. Please login first.");
    return;
  }

  const wsUrl = `ws://localhost:8000/ws/chat/${sessionId}/?token=${token}`;
  console.log(`[TEST] Connecting to: ${wsUrl}`);

  try {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[TEST] ✅ WebSocket OPEN - Connection successful!");
      ws.send(JSON.stringify({ type: "test", message: "Hello from test" }));
    };

    ws.onmessage = (event) => {
      console.log("[TEST] ✅ Message received:", event.data);
    };

    ws.onerror = (error) => {
      console.error("[TEST] ❌ WebSocket ERROR:", error);
    };

    ws.onclose = () => {
      console.log("[TEST] WebSocket CLOSED");
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close();
        console.log("[TEST] Test connection closed");
      }
    }, 5000);
  } catch (error) {
    console.error("[TEST] Failed to create WebSocket:", error);
  }
}

// Run test when you call testWebSocket() in console
window.testWebSocket = testWebSocket;
console.log("WebSocket test ready. Run: testWebSocket()");
