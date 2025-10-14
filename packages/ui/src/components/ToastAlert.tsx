import React from 'react';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

// Helper functions to show different toast types
export const showToast = {
  success: ({ title, description, duration = 4000 }: ToastOptions) => {
    toast.custom(
      (t) => (
        <div className="bg-card border border-border rounded-[16px] shadow-lg p-4 flex items-start gap-3 min-w-[320px]">
          <div className="shrink-0 w-5 h-5 mt-0.5">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-foreground mb-1">{title}</h4>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      ),
      { duration }
    );
  },

  error: ({ title, description, duration = 5000 }: ToastOptions) => {
    toast.custom(
      (t) => (
        <div className="bg-card border-2 border-destructive rounded-[16px] shadow-lg p-4 flex items-start gap-3 min-w-[320px]">
          <div className="shrink-0 w-5 h-5 mt-0.5">
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h4 className="text-foreground mb-1">{title}</h4>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      ),
      { duration }
    );
  },

  warning: ({ title, description, duration = 4000 }: ToastOptions) => {
    toast.custom(
      (t) => (
        <div className="bg-card border-2 border-yellow-500 rounded-[16px] shadow-lg p-4 flex items-start gap-3 min-w-[320px]">
          <div className="shrink-0 w-5 h-5 mt-0.5">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-foreground mb-1">{title}</h4>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      ),
      { duration }
    );
  },

  info: ({ title, description, duration = 4000 }: ToastOptions) => {
    toast.custom(
      (t) => (
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-[16px] shadow-lg p-4 flex items-start gap-3 min-w-[320px]">
          <div className="shrink-0 w-5 h-5 mt-0.5">
            <Info className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-foreground mb-1">{title}</h4>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      ),
      { duration }
    );
  }
};

// Example usage component (for documentation)
export const ToastExamples: React.FC = () => {
  return (
    <div className="space-y-3">
      <button
        onClick={() => showToast.success({ 
          title: 'Playlist Created', 
          description: 'Your new playlist has been generated successfully.' 
        })}
        className="px-4 py-2 rounded-lg bg-green-500 text-white"
      >
        Show Success Toast
      </button>

      <button
        onClick={() => showToast.error({ 
          title: 'Generation Failed', 
          description: 'Unable to generate playlist. Please try again.' 
        })}
        className="px-4 py-2 rounded-lg bg-red-500 text-white"
      >
        Show Error Toast
      </button>

      <button
        onClick={() => showToast.warning({ 
          title: 'Usage Warning', 
          description: "You've used 90% of your monthly hours." 
        })}
        className="px-4 py-2 rounded-lg bg-yellow-500 text-white"
      >
        Show Warning Toast
      </button>

      <button
        onClick={() => showToast.info({ 
          title: 'New Feature', 
          description: 'Check out our updated playlist builder!' 
        })}
        className="px-4 py-2 rounded-lg bg-gradient-coral text-white"
      >
        Show Info Toast
      </button>
    </div>
  );
};
