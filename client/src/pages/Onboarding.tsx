import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "../hooks/useSocket";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [meetId, setMeetId] = useState("");

  const handleContinue = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      socket.emit("room:join-request", { email, meetId });
    },
    [email, meetId, socket],
  );

  const handleJoinRequestAccepted = useCallback(
    (data: { meetId: string; email: string }) => {
      navigate(`/meet/${data.meetId}?email=${data.email}`);
    },
    [navigate],
  );
  const handleJoinRequestRejected = useCallback(() => {
    console.log("Join request rejected");
  }, []);
  const handleJoinRequestTimeout = useCallback(() => {
    console.log("Join request timeout");
  }, []);

  useEffect(() => {
    socket.on("room:join-accepted", handleJoinRequestAccepted);
    socket.on("room:join-rejected", handleJoinRequestRejected);
    socket.on("room:join-timeout", handleJoinRequestTimeout);
    return () => {
      socket.off("room:join-accepted", handleJoinRequestAccepted);
      socket.off("room:join-rejected", handleJoinRequestRejected);
      socket.off("room:join-timeout", handleJoinRequestTimeout);
    };
  }, [
    handleJoinRequestAccepted,
    handleJoinRequestRejected,
    handleJoinRequestTimeout,
    socket,
  ]);

  return (
    <main className="flex flex-col h-screen w-screen items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">Onboarding</h1>
      <form
        className="flex min-w-[400px] flex-col items-center justify-center gap-4"
        onSubmit={handleContinue}
      >
        <Input
          placeholder="Enter your email"
          className="w-full"
          // autoCorrect="off"
          autoCapitalize="off"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Enter your meet ID"
          className="w-full"
          value={meetId}
          onChange={(e) => setMeetId(e.target.value)}
        />
        <Button className="w-full" type="submit">
          Continue
        </Button>
      </form>
    </main>
  );
};

export default Onboarding;
