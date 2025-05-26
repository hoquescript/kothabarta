import { useEffect } from "react";
import { useSocket } from "./useSocket";
import peerService from "../service/peer";
import { useSearchParams } from "react-router-dom";
import type { Stream } from "@/pages/Meeting";

const useNegotitation = (
  remoteSocketId: string | null,
  myStream: Stream | null,
) => {
  const socket = useSocket();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  // Initiator will start the negotiation
  useEffect(() => {
    const handleNegotiationNeeded = async () => {
      const offer = await peerService.getOffer();
      console.log(
        `From ${email} to ${remoteSocketId} - negotiation:send - Negotiation INITIATED`,
      );
      socket.emit("negotiation:send", {
        to: remoteSocketId,
        offer,
      });
    };
    peerService.peer.addEventListener(
      "negotiationneeded",
      handleNegotiationNeeded,
    );

    return () => {
      peerService.peer.removeEventListener(
        "negotiationneeded",
        handleNegotiationNeeded,
      );
    };
  }, [email, remoteSocketId, socket]);

  useEffect(() => {
    const handleNegotiationReceived = async (data: {
      from: string;
      offer: RTCSessionDescription;
    }) => {
      const answer = await peerService.getAnswer(data.offer);
      console.log(
        `From ${email} to ${remoteSocketId} - negotiation:settled - Negotiation RECEIVED`,
      );
      socket.emit("negotiation:settled", {
        to: data.from,
        answer,
      });
      console.log(
        `From ${email} to ${remoteSocketId} - negotiation:settled - Negotiation SETTLED`,
      );
      // await peerService.addRemoteDescription(data.offer);
    };
    socket.on("negotiation:received", handleNegotiationReceived);

    const handleNegotiationComplete = async (data: {
      from: string;
      answer: RTCSessionDescription;
    }) => {
      await peerService.addRemoteDescription(data.answer);
      console.log(
        `From ${email} to ${remoteSocketId} - negotiation:completed - Negotiation COMPLETED`,
      );
    };
    socket.on("negotiation:completed", handleNegotiationComplete);

    return () => {
      socket.off("negotiation:received", handleNegotiationReceived);
      socket.off("negotiation:completed", handleNegotiationComplete);
    };
  }, [email, remoteSocketId, socket, myStream]);
};

export default useNegotitation;

export const sendStreams = (stream: MediaStream) => {
  for (const track of stream.getTracks() || []) {
    peerService.peer.addTrack(track, stream);
  }
};
