import 'plyr/dist/plyr.css'
import '@/assets/styles/plyr.less'

import Plyr from 'plyr'

const locales = {
  'en-US': {
    restart: 'Restart',
    rewind: 'Rewind {seektime}s',
    play: 'Play',
    pause: 'Pause',
    fastForward: 'Forward {seektime}s',
    seek: 'Seek',
    seekLabel: '{currentTime} of {duration}',
    played: 'Played',
    buffered: 'Buffered',
    currentTime: 'Current time',
    duration: 'Duration',
    volume: 'Volume',
    mute: 'Mute',
    unmute: 'Unmute',
    enableCaptions: 'Enable captions',
    disableCaptions: 'Disable captions',
    download: 'Download',
    enterFullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    frameTitle: 'Player for {title}',
    captions: 'Captions',
    settings: 'Settings',
    pip: 'PIP',
    menuBack: 'Go back to previous menu',
    speed: 'Speed',
    normal: 'Normal',
    quality: 'Quality',
    loop: 'Loop',
    start: 'Start',
    end: 'End',
    all: 'All',
    reset: 'Reset',
    disabled: 'Disabled',
    enabled: 'Enabled',
  },
}

export const mediaPlayer = (container: HTMLElement) => {
  return new Plyr(container, {
    i18n: locales['en-US'],
    settings: [],
    tooltips: { controls: true },
    storage: { key: 'arslan-editor:player' },
    disableContextMenu: false,
  })
}
