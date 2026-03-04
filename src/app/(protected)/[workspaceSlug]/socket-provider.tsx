"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket-client";

const SocketContext = createContext<Socket | null>(null);

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("error", (err: { message: string }) => {
      console.error("[Socket] Error:", err.message);
    });

    // Idle detection
    let idleTimer: NodeJS.Timeout | null = null;
    let isIdle = false;

    function resetIdleTimer() {
      if (idleTimer) clearTimeout(idleTimer);
      if (isIdle) {
        isIdle = false;
        socket.emit("active_status");
      }
      idleTimer = setTimeout(() => {
        isIdle = true;
        socket.emit("idle_status");
      }, IDLE_TIMEOUT);
    }

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimer) clearTimeout(idleTimer);
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current ?? getSocket()}>
      {children}
    </SocketContext.Provider>
  );
}
