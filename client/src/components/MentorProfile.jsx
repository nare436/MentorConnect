import { useState, useEffect } from 'react';
import { Mail, Briefcase, Building, Edit2 } from 'lucide-react';
import { getMentorProfile, updateMentorProfile } from '../utils/api';

// Mentor Profile Component with backend integration
function MentorProfile({ setCurrentPage, userData }) {
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    company: '',
    jobRole: '',
    expertise: [],
    yearsOfExperience: '',
    newExpertise: '',
    stats: {
      totalTasks: 0,
      teamsmentored: 0,
      studentsHelped: 0
    }
  });

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
          bio: response.user.bio || '',
          company: response.user.company || '',
          jobRole: response.user.jobRole || '',
          expertise: response.user.expertise || [],
          yearsOfExperience: response.user.yearsOfExperience || '',
          newExpertise: '',
          stats: response.stats || { totalTasks: 0, teamsmentored: 0, studentsHelped: 0 }
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

              {/* Professional Info */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Building size={18} className="text-gray-600" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="company"
                      value={profileData.company}
                      onChange={handleChange}
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                      placeholder="Company"
                      disabled={isSaving}
                    />
                  ) : (
                    <span className="text-sm text-gray-700">
                      {profileData.company || 'Add Company'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-gray-600" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="jobRole"
                      value={profileData.jobRole}
                      onChange={handleChange}
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                      placeholder="Role"
                      disabled={isSaving}
                    />
                  ) : (
                    <span className="text-sm text-gray-700">
                      {profileData.jobRole || 'Add Job Role'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mentoring Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Mentoring Impact</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{profileData.stats?.totalTasks || 0}</p>
                  <p className="text-sm text-gray-600">Tasks Created</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{profileData.stats?.teamsmentored || 0}</p>
                  <p className="text-sm text-gray-600">Teams Mentored</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{profileData.stats?.studentsHelped || 0}</p>
                  <p className="text-sm text-gray-600">Students Helped</p>
                </div>
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
                  placeholder="Tell us about your experience and expertise..."
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-600">{profileData.bio || 'No bio added yet'}</p>
              )}
            </div>

            {/* Experience */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Years of Experience</h3>
              {isEditing ? (
                <input
                  type="text"
                  name="yearsOfExperience"
                  value={profileData.yearsOfExperience}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-gray-800"
                  placeholder="e.g., 10+ years"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-600">
                  {profileData.yearsOfExperience ? `${profileData.yearsOfExperience} years` : 'No experience info added'}
                </p>
              )}
            </div>

            {/* Expertise */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Areas of Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.expertise.map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2">
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
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-800"
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default MentorProfile;