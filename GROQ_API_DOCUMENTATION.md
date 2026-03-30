# Groq AI Bot API Documentation

## Overview
This document describes the API endpoint used by the Hoomi Agent chat interface to communicate with the Groq-powered AI bot with streaming responses.

---

## Endpoint

### Send Message to AI Bot

**URL**: Defined in environment variable `VITE_GROQ_API_URL`

**Method**: `POST`

**Content-Type**: `application/json`

**Description**: Sends user messages along with conversation history and user context to the AI bot and receives a streaming text response.

---

## Request

### Headers
```
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | Array<Message> | Yes | Array of message objects containing conversation history |
| `user_email` | string | Yes | User's email address for identification |
| `user_latitude` | number | No | User's current latitude coordinate |
| `user_longitude` | number | No | User's current longitude coordinate |

#### Message Object Structure
```typescript
{
  role: "user" | "assistant",
  content: string
}
```

### Example Request Body

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, I need help booking a ride"
    },
    {
      "role": "assistant",
      "content": "I'd be happy to help you book a ride. Where would you like to go?"
    },
    {
      "role": "user",
      "content": "I need to go to the airport"
    }
  ],
  "user_email": "user@example.com",
  "user_latitude": -6.2088,
  "user_longitude": 106.8456
}
```

### Example cURL Request

```bash
curl -X POST "${VITE_GROQ_API_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello, I need help booking a ride"
      }
    ],
    "user_email": "user@example.com",
    "user_latitude": -6.2088,
    "user_longitude": 106.8456
  }'
```

---

## Response

### Success Response

**Status Code**: `200 OK`

**Content-Type**: `text/plain` or `text/event-stream` (streaming)

**Response Format**: Streaming chunks of text data

The response is delivered as a **streaming response** using the ReadableStream API. Text chunks are progressively sent and decoded on the client side.

### Streaming Response Handling

The client uses the Fetch API with ReadableStream:

```typescript
const response = await fetch(GROQ_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: messageHistory,
    user_email: user?.email || "daffa.sayra.firdaus@gmail.com",
    user_latitude: userLocation?.latitude,
    user_longitude: userLocation?.longitude,
  }),
});

// Handle streaming response
const reader = response.body?.getReader();
const decoder = new TextDecoder();

let fullText = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  fullText += chunk;
  
  // Update UI with accumulated text in real-time
}
```

### Example Response Flow

The response is streamed incrementally:

**Chunk 1**: `"I can help"`
**Chunk 2**: `" you book"`
**Chunk 3**: `" a ride to the airport."`
**Chunk 4**: `" What time would you like to leave?"`

**Final Accumulated Text**: `"I can help you book a ride to the airport. What time would you like to leave?"`

---

## Error Responses

### HTTP Error Codes

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid request body or missing required fields |
| `401` | Unauthorized - Invalid or missing authentication |
| `404` | Not Found - API endpoint not found |
| `500` | Internal Server Error - Server-side error occurred |
| `503` | Service Unavailable - AI service temporarily unavailable |

### Error Handling Example

```typescript
if (!response.ok) {
  throw new Error(`API error: ${response.status}`);
}
```

### Error Response Body
```json
{
  "error": "Error message description",
  "status": 500
}
```

---

## Implementation Details

### Client-Side Flow

1. **Build Message History**: Convert internal message format to API format
   ```typescript
   const messageHistory = messages.map((msg) => ({
     role: msg.role === "user" ? "user" : "assistant",
     content: msg.text,
   }));
   ```

2. **Include User Context**: Add user email and GPS location
   ```typescript
   {
     user_email: user?.email || "daffa.sayra.firdaus@gmail.com",
     user_latitude: userLocation?.latitude,
     user_longitude: userLocation?.longitude,
   }
   ```

3. **Send Request**: POST to GROQ_API_URL with streaming enabled

4. **Handle Streaming**: Use ReadableStream API to process chunks progressively

5. **Update UI**: Display accumulated text in real-time as chunks arrive

### Conversation History Format

The API maintains context by sending the complete conversation history with each request:

```javascript
Message History Array:
[
  { role: "user", content: "First user message" },
  { role: "assistant", content: "First bot response" },
  { role: "user", content: "Second user message" },
  { role: "assistant", content: "Second bot response" },
  { role: "user", content: "Current user message" }
]
```

### Location Data

- **Source**: Browser Geolocation API (`navigator.geolocation.getCurrentPosition`)
- **Fallback**: Stored in `localStorage` as `hoomi_user_location`
- **Format**: Decimal degrees
- **Precision**: High accuracy enabled
- **Purpose**: Provides location context for location-based queries (e.g., nearby services, directions)

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file with:

```bash
VITE_GROQ_API_URL=https://your-groq-api-endpoint.com/api/chat
```

### Environment Setup

The API URL is loaded at build time using Vite's `import.meta.env`:

```typescript
const GROQ_API_URL = import.meta.env.VITE_GROQ_API_URL;
```

---

## Features Supported by This API

### 1. **Conversational Context**
- Maintains full conversation history
- Enables contextual responses based on previous messages

### 2. **User Personalization**
- Uses email for user identification
- Can customize responses based on user profile

### 3. **Location-Aware Responses**
- GPS coordinates enable location-based assistance
- Useful for ride booking, delivery services, and local recommendations

### 4. **Real-Time Streaming**
- Progressive text rendering for better UX
- Reduces perceived latency
- Allows early display of partial responses

---

## Client Implementation Reference

**File**: [`/hoomi-ride/src/pages/HoomiAgent.tsx`](src/pages/HoomiAgent.tsx)

**Key Function**: `sendMessage()` (lines 330-440)

**API Call Location**: Lines 374-386

```typescript
// Call Groq API with streaming
const response = await fetch(GROQ_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: messageHistory,
    user_email: user?.email || "daffa.sayra.firdaus@gmail.com",
    user_latitude: userLocation?.latitude,
    user_longitude: userLocation?.longitude,
  }),
});
```

---

## Notes

- The API uses **streaming responses** for real-time chat experience
- The client automatically handles progressive text rendering
- Location data is optional but enhances AI responses for location-based queries
- All messages include full conversation history for context preservation
- The implementation replaces ElevenLabs conversation API with Groq + Web Speech API

---

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with real API endpoints
2. **User Data**: Email and location data are sent to the API - ensure GDPR compliance
3. **HTTPS**: Always use HTTPS endpoints in production
4. **Rate Limiting**: Implement rate limiting on the backend to prevent abuse
5. **Input Validation**: Sanitize user inputs before sending to the API

---

## Related Features

### Voice Input Integration
The chat interface supports voice-to-text using the Web Speech API:
- Language: Indonesian (`id-ID`) with English fallback
- Continuous recognition with debounce (1.5 seconds)
- Automatic message sending after speech pause

### Markdown Support
AI responses support rich formatting:
- Uses `react-markdown` with `remark-gfm` and `rehype-raw`
- Supports GitHub Flavored Markdown
- Renders tables, lists, code blocks, etc.

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-24 | 1.0 | Initial API documentation extracted from HoomiAgent.tsx |

---

## Support

For API issues or questions, contact the backend development team or refer to the main project repository.
