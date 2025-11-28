// Real-time messaging component - simplified for package
'use client'
import { useState } from 'react'

export default function InstantMessagingSystem() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  
  return (
    <div className="flex h-screen">
      {/* Conversations List */}
      <div className="w-1/3 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <div className="overflow-y-auto">
          {/* Conversation items */}
        </div>
      </div>
      
      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(msg => (
            <div key={msg.id} className="mb-4">
              <div className="bg-blue-100 rounded-lg p-3 inline-block">
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        
        {/* Input */}
        <div className="p-4 border-t">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  )
}
