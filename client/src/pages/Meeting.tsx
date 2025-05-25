import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { toast } from "sonner";
import ReactPlayer from "react-player";

interface Stream {
  email: string;
  screenshare: boolean;
  video: boolean;
  audio: boolean;
  stream: MediaStream;
}

const Meeting = () => {
  const socket = useSocket();
  const { meetId } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const [streams, setStreams] = useState<Stream[]>([]);

  // Handle user joining the meeting
  useEffect(() => {
    const handleUserJoining = (data: { email: string }) => {
      toast.success(`${data.email} is joining the meeting`);
    };
    socket.on("user:joining", handleUserJoining);
    return () => {
      socket.off("user:joining", handleUserJoining);
    };
  }, [meetId, socket]);

  // Handle getting the media stream of my camera and microphone
  useEffect(() => {
    const getMyStream = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some((device) => device.kind === "videoinput");
      const hasAudio = devices.some((device) => device.kind === "audioinput");

      if (!hasVideo && !hasAudio) {
        toast.error("No camera or microphone found");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: hasVideo,
        audio: hasAudio,
      });

      // Check if stream already exists for this email
      setStreams((prev) => {
        const exists = prev.some((s) => s.email === email);
        if (exists) return prev;
        return [
          ...prev,
          {
            email: email!,
            screenshare: false,
            video: hasVideo,
            audio: hasAudio,
            stream,
          },
        ];
      });
    };

    getMyStream();
  }, [email, socket.id]);

  console.log(streams);

  return (
    <main className="flex justify-center w-full h-screen gap-4 bg-slate-900">
      {streams.map((stream) => (
        <div className="flex flex-col items-center justify-center border-2 border-gray-300 rounded-md p-4 bg-slate-700">
          <h1>{stream.email}</h1>
          <ReactPlayer
            width={"100%"}
            url={stream.stream}
            key={stream.email}
            playing={true}
            muted={stream.email === email}
          />
        </div>
      ))}
    </main>
  );
};

export default Meeting;
