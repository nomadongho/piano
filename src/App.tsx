import { useState } from 'react';
import { LevelSelect } from './components/LevelSelect';
import { GameMode } from './components/GameMode';
import { FreePlay } from './components/FreePlay';
import './styles/App.css';

type Screen = 'menu' | 'game' | 'freeplay';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedSong, setSelectedSong] = useState<string>('twinkle');

  const handleSelectSong = (songId: string) => {
    setSelectedSong(songId);
    setScreen('game');
  };

  return (
    <div className="app-container">
      {screen === 'menu' && (
        <LevelSelect onSelectSong={handleSelectSong} onFreePlay={() => setScreen('freeplay')} />
      )}
      {screen === 'game' && (
        <GameMode songId={selectedSong} onBack={() => setScreen('menu')} />
      )}
      {screen === 'freeplay' && (
        <FreePlay onBack={() => setScreen('menu')} />
      )}
    </div>
  );
}

export default App;
