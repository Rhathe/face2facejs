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
			this.rtc = new HostRTCConnection({
				canvas: document.getElementById('frame')
			});

			this.rtc.host();
		},

		getImageData() {
			return this.rtc && this.rtc.localValues.imageData;
		},

		getMinimized() {
			return this.rtc && JSON.stringify(this.rtc.localValues.minimized);
		},

		setAsClient: function() {
			this.type = 'client';
			this.localValues = null;

			this.rtc && this.rtc.close();
			this.rtc = new ClientRTCConnection({
				canvas: document.getElementById('frame')
			});
		},

		connectAsClient: function() {
			return this.rtc.connect(this.remoteOffer);
		},

		connectToClient: function() {
			return this.rtc.connect(this.remoteAnswer);
		},
	},
	directives: {
		qrCode: function(canvas, binding) {
			const ctx = canvas.getContext('2d');
			if (binding.value) {
				data = binding.value;
				canvas.height = data.height;
				canvas.width = data.width;
				ctx.putImageData(data, 0, 0);
			}
		}
	}
});

};
