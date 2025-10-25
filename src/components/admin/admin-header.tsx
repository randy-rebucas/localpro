"use client";

import { useState } from "react";
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut,
  ChevronDown
} from "lucide-react";

interface AdminHeaderProps {
  onMenuClick: () => void;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function AdminHeader({ onMenuClick, user }: AdminHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      <div className="flex items-center justify-between px-3 py-2">
        {/* Left side */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LocalPro Admin
            </h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-sm mx-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search admin panel..."
              className="w-full pl-8 pr-3 py-2 text-sm font-medium text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 rounded-md relative transition-all duration-200 hover:scale-105"
            >
              <Bell className="w-6 h-6 text-gray-700 hover:text-gray-900" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
                3
              </span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b">
                  <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-3 border-b hover:bg-gray-50">
                    <p className="text-sm font-medium">New user registration</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                  <div className="p-3 border-b hover:bg-gray-50">
                    <p className="text-sm font-medium">Payment processed</p>
                    <p className="text-xs text-gray-500">5 minutes ago</p>
                  </div>
                  <div className="p-3 hover:bg-gray-50">
                    <p className="text-sm font-medium">System alert</p>
                    <p className="text-xs text-gray-500">10 minutes ago</p>
                  </div>
                </div>
                <div className="p-3 border-t">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-1.5 p-1.5 hover:bg-gray-100 rounded-md transition-all duration-200 hover:scale-105"
            >
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-20">{user.name}</p>
                <p className="text-xs font-medium text-gray-600 truncate max-w-20">{user.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs font-medium text-gray-600">{user.email}</p>
                  </div>
                  <button className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-gray-50 flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
