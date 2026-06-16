import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Copy, Check } from 'lucide-react';
import { createTeam, joinTeam, leaveTeam, getUserTeam } from '../utils/api';

function TeamManagement({ setCurrentPage }) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [view, setView] = useState('loading'); // Start with 'loading' to avoid flicker
  const [teamCode, setTeamCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [currentTeam, setCurrentTeam] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Always fetch team on mount — this is the source of truth
  useEffect(() => {
    fetchUserTeam();
  }, []);

  // Only sync URL after we know the real view
  useEffect(() => {
    if (view === 'loading') return;
    if (view === 'selection' || view === 'team') {
      setSearchParams({});
    } else {
      setSearchParams({ action: view });
    }
  }, [view, setSearchParams]);

  const fetchUserTeam = async () => {
    try {
      const response = await getUserTeam();
      if (response.success && response.team) {
        setCurrentTeam(response.team);
        setView('team'); // User is in a team → show team view
      } else {
        setView('selection'); // No team → show selection
      }
    } catch (err) {
      console.log('No existing team found');
      setView('selection'); // On error, fall back to selection
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await createTeam(teamName);
      if (response.success) {
        setCurrentTeam(response.team);
        setView('team');
      }
    } catch (err) {
      setError(err.message || 'Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!teamCode.trim()) {
      setError('Please enter a team code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await joinTeam(teamCode);
      if (response.success) {
        setCurrentTeam(response.team);
        setView('team');
      }
    } catch (err) {
      setError(err.message || 'Failed to join team. Invalid code?');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentTeam?.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await leaveTeam(currentTeam._id);
      if (response.success) {
        setCurrentTeam(null);
        setTeamCode('');
        setTeamName('');
        setView('selection'); // Back to selection after leaving
      }
    } catch (err) {
      setError(err.message || 'Failed to leave team');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading state (prevents flickering to wrong view) ──
  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading your team...</p>
      </div>
    );
  }

  // ── Selection view ──
  if (view === 'selection') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Team Management</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Create Team</h2>
              <p className="text-gray-600 mb-6">Start a new team and invite others using a team code</p>
              <button
                onClick={() => setView('create')}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 w-full"
              >
                Create New Team
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Join Team</h2>
              <p className="text-gray-600 mb-6">Join an existing team using the code from your team leader</p>
              <button
                onClick={() => setView('join')}
                className="px-6 py-3 bg-white text-gray-800 border-2 border-gray-800 rounded-lg hover:bg-gray-100 w-full"
              >
                Join Existing Team
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Create team view ──
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Team</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleCreateTeam}
                className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Team'}
              </button>
              <button
                onClick={() => { setView('selection'); setError(''); }}
                className="w-full py-3 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100"
                disabled={isLoading}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Join team view ──
  if (view === 'join') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Join Team</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Code</label>
                <input
                  type="text"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800 uppercase"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500 mt-2">Ask your team leader for the team code</p>
              </div>
              <button
                onClick={handleJoinTeam}
                className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Joining...' : 'Join Team'}
              </button>
              <button
                onClick={() => { setView('selection'); setError(''); }}
                className="w-full py-3 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100"
                disabled={isLoading}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Team dashboard view ──
  if (view === 'team' && currentTeam) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{currentTeam.name}</h1>
                <p className="text-gray-600 mt-1">Team Code: {currentTeam.code}</p>
              </div>
              <button
                onClick={handleLeaveTeam}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Leaving...' : 'Leave Team'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Team Code</h2>
            <p className="text-gray-600 mb-3">Share this code with others to invite them</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-center">
                <span className="text-2xl font-bold text-gray-800 tracking-widest">
                  {currentTeam.code}
                </span>
              </div>
              <button
                onClick={copyToClipboard}
                className="px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Team Members ({currentTeam.members?.length || 0})
            </h2>
            <div className="space-y-3">
              {currentTeam.members?.map((member, index) => (
                <div key={member._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center text-lg font-bold">
                      {member.name?.charAt(0).toUpperCase() || 'M'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{member.name || 'Member'}</p>
                      <p className="text-sm text-gray-600">{member.email || ''}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    member._id === (currentTeam.leaderId?._id || currentTeam.leaderId)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {member._id === currentTeam.leaderId ? 'Leader' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
}

export default TeamManagement;