import { useParams, useSearchParams } from "react-router-dom";
import { Fragment, useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { toast } from "sonner";
import ReactPlayer from "react-player";
import peerService from "../service/peer";
import useNegotitation, { sendStreams } from "@/hooks/useNegotitation";

export interface Stream {
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
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [initiatorSocketId, setInitiatorSocketId] = useState<string | null>(
    null,
  );
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);

  useNegotitation(remoteSocketId, myStream);

  useEffect(() => {
    peerService.peer.addEventListener("track", (event) => {
      console.log("RECEIVED STREAM!!!!");
      setRemoteStream(event.streams[0]);
    });
  }, [remoteStream]);

  // Handle user joining the meeting
  useEffect(() => {
    const handleUserJoining = (data: { email: string; socketId: string }) => {
      toast.success(`${data.socketId}:${data.email} is joining the meeting`);
      setRemoteSocketId(data.socketId);
      setInitiatorSocketId(socket.id!);
    };
    socket.on("user:joining", handleUserJoining);

    const handleCallReceived = async (data: {
      from: string;
      offer: RTCSessionDescription;
    }) => {
      // For the other user who joined later hence he doesn't have the peerSocketId
      setRemoteSocketId(data.from);

      // Send the answer to the initiator
      const answer = await peerService.getAnswer(data.offer);
      console.log(
        `From ${email} to ${remoteSocketId} - webrtc:call:received - Call received`,
      );
      socket.emit("webrtc:answer:send", {
        to: data.from,
        answer,
      });
      console.log(
        `From ${email} to ${remoteSocketId} - webrtc:answer:send - Answer sent`,
      );
    };
    socket.on("webrtc:call:received", handleCallReceived);

    const handleUserAnswer = async (data: {
      from: string;
      answer: RTCSessionDescription;
    }) => {
      // For the initiator local description was set earlier only, Now the answer is also getting set
      await peerService.addRemoteDescription(data.answer);
      // As the handshake is done now we would be starting to send the media streams
      if (!myStream) return;
      sendStreams(myStream.stream);

      console.log(
        `From ${email} to ${remoteSocketId} - webrtc:answer:received - Answer received`,
      );
    };
    socket.on("webrtc:answer:received", handleUserAnswer);

    return () => {
      socket.off("user:joining", handleUserJoining);
      socket.off("webrtc:call:received", handleCallReceived);
      socket.off("webrtc:answer:received", handleUserAnswer);
    };
  }, [meetId, socket, myStream, email, remoteSocketId]);

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

      // The first user to join the meeting will be the initiator
      if (initiatorSocketId) {
        const offer = await peerService.getOffer();
        console.log(
          `From ${email} to ${remoteSocketId} - webrtc:call:send - Call sent`,
        );
        socket.emit("webrtc:call:send", {
          to: remoteSocketId,
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
  }, [email, initiatorSocketId, remoteSocketId, socket, socket.id]);

  return (
    <Fragment>
      <button
        onClick={() => {
          if (myStream) {
            sendStreams(myStream.stream);
          }
        }}
      >
        Send Stream
      </button>

      <main
        className={`grid ${
          remoteSocketId ? "grid-cols-2" : "grid-cols-1"
        } w-screen h-screen gap-4 bg-neutral-950 p-8`}
      >
        <div className="w-full h-full relative border-2 border-neutral-700 rounded-md">
          {/* <div className="flex flex-col gap-4 text-white">
          <h1 className="text-2xl font-bold">{email}</h1>
          <p className="text-sm text-neutral-400">{remoteSocketId}</p>
        </div> */}
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
        <div className="w-full h-full relative border-2 border-neutral-700 rounded-md">
          {remoteStream && (
            <ReactPlayer
              width="100%"
              height="100%"
              url={remoteStream}
              key={remoteSocketId}
              playing={true}
              muted
              style={{ position: "absolute", top: 0, left: 0 }}
            />
          )}
        </div>
      </main>
    </Fragment>
  );
};

export default Meeting;
