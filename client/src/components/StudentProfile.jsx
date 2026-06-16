import { useState, useEffect } from 'react';
import { Mail, Github, Linkedin, Award, Edit2 } from 'lucide-react';
import { getStudentProfile, updateStudentProfile, getBadges } from '../utils/api';

// Student Profile Component with backend integration
function StudentProfile({ setCurrentPage, userData }) {
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [badges, setBadges] = useState([]);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    skills: [],
    education: '',
    githubUrl: '',
    linkedinUrl: '',
    newSkill: '',
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

  // Fetch profile and badges on mount
  useEffect(() => {
    fetchProfile();
    fetchBadges();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getStudentProfile();
      if (response.success) {
        setProfileData({
          name: response.user.name || '',
          email: response.user.email || '',
          bio: response.user.bio || '',
          skills: response.user.skills || [],
          education: response.user.education || '',
          githubUrl: response.user.githubUrl || '',
          linkedinUrl: response.user.linkedinUrl || '',
          newSkill: '',
          stats: response.stats || { tasksCompleted: 0, tasksActive: 0, badgesEarned: 0 }
        });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
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
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                {/* Profile initial circle */}
                <div className="w-24 h-24 mx-auto bg-gray-800 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                  {profileData.name.charAt(0).toUpperCase()}
                </div>
                
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    className="text-xl font-bold text-gray-800 w-full text-center border border-gray-300 rounded px-2 py-1"
                    disabled={isSaving}
                  />
                ) : (
                  <h2 className="text-xl font-bold text-gray-800">{profileData.name}</h2>
                )}
                
                <div className="flex items-center justify-center gap-2 mt-2 text-gray-600">
                  <Mail size={16} />
                  <span className="text-sm">{profileData.email}</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Github size={18} className="text-gray-600" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="githubUrl"
                      value={profileData.githubUrl}
                      onChange={handleChange}
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
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
                  <Linkedin size={18} className="text-gray-600" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="linkedinUrl"
                      value={profileData.linkedinUrl}
                      onChange={handleChange}
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
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

            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">My Impact</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{profileData.stats?.tasksCompleted || 0}</p>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{profileData.stats?.tasksActive || 0}</p>
                  <p className="text-sm text-gray-600">Active Tasks</p>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="text-gray-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">Badges</h3>
              </div>
              
              <div className="space-y-3">
                {badges.length > 0 ? (
                  badges.map(badge => (
                    <div key={badge._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl">{badge.icon || '🏆'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{badge.name}</p>
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
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">About Me</h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-gray-800"
                  placeholder="Tell us about yourself..."
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-600">{profileData.bio || 'No bio added yet'}</p>
              )}
            </div>

            {/* Education */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Education</h3>
              {isEditing ? (
                <input
                  type="text"
                  name="education"
                  value={profileData.education}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-gray-800"
                  placeholder="Your education background"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-600">{profileData.education || 'No education info added'}</p>
              )}
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2">
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
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-800"
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;