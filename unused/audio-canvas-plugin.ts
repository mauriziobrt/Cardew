import { Plugin, PluginSettingTab, App, Setting } from 'obsidian';

export default class AudioCanvasPlugin extends Plugin {
	async onload() {
		// Register custom canvas node type
		this.registerCanvasNodeType(
			'audio-spectrogram', // node type ID
			AudioSpectrogramNode
		);
	}

	onunload() {
		// Cleanup
	}
}

// Custom canvas node class
class AudioSpectrogramNode {
	canvas: any;
	node: any;
	containerEl: HTMLElement;
	contentEl: HTMLElement;

	constructor(canvas: any, data: any) {
		this.canvas = canvas;
		this.node = data;
		this.containerEl = document.createElement('div');
		this.contentEl = document.createElement('div');
		this.containerEl.appendChild(this.contentEl);
		
		this.render();
	}

	render() {
		// Load audio file from vault
		const filePath = this.node.file; // assumes file path in node data
		
		this.contentEl.innerHTML = `
			<div class="audio-node">
				<audio id="audio-player" controls></audio>
				<canvas id="spectrogram-canvas"></canvas>
				<div class="controls">
					<button id="select-start">Mark Start</button>
					<button id="select-end">Mark End</button>
					<button id="play-selection">Play Selection</button>
				</div>
			</div>
		`;

		this.setupAudioHandlers(filePath);
	}

	setupAudioHandlers(filePath: string) {
		const audioEl = this.contentEl.querySelector('#audio-player') as HTMLAudioElement;
		const canvas = this.contentEl.querySelector('#spectrogram-canvas') as HTMLCanvasElement;

		// Load audio file
		this.canvas.app.vault.adapter.read(filePath).then((data: string) => {
			const blob = new Blob([data], { type: 'audio/mp3' });
			const url = URL.createObjectURL(blob);
			audioEl.src = url;
		});

		// TODO: Generate spectrogram on audio load
		audioEl.addEventListener('canplaythrough', () => {
			this.generateSpectrogram(audioEl, canvas);
		});

		// Selection controls
		let selectionStart = 0;
		let selectionEnd = 0;

		this.contentEl.querySelector('#select-start')?.addEventListener('click', () => {
			selectionStart = audioEl.currentTime;
			console.log('Selection start:', selectionStart);
		});

		this.contentEl.querySelector('#select-end')?.addEventListener('click', () => {
			selectionEnd = audioEl.currentTime;
			console.log('Selection end:', selectionEnd);
		});

		this.contentEl.querySelector('#play-selection')?.addEventListener('click', () => {
			audioEl.currentTime = selectionStart;
			audioEl.play();
			// Stop at selectionEnd
			const checkInterval = setInterval(() => {
				if (audioEl.currentTime >= selectionEnd) {
					audioEl.pause();
					clearInterval(checkInterval);
				}
			}, 100);
		});
	}

	generateSpectrogram(audio: HTMLAudioElement, canvas: HTMLCanvasElement) {
		// Placeholder: Web Audio API analysis
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 2048;

		const source = audioContext.createMediaElementAudioSource(audio);
		source.connect(analyser);
		analyser.connect(audioContext.destination);

		// Draw frequency data on canvas
		const canvasCtx = canvas.getContext('2d')!;
		const dataArray = new Uint8Array(analyser.frequencyBinCount);

		const draw = () => {
			requestAnimationFrame(draw);
			analyser.getByteFrequencyData(dataArray);

			canvasCtx.fillStyle = 'rgb(200, 200, 200)';
			canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

			canvasCtx.lineWidth = 2;
			canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
			canvasCtx.beginPath();

			const sliceWidth = (canvas.width * 1.0) / dataArray.length;
			let x = 0;

			for (let i = 0; i < dataArray.length; i++) {
				const v = dataArray[i] / 128.0;
				const y = (v * canvas.height) / 2;

				if (i === 0) {
					canvasCtx.moveTo(x, y);
				} else {
					canvasCtx.lineTo(x, y);
				}

				x += sliceWidth;
			}

			canvasCtx.lineTo(canvas.width, canvas.height / 2);
			canvasCtx.stroke();
		};

		draw();
	}

	getDisplayText(): string {
		return 'Audio Spectrogram';
	}
}