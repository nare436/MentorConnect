import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Plus, Paperclip } from 'lucide-react';
import io from 'socket.io-client';
import { getTeamChatHistory } from '../utils/api';

function TeamChat({ teamId, taskId, userData, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load chat history from database
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await getTeamChatHistory(teamId);
        if (response.success && response.messages) {
          setMessages(response.messages);
        }
      } catch (err) {
        console.error('Failed to load team chat history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (teamId) {
      loadChatHistory();
    }
  }, [teamId]);

  // Socket.io connection for team chat
  useEffect(() => {
    if (!userData || !teamId) return;

    const socketInstance = io('http://localhost:5000', { withCredentials: true });
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to team chat server');
      setIsConnected(true);
      socketInstance.emit('user-online', userData.id);
      socketInstance.emit('join-team-room', { teamId, userId: userData.id });
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from team chat server');
      setIsConnected(false);
    });

    // Receive new team messages
    socketInstance.on('new-team-message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
    });

    // Receive typing indicator
    socketInstance.on('team-user-typing', (data) => {
      if (data.userId !== userData.id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          return [...filtered, data];
        });
      }
    });

    socketInstance.on('team-user-stopped-typing', (userId) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    });

    return () => socketInstance.disconnect();
  }, [teamId, userData?.id]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('team-message', {
      teamId,
      taskId,
      userId: userData.id,
      userName: userData.name,
      message: newMessage.trim(),
      userRole: userData.role,
      messageType: 'text'
    });

    setNewMessage('');
    socket.emit('team-user-stopped-typing', userData.id);
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit('team-user-typing', {
      teamId,
      userId: userData.id,
      userName: userData.name
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('team-user-stopped-typing', userData.id);
    }, 3000);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden z-40">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <span className="font-semibold">Team Chat</span>
          {isConnected && (
            <span className="text-xs px-2 py-1 bg-green-600 rounded-full">Live</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="hover:bg-gray-700 p-1 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-100 border-b border-red-400 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="mx-auto mb-2 animate-pulse" size={32} />
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="mx-auto mb-2" size={32} />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const senderId = msg.senderId?._id || msg.userId;
              const isOwnMessage = senderId === userData?.id;
              const senderName = msg.senderName || msg.userName || 'Unknown';

              return (
                <div
                  key={msg._id || `${msg.userId}-${msg.timestamp}`}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-gray-800 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {isOwnMessage ? 'You' : senderName}
                    </p>
                    <p className="text-sm break-words">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-200 px-4 py-2 rounded-lg text-xs text-gray-600 italic">
                  {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-white">
        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded transition"
          title="Attach file"
        >
          <Paperclip size={18} className="text-gray-600" />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onBlur={() => {
            if (socket) socket.emit('team-user-stopped-typing', userData.id);
          }}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800 text-sm"
          disabled={!isConnected}
        />
        <button
          type="submit"
          className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
          disabled={!isConnected || !newMessage.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default TeamChat;
