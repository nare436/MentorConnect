import React, { useState, useEffect } from 'react';
import { getCommunityPosts, createCommunityPost, likePost, commentOnPost } from '../utils/api';
import { MessageSquare, Heart, Share2, Code, Send, Filter, Clock } from 'lucide-react';

export default function CommunityFeed({ userData }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Post State
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General');
  const [newPostCode, setNewPostCode] = useState('');

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Interactions State
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  
  // Filter
  const [filterCategory, setFilterCategory] = useState('All');
  const categories = ['All', 'General', 'Discussion', 'Job Opportunity', 'Tech News', 'Project Showcase'];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await getCommunityPosts();
      if (response.success) {
        setPosts(response.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setIsLoading(false);
    }
  };



  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostCode.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await createCommunityPost({
        content: newPostContent,
        category: newPostCategory,
        codeSnippet: newPostCode
      });
      
      if (response.success) {
        setPosts([response.post, ...posts]);
        setNewPostContent('');
        setNewPostCategory('General');
        setNewPostCode('');

        setShowCodeInput(false);
      } else {
        alert(response.error || 'Failed to create post.');
      }
    } catch (err) {
      console.error('Failed to create post', err);
      alert(err.message || 'An error occurred while creating the post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await likePost(postId);
      if (response.success) {
        setPosts(posts.map(p => {
          if (p._id === postId) {
            return { ...p, likes: response.likes };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) return;
    
    try {
      const response = await commentOnPost(postId, commentText);
      if (response.success) {
        setPosts(posts.map(p => p._id === postId ? response.post : p));
        setCommentText('');
        setActiveCommentPostId(null);
      }
    } catch (err) {
      console.error('Failed to comment', err);
    }
  };

  const filteredPosts = filterCategory === 'All' 
    ? posts 
    : posts.filter(p => p.category === filterCategory);

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Job Opportunity': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Tech News': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Project Showcase': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Discussion': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Community Feed</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Share updates, discuss tech, and discover opportunities.</p>
        </div>

        {/* Create Post Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/30 p-5 transition-colors">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-xl">
              {userData?.profilePicture ? (
                <img src={userData.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                userData?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind? Share some tech news, jobs, or updates..."
                className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[100px]"
              />
              
              {showCodeInput && (
                <textarea
                  value={newPostCode}
                  onChange={(e) => setNewPostCode(e.target.value)}
                  placeholder="Paste your code snippet here..."
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-mono text-sm rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[150px]"
                />
              )}
              


              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  {/* Category Dropdown */}
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  

                  
                  {/* Code Toggle */}
                  <button 
                    onClick={() => setShowCodeInput(!showCodeInput)}
                    className={`p-2 rounded-full transition-colors ${showCodeInput ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    title="Add Code Snippet"
                  >
                    <Code size={20} />
                  </button>
                </div>
                
                <button
                  onClick={handleCreatePost}
                  disabled={isSubmitting || (!newPostContent.trim() && !newPostCode.trim())}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Send size={16} /> {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter size={18} className="text-gray-500 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat 
                  ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 dark:border-gray-300 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading feed...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Be the first to share something with the community!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map(post => {
              const isLiked = userData?.id && post.likes?.includes(userData.id);
              
              return (
                <div key={post._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/30 overflow-hidden transition-colors">
                  {/* Post Header */}
                  <div className="p-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 shrink-0 overflow-hidden">
                        {post.authorId?.profilePicture ? (
                          <img src={post.authorId.profilePicture} alt={post.authorId.name} className="w-full h-full object-cover" />
                        ) : (
                          post.authorId?.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          {post.authorId?.name || 'Unknown User'}
                          <span className="text-xs font-normal px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full capitalize">
                            {post.authorId?.role || 'user'}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                          {post.authorId?.role === 'mentor' && post.authorId?.jobRole ? `${post.authorId.jobRole} @ ${post.authorId.company || 'Company'}` : post.authorId?.education || ''}
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          <span className="flex items-center gap-1"><Clock size={12}/> {formatTime(post.createdAt)}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                  </div>

                  {/* Post Content */}
                  <div className="px-5 pb-3">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* Code Snippet */}
                  {post.codeSnippet && (
                    <div className="px-5 pb-4">
                      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-gray-800 dark:text-gray-200 font-mono text-sm"><code>{post.codeSnippet}</code></pre>
                      </div>
                    </div>
                  )}



                  {/* Interactions */}
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-6">
                    <button 
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-2 font-medium transition-colors ${
                        isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                      <span>{post.likes?.length || 0}</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveCommentPostId(activeCommentPostId === post._id ? null : post._id)}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
                    >
                      <MessageSquare size={20} />
                      <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {activeCommentPostId === post._id && (
                    <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                      
                      {/* Comment Input */}
                      <div className="flex gap-3 mb-6">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs overflow-hidden">
                          {userData?.profilePicture ? (
                            <img src={userData.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            userData?.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-gray-800 dark:text-gray-100"
                            onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id)}
                          />
                          <button 
                            onClick={() => handleComment(post._id)}
                            disabled={!commentText.trim()}
                            className="p-1.5 text-blue-600 disabled:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Comment List */}
                      <div className="space-y-4">
                        {post.comments?.map((comment, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs overflow-hidden">
                              {comment.userId?.profilePicture ? (
                                <img src={comment.userId.profilePicture} alt={comment.userId.name} className="w-full h-full object-cover" />
                              ) : (
                                comment.userId?.name?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <div className="flex-1 bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{comment.userId?.name || 'User'}</span>
                                <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
