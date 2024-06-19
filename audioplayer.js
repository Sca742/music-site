let times = [
    "00:00:00.00",
    "02:28:12.40",
    "03:23:06.20",
    "07:13:12.40",
    "09:34:00.00",
    "10:56:21.70"
].map(timeStringToSeconds);

function timeStringToSeconds(timeString) {
  const [minutes, seconds] = timeString.split(':');
  const [wholeSeconds, fraction] = seconds.split('.').map(Number);
  return parseInt(minutes) * 60 + wholeSeconds + (fraction ? fraction / 100 : 0);
};

class AudioPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
        this.addKeyboardListener();
    }

    static get observedAttributes() {
        return ['src', 'loop', 'preload', 'autoplay'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.audio) {
            if (newValue === null) {
                this.audio.removeAttribute(name);
            } else {
                this.audio.setAttribute(name, newValue);
            }
        }
    }

    connectedCallback() {
        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i];
            this.attributeChangedCallback(attr.name, null, attr.value);
        }
        this.audio.volume = 0.4;
        this.audio.currentTime = this.getRandomStartTime();
    }

    getRandomStartTime() {
        return times[Math.floor(Math.random() * times.length)];
    }

    seekTo(value) {
        if (this.audio) {
            this.audio.currentTime = value;
        }
        console.log(this.audio.currentTime);
    }

    addKeyboardListener() {
        window.addEventListener('keydown', (event) => {
          const key = parseInt(event.key, 10);
            switch (key) {
              case 1:
                this.seekTo(times[0]);
                break;
                case 2:
                  this.seekTo(times[1]);
                  break;
                case 3:
                  this.seekTo(times[2]);
                  break;
                case 4:
                  this.seekTo(times[3]);
                  break;
                case 5:
                  this.seekTo(times[4]);
                  break;
                case 6:
                  this.seekTo(times[5]);
                  break;
              default:
                break;
            }
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <figure class="audio-player">
                <audio></audio>
            </figure>
        `;
        this.audio = this.shadowRoot.querySelector('audio');
    }
}

customElements.define('audio-player', AudioPlayer);
