import { io } from "socket.io-client";
import { SocketContext } from "../hooks/useSocket";
import { useMemo } from "react";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useMemo(() => io("http://localhost:8000"), []);
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
