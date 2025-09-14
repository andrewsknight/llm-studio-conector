// Debug React state management issues
console.log('🔍 Testing localStorage functionality...');

// Test localStorage operations like the app does
const STORAGE_KEYS = {
  CONVERSATIONS: 'llm-chat-conversations',
  SETTINGS: 'llm-chat-settings',
  CURRENT_CONVERSATION: 'llm-chat-current',
};

// Clear existing data
console.log('🧹 Clearing localStorage...');
Object.values(STORAGE_KEYS).forEach(key => {
  localStorage.removeItem(key);
  console.log(`Cleared: ${key}`);
});

// Test creating a conversation like the app does
console.log('📝 Testing conversation creation...');

const newConversation = {
  id: 'test-conversation-id',
  title: 'Test Conversation',
  createdAt: Date.now(),
  messages: [],
};

console.log('Created conversation object:', newConversation);

// Test saving to localStorage
try {
  const conversations = [newConversation];
  localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, JSON.stringify(newConversation.id));
  
  console.log('✅ Saved to localStorage successfully');
  
  // Test reading back
  const savedConversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONVERSATIONS) || '[]');
  const savedCurrentId = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION) || 'null');
  
  console.log('📖 Read from localStorage:');
  console.log('Conversations:', savedConversations);
  console.log('Current ID:', savedCurrentId);
  
  // Test adding a message like during streaming
  const userMessage = {
    role: 'user',
    content: 'Test message',
    timestamp: Date.now()
  };
  
  const assistantMessage = {
    role: 'assistant', 
    content: '',
    timestamp: Date.now()
  };
  
  // Add user message
  savedConversations[0].messages.push(userMessage);
  console.log('Added user message:', userMessage);
  
  // Add assistant message
  savedConversations[0].messages.push(assistantMessage);
  console.log('Added assistant message:', assistantMessage);
  
  // Save updated conversation
  localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(savedConversations));
  
  // Test updating assistant message content like during streaming
  const updatedConversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONVERSATIONS) || '[]');
  const lastMessageIndex = updatedConversations[0].messages.length - 1;
  
  console.log('🔄 Testing message updates...');
  
  // Simulate streaming updates
  const streamingContent = [
    'Hola',
    'Hola, ¿cómo',
    'Hola, ¿cómo estás?',
    'Hola, ¿cómo estás? ¡Soy un asistente!'
  ];
  
  streamingContent.forEach((content, index) => {
    updatedConversations[0].messages[lastMessageIndex].content = content;
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updatedConversations));
    console.log(`Update ${index + 1}:`, content);
  });
  
  console.log('✅ All localStorage operations successful');
  
  // Final check
  const finalConversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONVERSATIONS) || '[]');
  console.log('🎯 Final state:', finalConversations);
  
} catch (error) {
  console.error('❌ Error during localStorage operations:', error);
}

console.log('🏁 Test completed');