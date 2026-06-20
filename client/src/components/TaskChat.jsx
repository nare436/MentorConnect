import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, MessageSquare } from 'lucide-react';
import io from 'socket.io-client';
import { getChatHistory } from '../utils/api';

function TaskChat({ taskId, userData, inline = false, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Closed by default
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Load chat history from database
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await getChatHistory(taskId);
        if (response.success && response.messages) {
          setMessages(response.messages);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      loadChatHistory();
    }
  }, [taskId]);

  // Socket.io connection
  useEffect(() => {
    if (!userData || !taskId) return;

    const socketInstance = io('http://localhost:5000', { withCredentials: true });
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      socketInstance.emit('user-online', userData.id);
      socketInstance.emit('join-task-room', taskId);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    socketInstance.on('new-task-message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
      
      // If chat is closed, increment unread count
      setIsOpen(currentIsOpen => {
        if (!currentIsOpen) {
          setUnreadCount(prev => prev + 1);
        }
        return currentIsOpen;
      });
    });

    return () => socketInstance.disconnect();
  }, [taskId, userData?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('task-message', {
      taskId,
      userId: userData.id,
      userName: userData.name,
      message: newMessage.trim(),
      userRole: userData.role
    });

    setNewMessage('');
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  // Inline mode: renders as embedded panel
  if (inline) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 h-96 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} />
            <span className="font-semibold">Task Chat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-300">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-900">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="mx-auto mb-2" size={32} />
              <p className="text-sm">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="mx-auto mb-2" size={32} />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const senderId = msg.senderId?._id || msg.userId;
              const isOwnMessage = senderId === userData?.id;
              const senderName = msg.senderName || msg.userName || 'Unknown';
              const senderRole = msg.senderRole || 'student';
              const timestamp = msg.createdAt || msg.timestamp;
              
              return (
                <div
                  key={msg._id || `${msg.userId}-${msg.timestamp}`}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isOwnMessage ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                      {isOwnMessage ? 'You' : senderName}
                      {senderRole === 'mentor' && (
                        <span className={`text-xs px-1 py-0.5 rounded ${isOwnMessage ? 'bg-blue-600' : 'bg-blue-100 text-blue-800'}`}>Mentor</span>
                      )}
                    </p>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex px-4 py-2 gap-2 border-t border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
            disabled={!isConnected}
          />
          <button
            type="submit"
            className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isConnected || !newMessage.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    );
  }

  // Floating mode (default)
  return (
    <div className="fixed bottom-4 right-4 w-80 z-50 flex flex-col items-end">
      
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0); // Reset unread count when opening
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 relative"
        >
          <MessageSquare size={20} />
          Chat
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 h-96 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="font-semibold">Task Chat</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <button onClick={handleClose}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-900">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="mx-auto mb-2" size={32} />
                <p className="text-sm">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="mx-auto mb-2" size={32} />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const senderId = msg.senderId?._id || msg.userId;
                const isOwnMessage = senderId === userData?.id;
                const senderName = msg.senderName || msg.userName || 'Unknown';
                const timestamp = msg.createdAt || msg.timestamp;
                
                return (
                  <div
                    key={msg._id || `${msg.userId}-${msg.timestamp}`}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        isOwnMessage ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1">
                        {isOwnMessage ? 'You' : senderName}
                      </p>
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="flex px-4 py-2 gap-2 border-t border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
              disabled={!isConnected}
            />
            <button
              type="submit"
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConnected || !newMessage.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default TaskChat;