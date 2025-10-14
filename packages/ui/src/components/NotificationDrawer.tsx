import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../primitives/sheet';
import { Button } from '../primitives/button';
import { Badge } from '../primitives/badge';
import { ScrollArea } from '../primitives/scroll-area';
import { 
  Music, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  X 
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
}

interface NotificationDrawerProps {
  onClose: () => void;
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  onClose,
  notifications = [],
  onMarkAsRead,
  onClearAll
}) => {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Music className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-primary/5 border-primary/10';
    }
  };

  // Mock notifications if none provided
  const defaultNotifications: Notification[] = [
    {
      id: '1',
      type: 'success',
      title: 'Playlist Generated',
      message: 'Your "Morning Café Vibes" playlist is ready with 20 tracks.',
      timestamp: '2 min ago',
      read: false
    },
    {
      id: '2',
      type: 'warning',
      title: 'Usage Alert',
      message: "You've used 80% of your monthly streaming hours.",
      timestamp: '1 hour ago',
      read: false
    },
    {
      id: '3',
      type: 'info',
      title: 'New Feature',
      message: 'Check out our new mood-based playlist builder!',
      timestamp: '3 hours ago',
      read: true
    },
    {
      id: '4',
      type: 'success',
      title: 'Payment Successful',
      message: 'Your subscription has been renewed for another month.',
      timestamp: '1 day ago',
      read: true
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : defaultNotifications;
  const unreadCount = displayNotifications.filter(n => !n.read).length;

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-96 p-0">
        <SheetHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SheetTitle>Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge className="bg-gradient-coral text-white border-0">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {displayNotifications.length > 0 && onClearAll && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-88px)]">
          <div className="p-4 space-y-3">
            {displayNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 p-4 rounded-full bg-muted/50">
                  <CheckCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-foreground mb-2">All caught up!</h4>
                <p className="text-muted-foreground">
                  No new notifications at the moment.
                </p>
              </div>
            ) : (
              displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    getNotificationBg(notification.type)
                  } ${!notification.read ? 'shadow-sm' : 'opacity-70'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-foreground">{notification.title}</h4>
                        {onMarkAsRead && !notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={() => onMarkAsRead(notification.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{notification.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
