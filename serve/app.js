window.onload = () => {

window.app = new Vue({
	el: '#app',
	data: {
		face2face: null,
		remoteAnswer: null,
		remoteOffer: null,
		miniSdp: null
	},
	methods: {
		begin: function() {
			this.face2face && this.face2face.close();
			this.face2face = new Face2Face({
				canvas: document.getElementById('frame'),
				onMessage: x => console.log('got msg', x)
			});

			this.face2face.begin();
		},

		getImageData() {
			return this.face2face && this.face2face.localValues.imageData;
		},

		getMinimized() {
			return this.face2face && JSON.stringify(this.face2face.localValues.minimized);
		}
	},
	directives: {
		qrCode: function(canvas, binding) {
			const ctx = canvas.getContext('2d');
			if (binding.value) {
				data = binding.value;
				canvas.height = data.height;
				canvas.width = data.width;
				ctx.putImageData(data, 0, 0);
			} else {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}
		}
	}
});

};
