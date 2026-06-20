import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Briefcase, Building, Edit2, ThumbsUp, MessageSquare, Calendar } from 'lucide-react';
import { getMentorProfile, updateMentorProfile, getTopPosts } from '../utils/api';
import FollowListModal from './FollowListModal';

const PLATFORMS = [
  'LeetCode', 'Codeforces', 'GeeksForGeeks', 'TakeUForward', 'CodeChef', 'HackerRank',
  'Instagram', 'Twitter', 'Facebook'
];

// Mentor Profile Component with backend integration
function MentorProfile({ setCurrentPage, userData }) {
  const navigate = useNavigate();
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    profilePicture: '',
    bio: '',
    company: '',
    jobRole: '',
    expertise: [],
    yearsOfExperience: '',
    newExpertise: '',
    topPosts: [],
    followers: [],
    following: [],
    followersCount: 0,
    followingCount: 0,
    socialLinks: [],
    createdAt: null,
    stats: {
      totalTasks: 0,
      teamsmentored: 0,
      studentsHelped: 0
    }
  });

  const [newLink, setNewLink] = useState({ platform: PLATFORMS[0], url: '' });

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getMentorProfile();
      if (response.success) {
        setProfileData({
          name: response.user.name || '',
          email: response.user.email || '',
          profilePicture: response.user.profilePicture || '',
          bio: response.user.bio || '',
          company: response.user.company || '',
          jobRole: response.user.jobRole || '',
          expertise: response.user.expertise || [],
          yearsOfExperience: response.user.yearsOfExperience || '',
          newExpertise: '',
          stats: response.stats || { totalTasks: 0, teamsmentored: 0, studentsHelped: 0 },
          topPosts: [],
          followers: response.user.followers || [],
          following: response.user.following || [],
          followersCount: response.user.followers?.length || 0,
          followingCount: response.user.following?.length || 0,
          socialLinks: response.user.socialLinks || [],
          createdAt: response.user.createdAt
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

  // Add new expertise
  const handleAddExpertise = () => {
    if (profileData.newExpertise.trim()) {
      setProfileData({
        ...profileData,
        expertise: [...profileData.expertise, profileData.newExpertise.trim()],
        newExpertise: ''
      });
    }
  };

  // Remove expertise
  const handleRemoveExpertise = (itemToRemove) => {
    setProfileData({
      ...profileData,
      expertise: profileData.expertise.filter(item => item !== itemToRemove)
    });
  };

  // Add social link
  const handleAddSocialLink = () => {
    const url = newLink.url.trim();
    if (!url) return;
    
    // Check if platform already exists
    const existingLinks = profileData.socialLinks || [];
    if (existingLinks.some(link => link.platform === newLink.platform)) {
      setError(`You have already added a link for ${newLink.platform}.`);
      return;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\w\d-]+\.)+[\w\d]{2,}(\/.*)?$/i;
    
    if (!urlPattern.test(url)) {
      setError(`Please enter a valid URL for ${newLink.platform}.`);
      return;
    }

    // Format URL
    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    setProfileData({
      ...profileData,
      socialLinks: [...existingLinks, { platform: newLink.platform, url: finalUrl }]
    });
    setNewLink({ platform: PLATFORMS[0], url: '' });
    setError('');
  };

  // Remove social link
  const handleRemoveSocialLink = (index) => {
    const updatedLinks = [...(profileData.socialLinks || [])];
    updatedLinks.splice(index, 1);
    setProfileData({ ...profileData, socialLinks: updatedLinks });
  };

  // Save profile with API call
  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await updateMentorProfile(profileData);
      
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Loading profile...</div>
      </div>
    );
  }

  const calculateExperience = (createdAt) => {
    if (!createdAt) return 'New Member';
    const start = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} months`;
    const diffYears = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    return `${diffYears} yr${diffYears > 1 ? 's' : ''} ${remainingMonths > 0 ? remainingMonths + ' mo' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <FollowListModal 
        isOpen={showFollowersModal} 
        onClose={() => setShowFollowersModal(false)} 
        title="Followers" 
        users={profileData.followers || []} 
      />
      <FollowListModal 
        isOpen={showFollowingModal} 
        onClose={() => setShowFollowingModal(false)} 
        title="Following" 
        users={profileData.following || []} 
      />

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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="text-center">
                {/* Profile initial circle or picture */}
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture} 
                    alt={profileData.name} 
                    className="w-24 h-24 mx-auto rounded-full object-cover mb-4 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto bg-gray-800 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
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
                
                {profileData.createdAt && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-2 rounded-lg border border-gray-100 dark:border-gray-700">
                    <Calendar size={14} />
                    <span className="text-xs font-medium">Joined {new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{calculateExperience(profileData.createdAt)} exp</span>
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div 
                    className="text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                    onClick={() => setShowFollowersModal(true)}
                  >
                    <div className="font-bold text-gray-800 dark:text-gray-100">{profileData.followersCount || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Followers</div>
                  </div>
                  <div 
                    className="text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                    onClick={() => setShowFollowingModal(true)}
                  >
                    <div className="font-bold text-gray-800 dark:text-gray-100">{profileData.followingCount || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Following</div>
                  </div>
                </div>

                {/* Additional Social/Coding Links */}
                {isEditing ? (
                  <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 text-left">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Social & Links</p>
                    <div className="space-y-2 mb-3">
                      {(profileData.socialLinks || []).map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{link.platform}:</span>
                          <span className="flex-1 text-gray-600 dark:text-gray-400 truncate">{link.url}</span>
                          <button onClick={() => handleRemoveSocialLink(idx)} className="text-red-500 hover:text-red-700" disabled={isSaving}>×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={newLink.platform} 
                        onChange={e => setNewLink({...newLink, platform: e.target.value})}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none"
                        disabled={isSaving}
                      >
                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input
                        type="text"
                        value={newLink.url}
                        onChange={e => setNewLink({...newLink, url: e.target.value})}
                        className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200 focus:outline-none"
                        placeholder="URL..."
                        disabled={isSaving}
                        onKeyPress={e => e.key === 'Enter' && handleAddSocialLink()}
                      />
                      <button onClick={handleAddSocialLink} disabled={isSaving} className="bg-gray-800 dark:bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">Add</button>
                    </div>
                  </div>
                ) : (
                  (profileData.socialLinks || []).length > 0 && (
                    <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2 text-left">
                      {(profileData.socialLinks || []).map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 truncate">{link.platform}</span>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate flex-1">
                            {link.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Professional Info */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Building size={18} className="text-gray-600 dark:text-gray-300" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="company"
                      value={profileData.company}
                      onChange={handleChange}
                      className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                      placeholder="Company"
                      disabled={isSaving}
                    />
                  ) : (
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {profileData.company || 'Add Company'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-gray-600 dark:text-gray-300" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="jobRole"
                      value={profileData.jobRole}
                      onChange={handleChange}
                      className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                      placeholder="Role"
                      disabled={isSaving}
                    />
                  ) : (
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {profileData.jobRole || 'Add Job Role'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mentoring Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Mentoring Impact</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profileData.stats?.totalTasks || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Tasks Created</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profileData.stats?.teamsmentored || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Teams Mentored</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profileData.stats?.studentsHelped || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Students Helped</p>
                </div>
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
                  placeholder="Tell us about your experience and expertise..."
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">{profileData.bio || 'No bio added yet'}</p>
              )}
            </div>

            {/* Experience */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Years of Experience</h3>
              {isEditing ? (
                <input
                  type="text"
                  name="yearsOfExperience"
                  value={profileData.yearsOfExperience}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:border-gray-800"
                  placeholder="e.g., 10+ years"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  {profileData.yearsOfExperience ? `${profileData.yearsOfExperience} years` : 'No experience info added'}
                </p>
              )}
            </div>

            {/* Expertise */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Areas of Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.expertise.map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 dark:text-gray-100 rounded-full text-sm flex items-center gap-2">
                    {item}
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveExpertise(item)}
                        className="text-red-600 hover:text-red-800"
                        disabled={isSaving}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {profileData.expertise.length === 0 && !isEditing && (
                  <span className="text-gray-500 text-sm">No expertise areas added yet</span>
                )}
              </div>

              {isEditing && (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    name="newExpertise"
                    value={profileData.newExpertise}
                    onChange={handleChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddExpertise()}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-800"
                    placeholder="Add expertise area (e.g., Web Development, Cloud Architecture)"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleAddExpertise}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    disabled={isSaving}
                  >
                    Add
                  </button>
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

export default MentorProfile;