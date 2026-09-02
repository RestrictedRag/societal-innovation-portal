'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Sparkles,
  HeartHandshake,
  Rocket,
  Info,
  Calendar,
  X,
  ExternalLink,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface CompanyNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export function CompanyNotificationCenter({
  isOpen,
  onClose,
  onNavigate,
}: CompanyNotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/industry/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/industry/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/industry/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RECOMMENDATION':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'COLLABORATION':
        return <HeartHandshake className="w-4 h-4 text-emerald-600" />;
      case 'PILOT':
        return <Rocket className="w-4 h-4 text-blue-600" />;
      case 'INTEREST':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-nexus-primary/10 text-nexus-primary flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900">Industry Activity</h3>
              <p className="text-[11px] text-slate-500">Live milestones, matches & research updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              title="Mark all as read"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading activity feed...</div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No New Notifications</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                You will be notified when university researchers update milestones or accept pilot testbeds.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition text-xs space-y-1.5 ${
                  item.isRead
                    ? 'border-slate-200 bg-white hover:bg-slate-50'
                    : 'border-nexus-primary/30 bg-nexus-primary/[0.03] shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <div className="p-1 rounded-lg bg-slate-100">{getTypeIcon(item.type)}</div>
                    <span>{item.title}</span>
                  </div>

                  {!item.isRead && (
                    <button
                      onClick={() => markAsRead(item.id)}
                      title="Mark as read"
                      className="text-slate-400 hover:text-nexus-primary p-0.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed pl-7">{item.message}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pl-7 pt-1">
                  <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  {item.link && (
                    <button
                      onClick={() => {
                        onClose();
                        if (onNavigate && item.link) onNavigate(item.link);
                      }}
                      className="text-nexus-primary font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      View Details <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
