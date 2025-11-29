/**
 * FISHY AI CHATBOT
 * Public FAQ assistant with "Ice Ice Baby" entrance
 */

import React, { useState, useEffect, useRef } from 'react';

const KNOWLEDGE_BASE = {
  features: {
    keywords: ['feature', 'what does', 'capabilities'],
    response: `Yo! Let me break down what Gulf Coast Charters can do for ya! 🎉

• Weather Alerts - Get notified 24 hours before bad weather
• Real-time NOAA Data - Live buoy data from the Gulf
• Gamification - Earn points, unlock badges, climb leaderboards!
• GPS Tracking - Share your location or keep it private
• Fishing Reports - Share catches with photos
• Captain Portal - Special tools for charter captains
• Community - Connect with 10,000+ fishermen!
• Social Media Integration - Connect all your platforms!

Pretty sweet, right? 🌊`
  },
  
  weather: {
    keywords: ['weather', 'alert', 'forecast', 'storm'],
    response: `Weather alerts are one of my favorite features! 🌩️

Here's how it works:
• We monitor NOAA buoys 24/7
• You get alerts 24 hours before your trip
• Three levels: 🟢 Safe, 🟡 Caution, 🔴 Danger
• Wind, waves, and pressure all tracked
• Email alerts sent automatically

Your safety is our #1 priority! ⚓`
  },
  
  pricing: {
    keywords: ['price', 'cost', 'subscription', 'tier'],
    response: `Let's talk pricing! 💰

We have three tiers:
🆓 Free - Basic features, perfect to start
⭐ Pro - $9.99/mo - All features unlocked
⚓ Captain - $29.99/mo - Business tools included

Most captains love the Captain tier because it pays for itself with just one booking! 🎣

Want details on what's in each tier?`
  },
  
  badges: {
    keywords: ['badge', 'achievement', 'gamification', 'points'],
    response: `Ooh, badges! THIS IS MY JAM! 🎵

We have 35+ badges you can earn:
🎣 First Catch - Log your first fish
🏆 Trophy Hunter - Catch 10+ species
📝 Chronicler - Post 50 reports
👑 Legend - Post 200 reports
🌅 Early Bird - 10 trips before 6 AM
🌊 Deep Sea Expert - 10 offshore trips

And SO many more! Each badge gives you bonus points too! *does tail flip* 🐟`
  },
  
  greeting: {
    keywords: ['hello', 'hi', 'hey', 'sup', 'yo'],
    response: `Yo yo yo! What's up, captain! 🐟

I'm Fishy, your friendly AI assistant here at Gulf Coast Charters!

I can help you with:
• Platform features
• Weather info
• Pricing questions
• How to earn badges
• Anything else fishing-related!

What can I help you with today? 🎣`
  },
  
  help: {
    keywords: ['help', 'confused', 'how do i'],
    response: `No worries, I'm here to help! 🤝

I know all about:
✅ Platform features
✅ Weather alerts
✅ Pricing & subscriptions
✅ Points & badges
✅ How everything works

Just ask me anything! I'm pretty smart for a fish 🐟😎`
  }
};

export default function FishyAIBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [played, setPlayed] = useState(false);
  const messagesEndRef = useRef(null);

  // Play "Ice Ice Baby" bass line on first load
  useEffect(() => {
    if (!played) {
      playIceIceBaby();
      setPlayed(true);
      
      // Initial greeting
      setTimeout(() => {
        addMessage('fishy', KNOWLEDGE_BASE.greeting.response);
      }, 2000);
    }
  }, []);

  const playIceIceBaby = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [
      { freq: 110, duration: 0.2 },
      { freq: 146.83, duration: 0.2 },
      { freq: 110, duration: 0.2 },
      { freq: 110, duration: 0.2 },
      { freq: 164.81, duration: 0.2 },
      { freq: 110, duration: 0.2 }
    ];

    let time = audioContext.currentTime;
    notes.forEach(note => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = note.freq;
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0.3, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
      
      oscillator.start(time);
      oscillator.stop(time + note.duration);
      
      time += note.duration;
    });
  };

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text, timestamp: new Date() }]);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    addMessage('user', userMessage);

    // Show typing indicator
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(userMessage);
      setIsTyping(false);
      addMessage('fishy', response);
    }, 1000);
  };

  const getResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    // Check each knowledge category
    for (const [key, data] of Object.entries(KNOWLEDGE_BASE)) {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return data.response;
      }
    }

    // Default response
    return `Hmm, I'm not sure about that one! 🤔

But I DO know about:
• Platform features
• Weather alerts  
• Pricing
• Points & badges

Try asking me about one of those! Or just say "help" 🐟`;
  };

  return (
    <div className="fishy-chat">
      <div className="chat-header">
        <div className="fishy-avatar">🐟</div>
        <div>
          <h3>Fishy AI Assistant</h3>
          <p>Your friendly fishing guide</p>
        </div>
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            {msg.sender === 'fishy' && <span className="avatar">🐟</span>}
            <div className="bubble">
              <p>{msg.text}</p>
            </div>
            {msg.sender === 'user' && <span className="avatar">👤</span>}
          </div>
        ))}
        
        {isTyping && (
          <div className="message fishy">
            <span className="avatar">🐟</span>
            <div className="bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Fishy anything..."
        />
        <button onClick={handleSend}>Send 🚀</button>
      </div>

      <div className="quick-questions">
        <button onClick={() => setInput('What features do you have?')}>
          Platform Features
        </button>
        <button onClick={() => setInput('Tell me about weather alerts')}>
          Weather Alerts
        </button>
        <button onClick={() => setInput('How much does it cost?')}>
          Pricing
        </button>
      </div>

      <style jsx>{`
        .fishy-chat {
          display: flex;
          flex-direction: column;
          height: 600px;
          max-width: 400px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg, #0066CC, #1E90FF);
          color: white;
        }
        .fishy-avatar {
          font-size: 32px;
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f0f9ff;
        }
        .message {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          align-items: flex-end;
        }
        .message.user {
          flex-direction: row-reverse;
        }
        .avatar {
          font-size: 24px;
        }
        .bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 16px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .message.user .bubble {
          background: #0066CC;
          color: white;
        }
        .typing {
          display: flex;
          gap: 4px;
          padding: 16px;
        }
        .typing span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #666;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .typing span:nth-child(1) { animation-delay: -0.32s; }
        .typing span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .input-area {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid #e5e7eb;
        }
        input {
          flex: 1;
          padding: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          outline: none;
        }
        button {
          padding: 10px 16px;
          background: #0066CC;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .quick-questions {
          display: flex;
          gap: 8px;
          padding: 12px;
          overflow-x: auto;
        }
        .quick-questions button {
          white-space: nowrap;
          font-size: 12px;
          padding: 6px 12px;
        }
      `}</style>
    </div>
  );
}
