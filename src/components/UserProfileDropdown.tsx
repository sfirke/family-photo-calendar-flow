
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon, Calendar, Wifi, WifiOff } from 'lucide-react';
import { useHybridAuth } from '@/hooks/useHybridAuth';

const UserProfileDropdown = () => {
  const { user, signOut } = useHybridAuth();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-white/30">
          <AvatarImage 
            src={user.avatar_url} 
            alt={user.full_name || user.email || 'User'} 
          />
          <AvatarFallback className="bg-white/20 text-white">
            <UserIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="flex flex-col items-start">
          <div className="font-medium">{user.full_name || 'User'}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex items-center justify-between cursor-default">
          <div className="flex items-center">
            {user.isGoogleConnected ? (
              <>
                <Wifi className="mr-2 h-4 w-4 text-green-600" />
                <span className="text-green-600">Google Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="mr-2 h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Local Only</span>
              </>
            )}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Reset Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
