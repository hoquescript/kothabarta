import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { toast } from "sonner";
import ReactPlayer from "react-player";
import peerService from "../service/peer";

interface Stream {
  email: string;
  socketId: string;
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

  const [myStream, setMyStream] = useState<Stream | null>(null);
  const [peerSocketId, setPeerSocketId] = useState<string | null>(null);

  // Handle user joining the meeting
  useEffect(() => {
    const handleUserJoining = (data: { email: string; socketId: string }) => {
      toast.success(`${data.socketId}:${data.email} is joining the meeting`);
      setPeerSocketId(data.socketId);
    };
    socket.on("user:joining", handleUserJoining);

    const handleUserOffer = (data: {
      from: string;
      offer: RTCSessionDescription;
    }) => {
      console.log(data);
      toast.success(`${data.from} is offering to join the meeting`);
      // peerService.getAnswer(data.offer);
    };
    socket.on("user:offering", handleUserOffer);

    return () => {
      socket.off("user:joining", handleUserJoining);
      socket.off("user:offering", handleUserOffer);
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

      const offer = await peerService.getOffer();
      socket.emit("user:offer", {
        to: peerSocketId,
        offer,
      });

      setMyStream({
        email: email || "",
        socketId: socket.id || "",
        screenshare: false,
        video: hasVideo,
        audio: hasAudio,
        stream,
      });
    };

    getMyStream();
  }, [email, peerSocketId, socket, socket.id]);

  return (
    <main
      className={`grid ${
        peerSocketId ? "grid-cols-2" : "grid-cols-1"
      } w-screen h-screen gap-4 bg-neutral-950 p-8`}
    >
      <div className="w-full h-full relative border-2 border-neutral-700 rounded-md">
        {myStream && (
          <ReactPlayer
            width="100%"
            height="100%"
            url={myStream.stream}
            key={myStream?.socketId}
            playing={true}
            muted
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        )}
      </div>
    </main>
  );
};

export default Meeting;
