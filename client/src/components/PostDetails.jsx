import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Clock, ArrowLeft, Send, Trash2 } from 'lucide-react';
import { getPostById, likePost, commentOnPost, deleteCommunityPost, deleteComment as apiDeleteComment } from '../utils/api';

export default function PostDetails({ userData }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const response = await getPostById(id);
      if (response.success) {
        setPost(response.post);
      } else {
        setError(response.error || 'Failed to fetch post');
      }
    } catch (err) {
      console.error('Failed to fetch post', err);
      setError('Failed to fetch post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await likePost(post._id);
      if (response.success) {
        setPost({ ...post, likes: response.likes });
      }
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const response = await commentOnPost(post._id, commentText);
      if (response.success) {
        setPost(response.post);
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to comment', err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const response = await deleteCommunityPost(post._id);
      if (response.success) {
        navigate('/community');
      }
    } catch (err) {
      console.error('Failed to delete post', err);
      alert('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const response = await apiDeleteComment(post._id, commentId);
      if (response.success) {
        setPost(response.post);
      }
    } catch (err) {
      console.error('Failed to delete comment', err);
      alert('Failed to delete comment');
    }
  };

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
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 dark:border-gray-300 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">{error || 'Post not found'}</div>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const isLiked = userData?.id && post.likes?.includes(userData.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Post Details</h1>
        </div>

        {/* Post Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/30 overflow-hidden transition-colors">
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
            <div className="flex items-center gap-3">
              {userData?.id === post.authorId?._id && (
                <button 
                  onClick={handleDeletePost}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete Post"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
                {post.category}
              </span>
            </div>
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
              onClick={handleLike}
              className={`flex items-center gap-2 font-medium transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
              <span>{post.likes?.length || 0}</span>
            </button>
            
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <MessageSquare size={20} />
              <span>{post.comments?.length || 0}</span>
            </div>
          </div>

          {/* Comments Section */}
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
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <button 
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="p-1.5 text-blue-600 disabled:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

            {/* Comment List */}
            <div className="space-y-4">
              {post.comments?.length > 0 ? (
                post.comments.map((comment, idx) => (
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
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
                          {(userData?.id === comment.userId?._id || userData?.id === post.authorId?._id) && (
                            <button 
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete Comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 text-sm py-4">
                  No comments yet. Be the first to share your thoughts!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
