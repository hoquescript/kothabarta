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

    const handleUserOffer = async (data: {
      from: string;
      offer: RTCSessionDescription;
    }) => {
      // For the other user who joined later hence he doesn't have the peerSocketId
      setPeerSocketId(data.from);

      // Send the answer to the initiator
      const answer = await peerService.getAnswer(data.offer);
      socket.emit("user:offer-answer", {
        to: data.from,
        answer,
      });
    };
    socket.on("user:offering", handleUserOffer);

    const handleUserOfferAnswer = async (data: {
      from: string;
      answer: RTCSessionDescription;
    }) => {
      // For the initiator local description was set earlier only, Now the answer is also getting set
      await peerService.addRemoteDescription(data.answer);
    };
    socket.on("user:offer-answering", handleUserOfferAnswer);

    return () => {
      socket.off("user:joining", handleUserJoining);
      socket.off("user:offering", handleUserOffer);
      socket.off("user:offer-answering", handleUserOfferAnswer);
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

      if (peerSocketId) {
        const offer = await peerService.getOffer();
        socket.emit("user:offer", {
          to: peerSocketId,
          offer,
        });
      }

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
      <div className="flex flex-col gap-4 text-white">
        <h1 className="text-2xl font-bold">{email}</h1>
        <p className="text-sm text-neutral-400">{peerSocketId}</p>
      </div>
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
