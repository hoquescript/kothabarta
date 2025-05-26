class PeerService {
  public peer: RTCPeerConnection;

  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });
  }

  async getOffer() {
    if (!this.peer) {
      throw new Error("Peer not initialized");
    }

    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  }

  async getAnswer(offer: RTCSessionDescription) {
    if (!this.peer) {
      throw new Error("Peer not initialized");
    }

    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(new RTCSessionDescription(answer));

    return answer;
  }

  async addRemoteDescription(offer: RTCSessionDescription) {
    if (!this.peer) {
      throw new Error("Peer not initialized");
    }
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
  }
}

export default new PeerService();
