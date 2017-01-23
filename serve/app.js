window.onload = () => {

window.app = new Vue({
	el: '#app',
	data: {
		rtc: new RTCConnection(),
		type: null,
		remoteAnswerSdp: null,
		remoteOfferSdp: null,
		sdp: null
	},
	methods: {
		setAsHost: function() {
			this.type = 'host';
			this.sdp = null;
			this.rtc.host().then(() => {
				this.sdp = JSON.stringify(this.rtc.pc.localDescription.sdp);
			});
		},
		setAsClient: function() {
			this.type = 'client';
			this.sdp = null;
		},
		connectAsClient: function() {
			var offer = {
				type: 'offer',
				sdp: JSON.parse(this.remoteOfferSdp)
			};

			return this.rtc.connectAsClient(offer).then(() => {
				this.sdp = JSON.stringify(this.rtc.pc.localDescription.sdp);
			});
		},
		connectToClient: function() {
			var answer = {
				type: 'answer',
				sdp: JSON.parse(this.remoteAnswerSdp)
			};
			return this.rtc.connectToClient(answer);
		},
	}
});

};
