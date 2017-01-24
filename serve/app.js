window.onload = () => {

window.app = new Vue({
	el: '#app',
	data: {
		rtc: null,
		type: null,
		remoteAnswer: null,
		remoteOffer: null,
		miniSdp: null
	},
	methods: {
		setAsHost: function() {
			this.type = 'host';
			this.localValues = null;

			this.rtc && this.rtc.close();
			this.rtc = new HostRTCConnection();

			this.rtc.host().then(values => {
				this.miniSdp = JSON.stringify(values.minimized);
			});
		},

		setAsClient: function() {
			this.type = 'client';
			this.localValues = null;

			this.rtc && this.rtc.close();
			this.rtc = new ClientRTCConnection();
		},

		connectAsClient: function() {
			return this.rtc.connect(this.remoteOffer).then(values => {
				this.miniSdp = JSON.stringify(values.minimized);
			});
		},

		connectToClient: function() {
			return this.rtc.connect(this.remoteAnswer);
		},
	}
});

};
