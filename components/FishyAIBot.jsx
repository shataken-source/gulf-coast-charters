// AI chatbot assistant - simplified for package
'use client'
import { useState } from 'react'

export default function FishyAIBot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  
  const sendMessage = async () => {
    if (!input.trim()) return
    
    setMessages([...messages, { role: 'user', content: input }])
    setInput('')
    
    // Call OpenAI API here
    const response = 'Hello! I\'m Fishy, your AI fishing assistant. How can I help you today?'
    setMessages(prev => [...prev, { role: 'assistant', content: response }])
  }
  
  return (
    <div className="fixed bottom-4 right-4">
      <button className="bg-blue-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-2xl">
        🐟
      </button>
      
      {/* Chat window (toggle visibility) */}
      <div className="hidden absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl">
        <div className="p-4 bg-blue-600 text-white rounded-t-lg">
          <h3 className="font-bold">Fishy AI Assistant</h3>
        </div>
        
        <div className="h-96 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask me anything..."
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>
    </div>
  )
}
