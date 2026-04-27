import { SONGS } from '../data/songs';

interface LevelSelectProps {
  onSelectSong: (songId: string) => void;
  onFreePlay: () => void;
}

const LEVEL_COLORS = [
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

export function LevelSelect({ onSelectSong, onFreePlay }: LevelSelectProps) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ fontSize: 60 }}>🎹</div>
        <h1 style={{ fontSize: 42, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '10px 0' }}>
          Leo's Piano Practice
        </h1>
        <p style={{ fontSize: 18, color: '#666' }}>Choose a song to practice or play freely!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        {SONGS.map((song, i) => (
          <button
            key={song.id}
            onClick={() => onSelectSong(song.id)}
            style={{
              background: LEVEL_COLORS[i % LEVEL_COLORS.length],
              border: 'none',
              borderRadius: 20,
              padding: '24px 16px',
              cursor: 'pointer',
              color: 'white',
              textAlign: 'center',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              fontSize: 15,
            }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 28px rgba(0,0,0,0.2)'; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>{song.emoji}</div>
            <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{song.title}</div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>Level {song.level}</div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>{song.notes.length} notes</div>
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button
          onClick={onFreePlay}
          style={{
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            border: 'none',
            borderRadius: 50,
            padding: '16px 48px',
            fontSize: 20,
            cursor: 'pointer',
            fontWeight: 'bold',
            color: '#333',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
          }}
        >
          🎵 Free Play Mode
        </button>
      </div>
    </div>
  );
}
