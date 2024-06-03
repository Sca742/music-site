{
  class AudioPlayer extends HTMLElement {
    playing = true;
    volume = 0.4;
    prevVolume = 0.4;
    initialized = false;
    barWidth = 3;
    barGap = 1;
    bufferPercentage = 75;
    nonAudioAttributes = new Set(['title', 'bar-width', 'bar-gap', 'buffer-percentage']);
    
    constructor() {
      super();
      
      this.attachShadow({mode: 'open'});
      
      this.render();
      console.log(1);
      
    }
    
    static get observedAttributes() {
      return [
        // audio tag attributes
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
        'src', 'muted', 'crossorigin', 'loop', 'preload', 'autoplay',
        // the name of the audio
        'title',
        // the size of the frequency bar
        'bar-width',
        // the size of the gap between the bars
        'bar-gap',
        // the percentage of the frequency buffer data to represent
        // if the dataArray contains 1024 data points only a percentage of data will
        // be used to draw on the canvas
        'buffer-percentage'
      ];
    }
    
    async attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case 'src':
          this.initialized = false;
          this.initializeAudio();
          break;
        case 'muted':
          this.toggleMute(Boolean(this.audio?.getAttribute('muted')));
          break;
        case 'title':
          this.titleElement.textContent = newValue;
          break;
        case 'bar-width':
          this.barWidth = Number(newValue) || 3;
          break;
        case 'bar-gap':
          this.barGap = Number(newValue) || 1;
          break;
        case 'buffer-percentage':
          this.bufferPercentage = Number(newValue) || 75;
          break;
        default:
      }
      
      this.updateAudioAttributes(name, newValue);
    }
    
    updateAudioAttributes(name, value) {
      if (!this.audio || this.nonAudioAttributes.has(name)) return;
      
      // if the attribute was explicitly set on the audio-player tag
      // set it otherwise remove it
      if (this.attributes.getNamedItem(name)) {
        this.audio.setAttribute(name, value ?? '')
      } else {
        this.audio.removeAttribute(name);
      }
    }
    
    initializeAudio() {
      if (this.initialized) return;
      
      this.initialized = true;
      
      this.audioCtx = new AudioContext();
      this.gainNode = this.audioCtx.createGain();
      this.analyserNode = this.audioCtx.createAnalyser();
      this.track = this.audioCtx.createMediaElementSource(this.audio);
      
      this.analyserNode.fftSize = 2048;
      this.bufferLength = this.analyserNode.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
      this.analyserNode.getByteFrequencyData(this.dataArray);
      
      this.track
        .connect(this.gainNode)
        .connect(this.analyserNode)
        .connect(this.audioCtx.destination);
      
      this.changeVolume();

      // this.seekTo(3000)
    }
    
    
    attachEvents() {
      this.volumeBar.parentNode.addEventListener('click', e => {
        if (e.target === this.volumeBar.parentNode) {
          this.toggleMute();
        }
      }, false);
      
      this.playPauseBtn.addEventListener('click', this.togglePlay.bind(this), false);
      
      this.volumeBar.addEventListener('input', this.changeVolume.bind(this), false);
      
      this.progressBar.addEventListener('input', (e) => this.seekTo(this.progressBar.value), false);
      
      this.audio.addEventListener('loadedmetadata', () => {
        this.progressBar.max = this.audio.duration;
        this.durationEl.textContent = this.getTimeString(this.audio.duration);
        this.updateAudioTime();
      })
      
      this.audio.addEventListener('error', (e) => {
        this.titleElement.textContent = this.audio.error.message;
        this.playPauseBtn.disabled = true;
      })
      
      this.audio.addEventListener('timeupdate', () => {
        this.updateAudioTime(this.audio.currentTime);
      })
      
   
    }
    
    async togglePlay() {
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      
      if (this.playing) {
        return this.audio.pause();
      }
      
      return this.audio.play();
    }
    
    getTimeString(time) {
      const secs = `${parseInt(`${time % 60}`, 10)}`.padStart(2, '0');
      const min = parseInt(`${(time / 60) % 60}`, 10);
  
      return `${min}:${secs}`;
    }
    
    changeVolume() {
      this.volume = Number(this.volumeBar.value);
      
      if (Number(this.volume) > 1) {
        this.volumeBar.parentNode.className = 'volume-bar over';
      } else if (Number(this.volume) > 0) {
        this.volumeBar.parentNode.className = 'volume-bar half';
      } else {
        this.volumeBar.parentNode.className = 'volume-bar';
      }
      
      if (this.gainNode) {
        this.gainNode.gain.value = this.volume;
      }
    }
    
    toggleMute(muted = null) {
      this.volumeBar.value = muted || this.volume === 0 ? this.prevVolume : 0;
      this.changeVolume();
    }
    

    //imposta il tempo all'interno della canzone 
    //valore passato in secondi
    seekTo(value) {
      this.audio.currentTime = value;
    }

    
   shuffle(array) {
      let currentIndex = array.length;
   
        let randomIndex = Math.floor(Math.random() * currentIndex);
     
      return  array[randomIndex]
    }

    updateAudioTime() {
      this.progressBar.value = this.audio.currentTime;
      this.currentTimeEl.textContent = this.getTimeString(this.audio.currentTime);
    }
    
    style() {
      return `
      <style>
        :host {
          width: 100%;
          max-width: 400px;
          font-family: sans-serif;
        }
        .span{
          display: block;
        }       
      </style>
    `
    }
    
    render() {
      this.shadowRoot.innerHTML = `
       ${this.style()}
        <figure class="audio-player">
          <figcaption class="audio-name"></figcaption>
          <audio></audio>
          <button class="play-btn" type="button">play</button>
          <div class="progress-indicator">
              <span class="current-time">0:0</span>
              <input type="range" max="100" value="0" class="progress-bar">
              <span class="duration">0:00</span>
              <canvas class="visualizer"></canvas>
          </div>
          <div class="volume-bar">
              <input type="range" min="0" max="2" step="0.01" value="${this.volume}" class="volume-field">
          </div>
        </figure>
      `;
      
      this.audio = this.shadowRoot.querySelector('audio');
      this.playPauseBtn = this.shadowRoot.querySelector('.play-btn');
      this.titleElement = this.shadowRoot.querySelector('.audio-name');
      this.volumeBar = this.shadowRoot.querySelector('.volume-field');
      this.progressIndicator = this.shadowRoot.querySelector('.progress-indicator');
      this.currentTimeEl = this.progressIndicator.children[0];
      this.progressBar = this.progressIndicator.children[1];
      this.durationEl = this.progressIndicator.children[2];
      this.canvas = this.shadowRoot.querySelector('canvas');
      
      this.canvasCtx = this.canvas.getContext("2d");
      // support retina display on canvas for a more crispy/HD look
      const scale = window.devicePixelRatio;
      this.canvas.width = Math.floor(this.canvas.width* scale);
      this.canvas.height = Math.floor(this.canvas.height * scale);
      this.titleElement.textContent = this.attributes.getNamedItem('src')
        ? this.attributes.getNamedItem('title').value ?? 'untitled'
        : 'No Audio Source Provided';
      this.volumeBar.value = this.volume;
      
      // if rendering or re-rendering all audio attributes need to be reset
      for (let i = 0; i < this.attributes.length; i++) {
        const attr = this.attributes[i];
        this.updateAudioAttributes(attr.name, attr.value);
      }
      
      this.attachEvents();
      let arr = [0, 296, 600, 900,1680];
      let number = this.shuffle(arr);

      console.log(number);
      
      this.seekTo(number)
    }
  }
  
  customElements.define('audio-player', AudioPlayer);
}