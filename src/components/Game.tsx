import * as React from 'react';
import { useState, useEffect } from 'react';
import { Tv } from 'lucide-react';
import './Game.css';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const TV_SPEED = 2;
const TV_SPAWN_INTERVAL = 1000;
const FLASH_DURATION = 500;

interface TV {
  id: number;
  x: number;
  y: number;
}

interface Shot {
  id: number;
  x: number;
  y: number;
}

const Game: React.FC = () => {
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2);
  const [tvs, setTvs] = useState<TV[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [gameStarted, setGameStarted] = useState(false);

  // Key event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key]));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set([...prev]);
        newKeys.delete(e.key);
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const gameLoop = setInterval(() => {
      // Player movement
      if (keys.has('ArrowLeft')) {
        setPlayerX(x => Math.max(30, x - PLAYER_SPEED));
      }
      if (keys.has('ArrowRight')) {
        setPlayerX(x => Math.min(GAME_WIDTH - 30, x + PLAYER_SPEED));
      }

      // Move TVs
      setTvs(prevTvs => {
        return prevTvs.map(tv => ({
          ...tv,
          y: tv.y + TV_SPEED
        }));
      });

      // Move shots
      setShots(prevShots => {
        return prevShots.map(shot => ({
          ...shot,
          y: shot.y - 7
        }));
      });

      // Collision detection
      setTvs(prevTvs => {
        return prevTvs.filter(tv => {
          // Check if TV hit the ground
          if (tv.y >= GAME_HEIGHT - 30) {
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), FLASH_DURATION);
            setHealth(h => {
              const newHealth = h - 1;
              console.log('TV hit the ground, health:', newHealth);
              return newHealth;
            });
            return false;
          }

          // Check if TV was hit by a shot
          for (const shot of shots) {
            if (Math.abs(shot.x - tv.x) < 20 && Math.abs(shot.y - tv.y) < 20) {
              setScore(s => s + 100);
              return false;
            }
          }

          return true;
        });
      });

      // Clean up shots that are off screen
      setShots(prevShots => prevShots.filter(shot => shot.y > 0));

      // Check game over
      if (health <= 0) {
        console.log('Game over triggered');
        setGameOver(true);
      }
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [keys, health, gameOver, shots]);

  // Spawn TVs
  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const spawnTV = setInterval(() => {
      setTvs(prevTvs => [
        ...prevTvs,
        {
          id: Math.random(),
          x: Math.random() * (GAME_WIDTH - 60) + 30,
          y: -30
        }
      ]);
    }, TV_SPAWN_INTERVAL);

    return () => clearInterval(spawnTV);
  }, [gameOver, gameStarted]);

  // Shooting
  useEffect(() => {
    const handleShoot = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !gameOver) {
        setShots(prevShots => [
          ...prevShots,
          { id: Math.random(), x: playerX, y: GAME_HEIGHT - 60 }
        ]);
      }
    };

    window.addEventListener('keydown', handleShoot);
    return () => window.removeEventListener('keydown', handleShoot);
  }, [playerX, gameOver]);

  const handleRestart = () => {
    setPlayerX(GAME_WIDTH / 2);
    setTvs([]);
    setShots([]);
    setHealth(3);
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="game-container">
      {!gameStarted && (
        <div className="start-screen">
          <h2 className="start-title">Welcome to Terminal Velocity</h2>
          <button
            className="start-button"
            onClick={() => setGameStarted(true)}
          >
            Start Game
          </button>
        </div>
      )}

      {gameStarted && (
        <div className="game-board">
          {/* Test pattern flash effect */}
          {isFlashing && (
            <div className="flash-effect">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          )}

          {/* Game elements */}
          <div style={{ position: 'absolute', inset: 0 }}>
            {/* Player */}
            <div 
              className="player"
              style={{ left: playerX }}
            />

            {/* TVs */}
            {tvs.map(tv => (
              <div
                key={tv.id}
                className="tv"
                style={{ left: tv.x, top: tv.y }}
              >
                <Tv size={24} />
              </div>
            ))}

            {/* Shots */}
            {shots.map(shot => (
              <div
                key={shot.id}
                className="shot"
                style={{ left: shot.x, top: shot.y }}
              />
            ))}
          </div>

          {/* HUD */}
          <div className="hud">
            <div>SCORE: {score}</div>
            <div>HEALTH: {'♥'.repeat(Math.max(0, health))}</div>
          </div>

          {/* Game Over Screen */}
          {gameOver && (
            <div className="game-over-overlay">
              <div className="game-over-content">
                <h2 className="game-over-title animate-pulse">GAME OVER</h2>
                <div className="final-score-container">
                  <span className="score-label">FINAL SCORE:</span>
                  <span className="score-value">{score}</span>
                </div>
                <button
                  className="restart-button animate-fade-in-up"
                  onClick={handleRestart}
                >
                  <span className="button-text">PLAY AGAIN</span>
                  <span className="button-shadow"></span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="instructions">
        <p>Use ← → to move, SPACE to shoot</p>
        <p>Destroy the falling TVs before they reach the ground!</p>
      </div>
    </div>
  );
};

export default Game;
