'use strict'

const RTCPeerConnection = window.RTCPeerConnection ||
	window.webkitRTCPeerConnection ||
	window.mozRTCPeerConnection;

class RTCConnection {
	constructor() {
		this.pc = new RTCPeerConnection({
			iceServers: []
		});
		this.pc.oniceconnectionstatechange = e => console.log(this.pc.iceConnectionState);
	}

	host() {
		this.dc = this.pc.createDataChannel('myData');
		this.dc.onopen = ev => console.log('onopen state', ev.readyState);
		this.dc.onclose = ev => console.log('onclose state', ev.readyState);

		return this.pc.createOffer().then((offer) => {
			return this.pc.setLocalDescription(offer);
		});
	}

	clientOnDataChannel(ev) {
		this.dc = ev.channel;
		this.dc.onmessage = msg => console.log('got msg', msg);
		this.dc.onopen = ev => console.log('onopen state', ev.readyState);
		this.dc.onclose = ev => console.log('onclose state', ev.readyState);
	}

	connectAsClient(offer) {
		this.pc.ondatachannel = (ev) => {
			console.log('dsgsdgs');
			this.clientOnDataChannel(ev);
		};

		const rtcOffer = new RTCSessionDescription(offer);
		return this.pc.setRemoteDescription(rtcOffer).then(() => {
			return this.pc.createAnswer();
		}).then((answer) => {
			return this.pc.setLocalDescription(answer);
		});
	}

	connectToClient(answer) {
		const rtcAnswer = new RTCSessionDescription(answer);
		return this.pc.setRemoteDescription(rtcAnswer);
	}
}
