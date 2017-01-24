'use strict'

const RTCPeerConnection = window.RTCPeerConnection ||
	window.webkitRTCPeerConnection ||
	window.mozRTCPeerConnection;


class RTCConnection {
	constructor(options = {}) {
		this.options = options;

		this.localValues = {
			sdp: null,
			candidates: []
		};

		const rtcConfig = Object.assign({iceServers: []}, options.rtcConfig || {});
		this.pc = new RTCPeerConnection(rtcConfig);

		this.gotAllCandidates = new Promise((resolve, reject) => {
			this.pc.onicecandidate = e => {
				if (e.candidate) {
					this.localValues.candidates.push(e.candidate);
					this.onIceCandidate(e.candidate);
				} else {
					resolve(this.localValues);
				}
			};
		});

		this.setDc();
	}

	close() {
		this.pc.close();
	}

	onIceCandidate(candidate) {
		const fn = this.options.onIceCandidate;
		fn && fn(candidate);
	}

	setDc() {
		this.dc.onmessage = msg => console.log('got msg', msg);
		this.dc.onopen = ev => console.log('onopen state', ev.readyState);
		this.dc.onclose = ev => console.log('onclose state', ev.readyState);
	}

	connect(_values) {
		const values = JSON.parse(_values);
		const rd = new RTCSessionDescription({
			type: this.remoteType,
			sdp: values.sdp
		});

		return this.pc.setRemoteDescription(rd).then(() => {
			values.candidates.forEach(c => this.pc.addIceCandidate(c));
			return values;
		});
	}
}


class HostRTCConnection extends RTCConnection {
	constructor() {
		super();
		this.remoteType = 'answer';
	}

	setDc() {
		this.dc = this.pc.createDataChannel('myData');
		super.setDc();
	}

	host() {
		return this.pc.createOffer().then((offer) => {
			this.localValues.sdp = offer.sdp;
			return this.pc.setLocalDescription(offer);
		}).then(() => {
			return this.gotAllCandidates;
		});
	}
}


class ClientRTCConnection extends RTCConnection {
	constructor() {
		super();
		this.remoteType = 'offer';
	}

	setDc() {
		this.pc.ondatachannel = (ev) => {
			this.dc = ev.channel;
			super.setDc();
		};
	}

	connect(_values) {
		return super.connect(_values).then(values => {
			return this.pc.createAnswer();
		}).then((answer) => {
			this.localValues.sdp = answer.sdp;
			return this.pc.setLocalDescription(answer);
		}).then(() => {
			return this.gotAllCandidates;
		});
	}
}
