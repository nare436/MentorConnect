import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Github, Linkedin, Award, Users, CheckCircle, Clock, ThumbsUp, MessageSquare, UserPlus, UserMinus, Calendar } from 'lucide-react';
import { getPublicProfile, getTopPosts, toggleFollow } from '../utils/api';
import FollowListModal from './FollowListModal';

function PublicProfile({ userData }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [topPosts, setTopPosts] = useState([]);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

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
        setFollowersCount(response.user.followers?.length || 0);
        setFollowingCount(response.user.following?.length || 0);
        if (userData?.id) {
          setIsFollowing(response.user.followers?.some(f => f._id === userData.id));
        }
      }
      const postsResponse = await getTopPosts(id);
      if (postsResponse.success) {
        setTopPosts(postsResponse.posts || []);
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
  const isOwnProfile = userData?.id === user._id;

  const handleFollowToggle = async () => {
    try {
      // Optimistic update
      setIsFollowing(!isFollowing);
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
      
      const response = await toggleFollow(user._id);
      if (response.success) {
        setIsFollowing(response.isFollowing);
        setFollowersCount(response.followersCount);
        setFollowingCount(response.followingCount);
      }
    } catch (err) {
      // Revert on failure
      setIsFollowing(!isFollowing);
      setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
      console.error('Follow toggle error:', err);
    }
  };

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <FollowListModal 
        isOpen={showFollowersModal} 
        onClose={() => setShowFollowersModal(false)} 
        title="Followers" 
        users={user.followers || []} 
      />
      <FollowListModal 
        isOpen={showFollowingModal} 
        onClose={() => setShowFollowingModal(false)} 
        title="Following" 
        users={user.following || []} 
      />

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
                
                <div className="flex items-center justify-center gap-2 mt-3 text-gray-500 bg-gray-50 py-2 rounded-lg border border-gray-100">
                  <Calendar size={14} />
                  <span className="text-xs font-medium">Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="text-xs text-indigo-600 font-semibold">{calculateExperience(user.createdAt)} exp</span>
                </div>
                
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div 
                    className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => setShowFollowersModal(true)}
                  >
                    <div className="font-bold text-gray-800">{followersCount}</div>
                    <div className="text-xs text-gray-500 uppercase">Followers</div>
                  </div>
                  <div 
                    className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => setShowFollowingModal(true)}
                  >
                    <div className="font-bold text-gray-800">{followingCount}</div>
                    <div className="text-xs text-gray-500 uppercase">Following</div>
                  </div>
                </div>

                {!isOwnProfile && userData && (
                  <button
                    onClick={handleFollowToggle}
                    className={`mt-4 w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium ${
                      isFollowing 
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus size={18} />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Follow
                      </>
                    )}
                  </button>
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
            
            {/* Top Posts Section */}
            {topPosts.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Top Posts</h3>
                <div className="space-y-4">
                  {topPosts.map(post => (
                    <div 
                      key={post._id} 
                      onClick={() => navigate(`/post/${post._id}`)}
                      className="border border-gray-100 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {post.category}
                        </span>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <ThumbsUp size={14} /> {post.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={14} /> {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-3">{post.content}</p>
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

export default PublicProfile;
