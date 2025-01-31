Game code example:

```
import React, { useState, useEffect, useCallback } from 'react';
import { Tv } from 'lucide-react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const TV_SPEED = 2;
const TV_SPAWN_INTERVAL = 1000;
const FLASH_DURATION = 500;

const Game = () => {
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2);
  const [tvs, setTvs] = useState([]);
  const [shots, setShots] = useState([]);
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [keys, setKeys] = useState(new Set());

  // Key event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys(prev => new Set([...prev, e.key]));
    };

    const handleKeyUp = (e) => {
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
    if (gameOver) return;

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
        const survivingTvs = prevTvs.filter(tv => {
          // Check if TV hit the ground
          if (tv.y >= GAME_HEIGHT - 30) {
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), FLASH_DURATION);
            setHealth(h => h - 1);
            return false;
          }

          // Check if TV was hit by a shot
          const wasHit = shots.some(shot => 
            Math.abs(shot.x - tv.x) < 20 && 
            Math.abs(shot.y - tv.y) < 20
          );

          if (wasHit) {
            setScore(s => s + 100);
            return false;
          }

          return true;
        });

        return survivingTvs;
      });

      // Clean up shots that are off screen
      setShots(prevShots => prevShots.filter(shot => shot.y > 0));

      // Check game over
      if (health <= 0) {
        setGameOver(true);
      }
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [keys, health, gameOver]);

  // Spawn TVs
  useEffect(() => {
    if (gameOver) return;

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
  }, [gameOver]);

  // Shooting
  useEffect(() => {
    const handleShoot = (e) => {
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
    <div className="relative w-full max-w-4xl mx-auto">
      <div 
        className="relative overflow-hidden border-4 border-gray-800"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Test pattern flash effect */}
        {isFlashing && (
          <div className="absolute inset-0 z-20">
            <div className="flex h-full">
              <div className="w-1/6 bg-red-500"></div>
              <div className="w-1/6 bg-green-500"></div>
              <div className="w-1/6 bg-blue-500"></div>
              <div className="w-1/6 bg-yellow-500"></div>
              <div className="w-1/6 bg-purple-500"></div>
              <div className="w-1/6 bg-cyan-500"></div>
            </div>
          </div>
        )}

        {/* Game elements */}
        <div className="absolute inset-0 bg-black">
          {/* Player */}
          <div 
            className="absolute bottom-0 transform -translate-x-1/2"
            style={{ left: playerX }}
          >
            <div className="w-12 h-12 bg-green-500"></div>
          </div>

          {/* TVs */}
          {tvs.map(tv => (
            <div
              key={tv.id}
              className="absolute transform -translate-x-1/2"
              style={{ left: tv.x, top: tv.y }}
            >
              <Tv size={24} className="text-white" />
            </div>
          ))}

          {/* Shots */}
          {shots.map(shot => (
            <div
              key={shot.id}
              className="absolute w-2 h-4 bg-yellow-400 transform -translate-x-1/2"
              style={{ left: shot.x, top: shot.y }}
            ></div>
          ))}
        </div>

        {/* HUD */}
        <div className="absolute top-4 left-4 text-white font-mono">
          <div>SCORE: {score}</div>
          <div>HEALTH: {'♥'.repeat(health)}</div>
        </div>

        {/* Game Over */}
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white font-mono">
              <h2 className="text-4xl mb-4">GAME OVER</h2>
              <p className="text-xl mb-4">Final Score: {score}</p>
              <button
                className="px-4 py-2 bg-white text-black hover:bg-gray-200"
                onClick={handleRestart}
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center font-mono">
        <p>Use ← → to move, SPACE to shoot</p>
      </div>
    </div>
  );
};

export default Game;
```