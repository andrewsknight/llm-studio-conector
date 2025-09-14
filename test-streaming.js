// Test script to debug streaming issues
const testStreaming = async () => {
  console.log('🚀 Testing streaming functionality...');
  
  // Simulate the same request that the app makes
  const requestBody = {
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

  try {
    console.log('📡 Making request to LM Studio...');
    const response = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📬 Response received:', {
      ok: response.ok,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    console.log('📖 Reading streaming response...');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let messageContent = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('✅ Stream finished');
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
              messageContent += content;
              console.log('📝 Chunk:', JSON.stringify(content));
            }
            
            if (chunk.choices?.[0]?.finish_reason) {
              console.log('🏁 Finish reason:', chunk.choices[0].finish_reason);
            }
          } catch (error) {
            console.warn('⚠️  Error parsing chunk:', error, 'Data:', data);
          }
        }
      }
    }

    console.log('📋 Final message content:');
    console.log('---START---');
    console.log(messageContent);
    console.log('---END---');

    // Test the same filtering logic as the app
    const filteredContent = messageContent.replace(/<think>[\s\S]*?<\/think>/g, '');
    console.log('🧹 Filtered content:');
    console.log('---START---');
    console.log(filteredContent);
    console.log('---END---');

  } catch (error) {
    console.error('💥 Error during test:', error);
  }
};

// Run the test
testStreaming();