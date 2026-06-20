import { useState } from 'react';
import { Mail, Lock, User, Github } from 'lucide-react';
import { signup, googleAuth } from '../utils/api';
import { signInWithGoogle } from '../utils/firebase';

// Signup component with backend integration + Google Auth
function Signup({ setCurrentPage, onLogin }) {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    githubUsername: ''
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle form submission with API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    // Domain restriction for students
    if (formData.role === 'student' && !formData.email.endsWith('@mnnit.ac.in')) {
      setError('Only MNNIT students can register. Please use your @mnnit.ac.in email.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Call the signup API
      const response = await signup(formData);

      if (response.success) {
        // If onLogin is provided, auto-login after signup
        if (onLogin) {
          onLogin(response.user.role, response.user);
        } else {
          alert('Signup successful! Please login.');
          setCurrentPage('login');
        }
      }
    } catch (err) {
      // Handle error
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-Up
  const handleGoogleSignUp = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      // Step 1: Sign in with Google via Firebase
      const googleResult = await signInWithGoogle(formData.role);

      // Step 2: Send the Firebase token to our backend with the selected role
      const response = await googleAuth(googleResult.idToken, formData.role);

      if (response.success) {
        if (onLogin) {
          onLogin(response.user.role, response.user);
        } else {
          alert('Account created successfully!');
          setCurrentPage('login');
        }
      }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
        setError('Firebase is not configured yet. Please set up your Firebase project credentials.');
        return;
      }
      setError(err.message || 'Google sign-up failed. Please try again.');
      console.error('Google sign-up error:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4 py-12 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 p-8 transition-colors">

        {/* Header */}
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Create Account</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Join the MentorConnect community</p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        {/* Role Selection - shown first so Google signup knows the role */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            I am a
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800 dark:focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors"
            disabled={isLoading}
          >
            <option value="student">Student</option>
            <option value="mentor">Alumni / Mentor</option>
          </select>
        </div>

        {/* Google Sign-Up Button */}
        <button
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4"
        >
          {isGoogleLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {isGoogleLoading ? 'Signing up...' : `Sign up with Google as ${formData.role === 'student' ? 'Student' : 'Mentor'}`}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or sign up with email</span>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800 dark:focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              College Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800 dark:focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors"
                placeholder="student@college.edu"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* GitHub Username (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GitHub Username (Optional)
            </label>
            <div className="relative">
              <Github className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                name="githubUsername"
                value={formData.githubUsername}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800 dark:focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors"
                placeholder="yourusername"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800 dark:focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800 dark:focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button
            onClick={() => setCurrentPage('login')}
            className="text-gray-800 dark:text-gray-200 font-medium hover:underline"
            disabled={isLoading}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;