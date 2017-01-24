// https://webrtchacks.com/the-minimum-viable-sdp/
//https://github.com/fippo/minimal-webrtc/blob/master/js/sdp-minimizer.js

class Minimizer {
	reduceSdp(sdp) {
		let lines = sdp.split('\r\n');

		lines = lines.filter((line) => {
			return line.indexOf('a=ice-ufrag:') === 0 ||
				line.indexOf('a=ice-pwd:') === 0 ||
				line.indexOf('a=fingerprint:') === 0;
		});

		lines = lines.sort().reverse();

		return lines.map(line => {
			switch(line.split(':')[0]) {
				case 'a=fingerprint':
					const hex = line.substr(22).split(':').map(h => parseInt(h, 16));
					// b64 is slightly more concise than colon-hex
					return btoa(String.fromCharCode.apply(String, hex));
				case 'a=ice-pwd':
					return line.substr(10); // already b64
				case 'a=ice-ufrag':
					return line.substr(12); // already b64
			}
		});
	}

	reduceCandidates(candidates) {
		return candidates.map(c => {
			const parts = c.candidate.split(' ');
			return `${parts[4]}|${parts[5]}`;
		});
	}

	reduce(item) {
		const values = this.reduceSdp(item.sdp).concat(this.reduceCandidates(item.candidates));
		let ret = {};
		ret[item.type === 'offer' ? 'O' : 'A'] = values.join(',');
		return ret;
	}

	expandSha(str) {
		return atob(str).split('').map(c => {
			const d = c.charCodeAt(0);
			let ret = c.charCodeAt(0).toString(16).toUpperCase();
			return `${d < 16 ? '0' : ''}${ret}`;
		}).join(':');
	}

	expandCandidates(candidates) {
		return candidates.map((c, index) => {
			const parts = c.split('|');
			return [
				'candidate:0', // foundation 0
				'1',
				'udp',
				index + 1, // priority
				parts[0],
				parts[1],
				'typ host'
			].join(' ');
		});
	}

	expand(str) {
		const obj = JSON.parse(str);
		let ret = {};

		Object.keys(obj).forEach((k) => {
			const encoded = obj[k].split(',');
			let sdp = [
				'v=0',
				'o=- 5498186869896684180 2 IN IP4 127.0.0.1',
				's=-', 't=0 0', 'a=msid-semantic: WMS',
				'm=application 9 DTLS/SCTP 5000',
				'c=IN IP4 0.0.0.0',
				'a=mid:data',
				'a=sctpmap:5000 webrtc-datachannel 1024',
				k === 'A' ? 'a=setup:active' : 'a=setup:actpass',
				`a=ice-ufrag:${encoded[0]}`,
				`a=ice-pwd:${encoded[1]}`,
				`a=fingerprint:sha-256 ${this.expandSha(encoded[2])}`,
			];

			const candidates = this.expandCandidates(encoded.slice(3));
			sdp.concat(candidates.map(c => `a=${c}`));

			const retKey = k === 'A' ? 'answer': 'offer';
			ret[retKey] = {
				type: retKey,
				sdp: sdp.join('\r\n') + '\r\n',
				candidates: candidates.map(c => ({
					candidate: c,
					sdpMLineIndex: 0,
					sdpMid: 'data'
				}))
			}
		});

		return ret;
	}
}
