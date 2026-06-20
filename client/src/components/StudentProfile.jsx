import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Github, Linkedin, Award, Edit2, Star, Trophy, TrendingUp, Clock, ThumbsUp, MessageSquare } from 'lucide-react';
import { getStudentProfile, updateStudentProfile, getBadges, getStudentPointsBreakdown, getTopPosts } from '../utils/api';

// Student Profile Component with backend integration
function StudentProfile({ setCurrentPage, userData }) {
  const navigate = useNavigate();
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [badges, setBadges] = useState([]);
  const [pointsData, setPointsData] = useState({ totalPoints: 0, rank: 0, breakdown: [] });
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    profilePicture: '',
    bio: '',
    skills: [],
    education: '',
    githubUrl: '',
    linkedinUrl: '',
    newSkill: '',
    topPosts: [],
    stats: {
      tasksCompleted: 0,
      tasksActive: 0,
      badgesEarned: 0
    }
  });

  // Fetch badges
  const fetchBadges = async () => {
    try {
      const response = await getBadges();
      if (response.success) {
        setBadges(response.badges || []);
      }
    } catch (err) {
      console.error('Failed to load badges:', err);
      setBadges([]);
    }
  };

  // Fetch points breakdown
  const fetchPoints = async () => {
    try {
      const response = await getStudentPointsBreakdown();
      if (response.success) {
        setPointsData({
          totalPoints: response.totalPoints || 0,
          rank: response.rank || 0,
          breakdown: response.breakdown || []
        });
      }
    } catch (err) {
      console.error('Failed to load points:', err);
    }
  };

  // Fetch profile and badges on mount
  useEffect(() => {
    fetchProfile();
    fetchBadges();
    fetchPoints();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getStudentProfile();
      if (response.success) {
        setProfileData({
          name: response.user.name || '',
          email: response.user.email || '',
          profilePicture: response.user.profilePicture || '',
          bio: response.user.bio || '',
          skills: response.user.skills || [],
          education: response.user.education || '',
          githubUrl: response.user.githubUrl || '',
          linkedinUrl: response.user.linkedinUrl || '',
          newSkill: '',
          stats: response.stats || { tasksCompleted: 0, tasksActive: 0, badgesEarned: 0 },
          topPosts: []
        });
        
        // Fetch top posts
        if (response.user && response.user._id) {
          const postsRes = await getTopPosts(response.user._id);
          if (postsRes.success) {
            setProfileData(prev => ({
              ...prev,
              topPosts: postsRes.posts || []
            }));
          }
        }
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };
  // Handle file selection
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({
          ...profileData,
          profilePicture: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };
  // Add new skill
  const handleAddSkill = () => {
    if (profileData.newSkill.trim()) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, profileData.newSkill.trim()],
        newSkill: ''
      });
    }
  };

  // Remove skill
  const handleRemoveSkill = (skillToRemove) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  // Save profile with API call
  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await updateStudentProfile(profileData);
      
      if (response.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        // Update local state with response data
        setProfileData({
          ...profileData,
          ...response.user
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPointsPercentage = (earned, max) => {
    if (!max) return 0;
    return Math.min(100, Math.round((earned / max) * 100));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            disabled={isSaving}
          >
            <Edit2 size={18} />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Left Column - Basic Info */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/30 p-6 transition-colors">
              <div className="text-center">
                {/* Profile initial circle or picture */}
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture} 
                    alt={profileData.name} 
                    className="w-24 h-24 mx-auto rounded-full object-cover mb-4 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto bg-gray-800 dark:bg-gray-700 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-md transition-colors">
                    {profileData.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {isEditing ? (
                  <div className="space-y-2 mb-4">
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleChange}
                      className="text-xl font-bold text-gray-800 dark:text-gray-100 w-full text-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-800 dark:focus:border-gray-400 bg-white dark:bg-gray-700 transition-colors"
                      disabled={isSaving}
                      placeholder="Your Name"
                    />
                    <div className="flex flex-col items-center gap-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Picture</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="text-sm text-gray-800 dark:text-gray-100 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                ) : (
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{profileData.name}</h2>
                )}
                
                <div className="flex items-center justify-center gap-2 mt-2 text-gray-600 dark:text-gray-300">
                  <Mail size={16} />
                  <span className="text-sm">{profileData.email}</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Github size={18} className="text-gray-600 dark:text-gray-300" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="githubUrl"
                      value={profileData.githubUrl}
                      onChange={handleChange}
                      className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                      placeholder="GitHub URL"
                      disabled={isSaving}
                    />
                  ) : (
                    <a href={profileData.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {profileData.githubUrl ? 'GitHub Profile' : 'Add GitHub'}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Linkedin size={18} className="text-gray-600 dark:text-gray-300" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="linkedinUrl"
                      value={profileData.linkedinUrl}
                      onChange={handleChange}
                      className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                      placeholder="LinkedIn URL"
                      disabled={isSaving}
                    />
                  ) : (
                    <a href={profileData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {profileData.linkedinUrl ? 'LinkedIn Profile' : 'Add LinkedIn'}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Points & Rank Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="text-yellow-500" size={22} />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Points & Rank</h3>
              </div>
              
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2">
                  <Star size={24} className="text-yellow-500" />
                  <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{pointsData.totalPoints}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Total Points Earned</p>
              </div>
              
              {pointsData.rank > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 mb-4 text-center">
                  <p className="text-xs text-yellow-800 uppercase font-semibold">Current Rank</p>
                  <p className="text-2xl font-bold text-yellow-700 mt-1">#{pointsData.rank}</p>
                </div>
              )}
              
              {/* Points Milestones */}
              <div className="space-y-2">
                {[100, 250, 500, 1000].map(milestone => (
                  <div key={milestone}>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                      <span>{milestone} pts milestone</span>
                      <span>{Math.min(100, Math.round((pointsData.totalPoints / milestone) * 100))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          pointsData.totalPoints >= milestone ? 'bg-yellow-500' : 'bg-yellow-300'
                        }`}
                        style={{ width: `${Math.min(100, (pointsData.totalPoints / milestone) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">My Impact</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profileData.stats?.tasksCompleted || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Tasks Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profileData.stats?.tasksActive || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Active Tasks</p>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="text-gray-600 dark:text-gray-300" size={20} />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Badges</h3>
              </div>
              
              <div className="space-y-3">
                {badges.length > 0 ? (
                  badges.map(badge => (
                    <div key={badge._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-2xl">{badge.icon || '🏆'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{badge.name}</p>
                        <p className="text-xs text-gray-500">{badge.description || ''}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No badges earned yet. Keep completing tasks!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Bio */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">About Me</h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:border-gray-800"
                  placeholder="Tell us about yourself..."
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">{profileData.bio || 'No bio added yet'}</p>
              )}
            </div>

            {/* Education */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Education</h3>
              {isEditing ? (
                <input
                  type="text"
                  name="education"
                  value={profileData.education}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:border-gray-800"
                  placeholder="Your education background"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">{profileData.education || 'No education info added'}</p>
              )}
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 dark:text-gray-100 rounded-full text-sm flex items-center gap-2">
                    {skill}
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-red-600 hover:text-red-800"
                        disabled={isSaving}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {profileData.skills.length === 0 && !isEditing && (
                  <span className="text-gray-500 text-sm">No skills added yet</span>
                )}
              </div>

              {isEditing && (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    name="newSkill"
                    value={profileData.newSkill}
                    onChange={handleChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-800"
                    placeholder="Add a skill"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    disabled={isSaving}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Contribution Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-gray-600 dark:text-gray-300" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Contribution Timeline</h3>
              </div>
              
              {pointsData.breakdown.length > 0 ? (
                <div className="space-y-4">
                  {pointsData.breakdown.map((entry, idx) => (
                    <div key={idx} className="flex gap-4">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          idx === 0 ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        {idx < pointsData.breakdown.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1"></div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">{entry.taskTitle}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(entry.difficulty)}`}>
                                {entry.difficulty}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={12} />
                                {entry.reviewedAt ? new Date(entry.reviewedAt).toLocaleDateString() : 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1">
                              <Star size={14} className="text-yellow-500" />
                              {entry.earnedPoints}/{entry.maxPoints}
                            </span>
                          </div>
                        </div>
                        
                        {/* Score bar */}
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                getPointsPercentage(entry.earnedPoints, entry.maxPoints) >= 80 ? 'bg-green-500'
                                : getPointsPercentage(entry.earnedPoints, entry.maxPoints) >= 50 ? 'bg-yellow-500'
                                : 'bg-red-400'
                              }`}
                              style={{ width: `${getPointsPercentage(entry.earnedPoints, entry.maxPoints)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {entry.feedback && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
                            <span className="font-semibold">Mentor Feedback:</span> {entry.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No contributions yet</p>
                  <p className="text-sm text-gray-400 mt-1">Complete tasks to see your contribution timeline</p>
                </div>
              )}
            </div>

            {/* Save Button */}
            {isEditing && (
              <button
                onClick={handleSave}
                className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}

            {/* Top Posts Section */}
            {profileData.topPosts?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">My Top Posts</h3>
                <div className="space-y-4">
                  {profileData.topPosts.map(post => (
                    <div 
                      key={post._id} 
                      onClick={() => navigate(`/post/${post._id}`)}
                      className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                          {post.category}
                        </span>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <ThumbsUp size={14} /> {post.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={14} /> {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">{post.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;