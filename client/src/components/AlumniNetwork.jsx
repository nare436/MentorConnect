import { useState, useEffect, useRef } from 'react';
import { Search, Users, MessageCircle, Send, X, Briefcase, Star, BookOpen, ExternalLink, ArrowLeft } from 'lucide-react';
import { getAlumniDirectory, sendAlumniMessage, getAlumniMessages, getAlumniConversations } from '../utils/api';

function AlumniNetwork({ setCurrentPage, userData }) {
  const [alumni, setAlumni] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('directory'); // directory, chat
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchAlumni();
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAlumni = async (query = '') => {
    try {
      setIsLoading(true);
      const response = await getAlumniDirectory(query);
      if (response.success) {
        setAlumni(response.alumni || []);
      }
    } catch (err) {
      setError('Failed to load alumni directory');
      console.error('Alumni error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await getAlumniConversations();
      if (response.success) {
        setConversations(response.conversations || []);
      }
    } catch (err) {
      console.error('Conversations error:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAlumni(searchQuery);
  };

  const openChat = async (alumniUser) => {
    setSelectedAlumni(alumniUser);
    setActiveView('chat');
    setIsLoadingMessages(true);
    try {
      const response = await getAlumniMessages(alumniUser._id);
      if (response.success) {
        setMessages(response.messages || []);
      }
    } catch (err) {
      console.error('Messages error:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedAlumni) return;
    
    setIsSending(true);
    try {
      const response = await sendAlumniMessage(selectedAlumni._id, newMessage.trim());
      if (response.success) {
        setMessages(prev => [...prev, {
          _id: response.data?._id || Date.now(),
          senderId: userData.id,
          receiverId: selectedAlumni._id,
          message: newMessage.trim(),
          createdAt: new Date().toISOString()
        }]);
        setNewMessage('');
        fetchConversations(); // Refresh conversation list
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading && alumni.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alumni network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Alumni Network</h1>
          <p className="text-gray-600">Connect with mentors and alumni, share knowledge, and build relationships</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={18} /></button>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Conversations */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveView('directory')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'directory' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Directory
                </button>
                <button
                  onClick={() => setActiveView('chat')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'chat' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Messages
                </button>
              </div>
            </div>

            {/* Recent Conversations */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Recent Chats</h3>
              {conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map(conv => (
                    <button
                      key={conv.user._id}
                      onClick={() => openChat(conv.user)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedAlumni?._id === conv.user._id ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {conv.user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-800 text-sm truncate">{conv.user.name}</p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{conv.unreadCount}</span>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {conv.lastMessage.isMine ? 'You: ' : ''}{conv.lastMessage.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No conversations yet</p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            
            {/* Directory View */}
            {activeView === 'directory' && (
              <div>
                {/* Search */}
                <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search alumni by name, company, expertise..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                    >
                      Search
                    </button>
                  </div>
                </form>

                {/* Alumni Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {alumni.map(person => (
                    <div key={person._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                          {person.name?.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 text-lg">{person.name}</h3>
                          
                          {(person.jobRole || person.company) && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                              <Briefcase size={14} />
                              <span>{person.jobRole}{person.jobRole && person.company ? ' at ' : ''}{person.company}</span>
                            </div>
                          )}
                          
                          {person.yearsOfExperience && (
                            <p className="text-xs text-gray-500 mt-1">
                              {person.yearsOfExperience} years of experience
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {person.bio && (
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{person.bio}</p>
                      )}
                      
                      {/* Expertise Tags */}
                      {person.expertise && person.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {person.expertise.slice(0, 4).map((exp, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {exp}
                            </span>
                          ))}
                          {person.expertise.length > 4 && (
                            <span className="px-2 py-0.5 text-gray-500 text-xs">+{person.expertise.length - 4}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen size={12} /> {person.taskCount || 0} tasks
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {person.studentsHelped || 0} students
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => openChat(person)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                        >
                          <MessageCircle size={16} />
                          Message
                        </button>
                        <button
                          onClick={() => setCurrentPage(`/profile/${person._id}`)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                        >
                          <ExternalLink size={16} />
                          Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {alumni.length === 0 && !isLoading && (
                  <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No alumni found</p>
                    <p className="text-gray-400 text-sm mt-2">Try a different search term</p>
                  </div>
                )}
              </div>
            )}

            {/* Chat View */}
            {activeView === 'chat' && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '600px' }}>
                {selectedAlumni ? (
                  <div className="flex flex-col h-full">
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <button
                        onClick={() => setSelectedAlumni(null)}
                        className="text-gray-600 hover:text-gray-800 md:hidden"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold">
                        {selectedAlumni.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{selectedAlumni.name}</h3>
                        <p className="text-xs text-gray-500">
                          {selectedAlumni.jobRole}{selectedAlumni.company ? ` at ${selectedAlumni.company}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                      {isLoadingMessages ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">Loading messages...</p>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                          <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-sm">No messages yet</p>
                          <p className="text-xs text-gray-400 mt-1">Start a conversation with {selectedAlumni.name}</p>
                        </div>
                      ) : (
                        messages.map(msg => {
                          const isOwn = msg.senderId === userData?.id || msg.senderId?._id === userData?.id;
                          return (
                            <div
                              key={msg._id}
                              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                                isOwn ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border border-gray-200'
                              }`}>
                                <p className="text-sm">{msg.message}</p>
                                <p className="text-xs mt-1 opacity-60">
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="flex px-4 py-3 gap-2 border-t border-gray-200 bg-white">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800"
                        disabled={isSending}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                        disabled={isSending || !newMessage.trim()}
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-lg font-medium">Select a conversation</p>
                      <p className="text-sm text-gray-400 mt-2">Choose from your recent chats or find someone in the directory</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlumniNetwork;
