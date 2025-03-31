'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, facebookProvider } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        if (!username) {
          setError('Username is required')
          return
        }
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(user, { displayName: username })
        
        // Store user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          username: username,
          usernameLower: username.toLowerCase(),
          displayName: username,
          createdAt: new Date(),
          friends: [],
          rooms: []
        })
      }
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError('')

    try {
      const authProvider = provider === 'google' ? googleProvider : facebookProvider
      await signInWithPopup(auth, authProvider)
      router.push('/dashboard')
    } catch (error) {
      setError(`Failed to sign in with ${provider}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#0A0A0F] overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(124,58,237,0.1),rgba(219,39,119,0.1))]" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F59E0B] opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#F59E0B] via-[#DB2777] to-[#7C3AED] opacity-50" />
        
        {/* Animated Circles */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#7C3AED] opacity-[0.15] blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#DB2777] opacity-[0.15] blur-[100px] animate-pulse-slow" style={{ animationDelay: '-2s' }} />
      </div>

      {/* Content */}
      <div className="w-full max-w-lg relative z-10 p-6">
        {/* Logo Section */}
        <div className="text-center mb-12 transform hover:scale-105 transition-transform duration-500">
          <h1 className="text-7xl font-black mb-4 bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F59E0B] text-transparent bg-clip-text">
            KALMNY
          </h1>
          <p className="text-xl text-white/60">Join the party. Connect instantly.</p>
        </div>

        {/* Main Card */}
        <div className="relative group">
          {/* Gradient Border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F59E0B] rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-500" />
          
          {/* Card Content */}
          <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8">
            {/* Auth Tabs */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-4 text-lg font-bold rounded-xl transition-all duration-300 ${
                  isLogin
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-4 text-lg font-bold rounded-xl transition-all duration-300 ${
                  !isLogin
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                JOIN NOW
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Input - Only show when signing up */}
              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-medium mb-2 text-white/60 uppercase tracking-wide">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-6 py-4
                             focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/25
                             transition-all duration-300 placeholder:text-white/20"
                    placeholder="Choose a username"
                    required={!isLogin}
                    minLength={3}
                    maxLength={20}
                  />
                </div>
              )}

              {/* Email Input */}
              <div className="group">
                <label className="block text-sm font-medium mb-2 text-white/60 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-6 py-4
                           focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/25
                           transition-all duration-300 placeholder:text-white/20"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="group">
                <label className="block text-sm font-medium mb-2 text-white/60 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-6 py-4
                           focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/25
                           transition-all duration-300 placeholder:text-white/20"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold text-lg uppercase
                         bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F59E0B]
                         hover:opacity-90 transform hover:-translate-y-0.5
                         transition-all duration-300 text-white shadow-lg shadow-purple-500/25"
              >
                {isLogin ? 'Enter the Party' : 'Create Account'}
              </button>

              {/* Social Login Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="relative px-4 text-white/40 tracking-wider z-10" style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(24px)' }}>or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-3 py-4 rounded-xl
                           bg-white/5 hover:bg-white/10 border border-white/10
                           text-white font-medium transition-all duration-300"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  className="flex items-center justify-center gap-3 py-4 rounded-xl
                           bg-white/5 hover:bg-white/10 border border-white/10
                           text-white font-medium transition-all duration-300"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </form>

            {/* Terms */}
            <p className="mt-8 text-center text-sm text-white/40">
              By continuing, you agree to our{' '}
              <a href="#" className="text-[#7C3AED] hover:text-[#DB2777] transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#7C3AED] hover:text-[#DB2777] transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 