'use strict'

const RTCPeerConnection = window.RTCPeerConnection ||
	window.webkitRTCPeerConnection ||
	window.mozRTCPeerConnection;

const mini = new Minimizer();
const qrcodedraw = new qrcodelib.qrcodedraw();
let qrDecoder;


class RTCConnection {
	constructor(options = {}) {
		this.onUpdateLocalValues = x => x;

		this.options = options;

		this.localValues = {
			sdp: null,
			type: null,
			minimized: null,
			imageData: null,
			candidates: []
		};

		this.remoteValues = {};

		const rtcConfig = Object.assign({iceServers: []}, options.rtcConfig || {});
		this.pc = new RTCPeerConnection(rtcConfig);

		this.gotAllCandidates = new Promise((resolve, reject) => {
			this.pc.onicecandidate = e => {
				if (e.candidate) {
					if (this.skipIPV6(e.candidate)) return;

					this.updateLocalValues({
						candidates: [e.candidate]
					});
					this.onIceCandidate(e.candidate);
				} else {
					resolve(this.localValues);
				}
			};
		});

		this.setDc();
		this.getCamera();
	}

	updateRemoteValues(values) {
		let updated = false;

		Object.keys(values).forEach((k) => {
			const value = values[k];
			if (this.remoteValues[k] !== value) {
				this.remoteValues[k] = value;
				updated = true;
			}
		});

		if (updated) this.connect(values);
	}

	get qrDecoder() {
		qrDecoder = qrDecoder || QrDecoder({
			canvas: this.options.canvas
		});
		return qrDecoder;
	}

	getCamera() {
		return this.qrDecoder.loaded.then(() => {
			this.snapshotInterval = setInterval(() => {
				this.qrDecoder.grabFrameAndDecode().then((res) => {
					if (!res) return;
					this.qrDecoder.drawDetectionOnCanvas(...res.coordinates);
					this.updateRemoteValues(res.result);
				});
			}, 100);
		});
	}

	close() {
		this.pc.close();
		if (this.snapshotInterval) {
			clearInterval(this.snapshotInterval);
		}
	}

	skipIPV6(c) {
		const re = [1,2,3,4,5,6,7,8].map(x => '[a-zA-Z0-9]{0,4}').join(':');
		if (c.candidate.match(new RegExp(re))) return true;
		return false;
	}

	updateLocalValues(values) {
		const candidates = values.candidates || [];
		delete values.candidates;
		Object.assign(this.localValues, values);

		this.localValues.candidates = this.localValues.candidates.concat(candidates);
		this.loadMinimized();
		this.loadImageData();
		this.onUpdateLocalValues(this.localValues);
	}

	loadImageData() {
		const el = document.createElement('canvas');
		const data = JSON.stringify(this.localValues.minimized);
		const options = {
			errorCorrectLevel: 'L',
		}

		qrcodedraw.draw(el, data, options, (error, canvas) => {
			if (error) {
				console.error(error)
			} else {
				const ctx = canvas.getContext('2d');
				this.localValues.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				this.onUpdateLocalValues(this.localValues);
			}
		});
	}

	loadMinimized() {
		this.localValues.minimized = mini.reduce(this.localValues);
		return this.localValues.minimized;
	}

	setSdp(sdpObj) {
		this.updateLocalValues({
			sdp: sdpObj.sdp,
			type: sdpObj.type
		});
	}

	onIceCandidate(candidate) {
		const fn = this.options.onIceCandidate;
		fn && fn(candidate);
	}

	setDc() {
		this.onMessage = this.onMessage || (x => x);
		this.dc.onmessage = msg => {
			this.onMessage(msg);
		};

		this.onOpen = new Promise((resolve, reject) => {
			this.dc.onopen = ev => {
				resolve('Connection opened');
			}
		});

		this.onClose = new Promise((resolve, reject) => {
			this.dc.onclose = ev => {
				resolve('Connection closed');
			}
		});
	}

	connect(_values) {
		const values = mini.expand(_values)[this.remoteType];
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
	constructor(options) {
		super(options);
		this.remoteType = 'answer';
	}

	setDc() {
		this.dc = this.pc.createDataChannel('myData');
		super.setDc();
	}

	host() {
		return this.pc.createOffer().then((offer) => {
			this.setSdp(offer);
			return this.pc.setLocalDescription(offer);
		}).then(() => {
			return this.gotAllCandidates;
		});
	}
}


class ClientRTCConnection extends RTCConnection {
	constructor(options) {
		super(options);
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
			this.setSdp(answer);
			return this.pc.setLocalDescription(answer);
		}).then(() => {
			return this.gotAllCandidates;
		});
	}
}
