import React, { useState } from 'react';
import { Button } from '../primitives/button';
import { Mail } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
// Logo path - served from Next.js public folder
// SignIn page uses light background, so use light logo
const lyraLogoLight = '/lyra-logo-light.png';

interface SignInProps {
  onSignIn: () => void;
  onGoogleSignIn?: () => void;
  onAppleSignIn?: () => void;
  onEmailSignIn?: (email: string) => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSignIn, onGoogleSignIn, onAppleSignIn, onEmailSignIn }) => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');

  const handleGoogleSignIn = () => {
    if (onGoogleSignIn) return onGoogleSignIn();
    setTimeout(() => { onSignIn(); }, 500);
  };

  const handleAppleSignIn = () => {
    if (onAppleSignIn) return onAppleSignIn();
    setTimeout(() => { onSignIn(); }, 500);
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEmailSignIn) return onEmailSignIn(email);
    setTimeout(() => { onSignIn(); }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F7] via-[#F8EDEB] to-[#E6B8C2] flex items-center justify-center p-4">
      {/* Hero Section */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <div className="text-center lg:text-left space-y-6">
          <div className="flex justify-center lg:justify-start">
            <img 
              src={lyraLogoLight} 
              alt="Lyra"
              className="h-16 w-auto"
            />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-foreground">
              AI music that fits your brand
            </h1>
            <p className="text-muted-foreground">
              Generate custom playlists for your café, gym, or store. 
              Perfectly curated, endlessly unique, always compliant.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <div className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-primary/20">
              <span className="text-foreground/80">🎵 AI-Generated Playlists</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-primary/20">
              <span className="text-foreground/80">🎨 Brand-Matched Vibes</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-primary/20">
              <span className="text-foreground/80">📊 Real-Time Analytics</span>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-card rounded-[16px] p-8 shadow-xl border border-border">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-card-foreground">Welcome back</h2>
                <p className="text-muted-foreground">
                  Sign in to your Lyra account
                </p>
              </div>

              {/* SSO Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white text-foreground border border-border hover:bg-secondary/50 transition-all"
                  variant="outline"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  onClick={handleAppleSignIn}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-card-foreground">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-coral text-white hover:opacity-90 transition-all"
                >
                  Continue with Email
                </Button>
              </form>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-primary hover:text-accent transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-border text-center">
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button 
                    onClick={onSignIn}
                    className="text-primary hover:text-accent transition-colors"
                  >
                    Start free trial
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <p className="text-center mt-6 text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal 
          isOpen={showForgotPassword} 
          onClose={() => setShowForgotPassword(false)} 
        />
      )}
    </div>
  );
};
