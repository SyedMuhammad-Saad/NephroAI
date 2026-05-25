import { useState } from 'react';

export default function Chatbot({ patientContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am NephroAI. How can I help you interpret this patient\'s diagnostic report?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // 1. Add user message to screen
    const newMessages = [...messages, { sender: 'user', text: inputText }];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    try {
      // 2. Send the message AND the patient data to your new Flask route
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputText,
          // We pass the context so Gemini knows what the dashboard says!
          context: patientContext 
        })
      });

      const data = await response.json();
      
      // 3. Add AI response to screen
      setMessages([...newMessages, { sender: 'ai', text: data.reply }]);
    } catch (error) {
      setMessages([...newMessages, { sender: 'ai', text: 'Error connecting to the AI server.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 h-96 bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col mb-4 overflow-hidden">
          {/* Header */}
          <div className="bg-[#0078D4] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <h3 className="font-bold text-sm tracking-wide">NephroAI Copilot</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 text-lg">×</button>
          </div>

          {/* Messages Area */}
         {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3 text-sm">
            {messages.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded-lg max-w-[85%] ${msg.sender === 'user' ? 'bg-[#0078D4] text-white self-end rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 self-start rounded-bl-none shadow-sm leading-relaxed'}`}>
                
                {/* If it's the user, print normal text.
                  If it's the AI, translate **bold** and line breaks into real HTML!
                */}
                {msg.sender === 'user' ? (
                  msg.text
                ) : (
                  <div dangerouslySetInnerHTML={{ 
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>') // Makes it bold and dark
                      .replace(/\n/g, '<br/>') // Fixes the mashed-together paragraph issue
                  }} />
                )}

              </div>
            ))}
            {isTyping && (
              <div className="bg-white border border-slate-200 text-slate-500 self-start p-3 rounded-lg rounded-bl-none shadow-sm text-xs italic">
                AI is typing...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about the results..." 
              className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0078D4]"
            />
            <button onClick={sendMessage} className="bg-[#0078D4] text-white px-3 py-2 rounded font-bold hover:bg-blue-700 transition-colors">
              →
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="w-14 h-14 bg-[#0078D4] text-white rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center border-4 border-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        </button>
      )}
    </div>
  );
}