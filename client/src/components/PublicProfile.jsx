import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Github, Linkedin, Award, Users, CheckCircle, Clock } from 'lucide-react';
import { getPublicProfile } from '../utils/api';

function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getPublicProfile(id);
      if (response.success) {
        setProfileData(response);
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-600 mb-4">{error || 'Profile not found'}</div>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const { user, stats } = profileData;
  const isMentor = user.role === 'mentor';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isMentor ? 'Mentor Profile' : 'Student Profile'}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Back
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-2 text-gray-600">
                  <Mail size={16} />
                  <span className="text-sm">{user.email}</span>
                </div>
                {isMentor && user.company && (
                  <p className="text-sm text-gray-600 mt-2 font-medium">{user.jobRole} at {user.company}</p>
                )}
              </div>

              {/* Social Links */}
              <div className="mt-6 space-y-3">
                {user.githubUrl && (
                  <div className="flex items-center gap-2">
                    <Github size={18} className="text-gray-600" />
                    <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      GitHub Profile
                    </a>
                  </div>
                )}
                {user.linkedinUrl && (
                  <div className="flex items-center gap-2">
                    <Linkedin size={18} className="text-gray-600" />
                    <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Impact</h3>
              <div className="space-y-4">
                {isMentor ? (
                  <>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats?.totalTasks || 0}</p>
                      <p className="text-sm text-gray-600">Tasks Created</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats?.teamsmentored || 0}</p>
                      <p className="text-sm text-gray-600">Teams Mentored</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats?.tasksCompleted || 0}</p>
                      <p className="text-sm text-gray-600">Tasks Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats?.tasksActive || 0}</p>
                      <p className="text-sm text-gray-600">Active Tasks</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">About</h3>
              <p className="text-gray-600">{user.bio || 'No bio available'}</p>
            </div>

            {isMentor ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {user.expertise?.length > 0 ? (
                    user.expertise.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No expertise listed</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills?.length > 0 ? (
                    user.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No skills listed</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;
