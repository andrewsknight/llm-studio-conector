// Direct API test to see what's happening
const testDirectAPI = async () => {
  console.log('🔥 Direct API Test Starting...');
  
  // Clear localStorage to start fresh
  console.log('🧹 Clearing localStorage...');
  ['llm-chat-conversations', 'llm-chat-current-conversation', 'llm-chat-settings'].forEach(key => {
    localStorage.removeItem(key);
  });

  const request = {
    model: "qwen/qwen3-1.7b",
    messages: [
      {
        role: "system",
        content: "Eres un asistente útil y amigable. Responde de manera clara y concisa."
      },
      {
        role: "user",
        content: "Hola, ¿cómo estás?"
      }
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: true
  };

  console.log('📡 Making direct request to LM Studio...');
  console.log('Request:', request);

  try {
    const response = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      console.error('❌ Response not OK:', response.status, response.statusText);
      return;
    }

    console.log('✅ Response OK, reading stream...');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('🏁 Stream finished');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          try {
            const chunk = JSON.parse(data);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              console.log('📝 Chunk:', JSON.stringify(content), 'Total so far:', fullContent.length, 'chars');
            }
            
            if (chunk.choices?.[0]?.finish_reason) {
              console.log('🏁 Finish reason:', chunk.choices[0].finish_reason);
            }
          } catch (error) {
            console.warn('⚠️ Error parsing chunk:', error);
          }
        }
      }
    }

    console.log('📋 FINAL COMPLETE RESPONSE:');
    console.log('---START FULL CONTENT---');
    console.log(fullContent);
    console.log('---END FULL CONTENT---');

    // Test filtering
    const filteredContent = fullContent.replace(/<think>[\s\S]*?<\/think>/g, '');
    console.log('🧹 FILTERED CONTENT (without <think> tags):');
    console.log('---START FILTERED---');
    console.log(filteredContent);
    console.log('---END FILTERED---');

    return { fullContent, filteredContent };

  } catch (error) {
    console.error('💥 Direct API test failed:', error);
  }
};

// Test localStorage simulation
console.log('🧪 Testing localStorage operations...');
const testConversation = {
  id: 'test-123',
  title: 'Test Conversation',
  createdAt: Date.now(),
  messages: [
    { role: 'user', content: 'Test message', timestamp: Date.now() },
    { role: 'assistant', content: 'Test response', timestamp: Date.now() }
  ]
};

console.log('💾 Saving test conversation...');
localStorage.setItem('llm-chat-conversations', JSON.stringify([testConversation]));
localStorage.setItem('llm-chat-current-conversation', JSON.stringify('test-123'));

console.log('📖 Reading back from localStorage...');
const saved = JSON.parse(localStorage.getItem('llm-chat-conversations') || '[]');
const currentId = JSON.parse(localStorage.getItem('llm-chat-current-conversation') || 'null');

console.log('✅ Saved conversations:', saved);
console.log('✅ Current conversation ID:', currentId);
console.log('✅ Found conversation:', saved.find(c => c.id === currentId));

// Run the API test
testDirectAPI();