import React, { useState, useEffect, useRef } from 'react';

// Define the type for our messages to satisfy TypeScript
interface Message {
  role: 'user' | 'agent';
  content: string;
}

// For this easy version, let's add basic styling directly in the file.
const chatContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#f3f4f6',
};

const messagesContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const messageBubbleStyle = (isUser: boolean): React.CSSProperties => ({
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  maxWidth: '75%',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  backgroundColor: isUser ? '#3b82f6' : '#ffffff',
  color: isUser ? '#ffffff' : '#1f2937',
});

const inputContainerStyle: React.CSSProperties = {
  padding: '1rem',
  borderTop: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
};

const inputFieldStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  outline: 'none',
};

const sendButtonStyle: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: '0.5rem',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontWeight: '600',
  cursor: 'pointer',
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadId: string = "YOUR_COLLEGE_ROLL_NUMBER"; // <--- ISKO ZAROOR BADALNA

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://brief-thousands-sunset-9fcb1c78-485f-4967-ac042759a8fa1462.mastra.cloud/api/agents/weatherAgent/stream', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,fr;q=0.7',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
          'x-mastra-dev-playground': 'true'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage.content }],
          runId: 'weatherAgent',
          maxRetries: 2,
          maxSteps: 5,
          temperature: 0.5,
          topP: 1,
          runtimeContext: {},
          threadId: threadId,
          resourceId: 'weatherAgent'
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Could not get reader from response body.");
      
      const decoder = new TextDecoder();
      let assistantMessageContent = '';
      setMessages((prevMessages) => [...prevMessages, { role: 'agent', content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessageContent += chunk;
        
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1].content = assistantMessageContent;
          return newMessages;
        });
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'agent', content: 'Sorry, I am not working right now. Please try again later.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={chatContainerStyle}>
      <div style={messagesContainerStyle}>
        {messages.map((msg, index) => (
          <div key={index} style={messageBubbleStyle(msg.role === 'user')}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ ...messageBubbleStyle(false), backgroundColor: '#d1d5db', color: '#6b7280' }}>
            ...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={inputContainerStyle}>
        <div style={inputGroupStyle}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            disabled={isLoading}
            style={inputFieldStyle}
            placeholder={isLoading ? 'Fetching...' : 'Type your message...'}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            style={{ ...sendButtonStyle, opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;