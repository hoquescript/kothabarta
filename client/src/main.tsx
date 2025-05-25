import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { SocketProvider } from "./context/Socket.tsx";
import { Toaster } from "@/components/ui/sonner";

import "./main.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <App />
        <Toaster />
      </SocketProvider>
    </BrowserRouter>
  </StrictMode>,
);
