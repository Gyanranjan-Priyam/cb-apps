"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Clock, CheckCircle, QrCode } from "lucide-react";
import { format } from "date-fns";
import { initSocket, joinRoom, onSocketEvent } from "@/lib/socket-client";

interface User {
  name: string;
  email: string;
  registration: string | null;
  rollNumber: string | null;
  branch: string | null;
}

interface AttendanceRecord {
  id: string;
  status: string;
  points: number;
  markedAt: Date;
  method: string;
  user: User;
}

interface LiveAttendanceListProps {
  sessionId: string | null;
  isActive: boolean;
}

export default function LiveAttendanceList({ sessionId, isActive }: LiveAttendanceListProps) {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previousTotal, setPreviousTotal] = useState(0);

  useEffect(() => {
    if (!sessionId || !isActive) {
      setAttendances([]);
      setTotal(0);
      setPreviousTotal(0);
      return;
    }

    // Initial fetch
    fetchAttendances();

    // Socket.IO realtime event listener
    let cleanupRoom: (() => void) | undefined;
    let cleanupListener: (() => void) | undefined;

    initSocket().then((socket) => {
      if (!socket) return;

      const room = `attendance-session-${sessionId}`;
      cleanupRoom = joinRoom(room);

      cleanupListener = onSocketEvent("attendance-updated", () => {
        // Instantly re-fetch records when a new scan occurs
        fetchAttendances();
      });
    });

    // Window focus listener for fresh data when tab is active
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        fetchAttendances();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      cleanupListener?.();
      cleanupRoom?.();
    };
  }, [sessionId, isActive]);

  const fetchAttendances = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(
        `/api/admin/attendance/records?sessionId=${sessionId}`
      );
      const data = await response.json();

      if (data.success) {
        setAttendances(data.attendances);
        
        // Play sound if new student scanned
        if (data.total > previousTotal && previousTotal > 0) {
          playNotificationSound();
        }
        
        setPreviousTotal(data.total);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error);
    }
  };

  const playNotificationSound = () => {
    // Play a subtle beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return format(new Date(date), "MMM dd, HH:mm");
  };

  if (!sessionId || !isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Attendance
          </CardTitle>
          <CardDescription>
            Generate a QR code to see students scanning in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No active QR code</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Live Attendance
              {total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {total} student{total !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Students are appearing as they scan the QR code
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {attendances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Waiting for students to scan...</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {attendances.map((attendance, index) => (
                <div
                  key={attendance.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    index === 0 ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 animate-in fade-in slide-in-from-top-2" : "bg-muted/50"
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(attendance.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {attendance.user.name}
                      </p>
                      {index === 0 && (
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {attendance.user.registration && (
                        <span>{attendance.user.registration}</span>
                      )}
                      {attendance.user.rollNumber && (
                        <>
                          <span>•</span>
                          <span>{attendance.user.rollNumber}</span>
                        </>
                      )}
                      {attendance.user.branch && (
                        <>
                          <span>•</span>
                          <span>{attendance.user.branch}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {getTimeAgo(attendance.markedAt)}
                    </div>
                    {attendance.method === "qr-scan" && (
                      <Badge variant="outline" className="text-xs">
                        <QrCode className="h-3 w-3 mr-1" />
                        QR
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
