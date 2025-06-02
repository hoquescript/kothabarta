import { io } from "socket.io-client";
import { SocketContext } from "../hooks/useSocket";
import { useMemo } from "react";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useMemo(() => io(import.meta.env.VITE_API_URL), []);
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
