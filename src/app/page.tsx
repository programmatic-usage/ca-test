'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

const GRID_SIZE = 20;
const CELL_SIZE = 24;
const INITIAL_SPEED = 150;

const HEROES = [
  { name: 'Spider-Man', emoji: '🕷️', color: '#E23636' },
  { name: 'Iron Man', emoji: '🤖', color: '#AA0505' },
  { name: 'Captain America', emoji: '🛡️', color: '#0033A0' },
  { name: 'Thor', emoji: '⚡', color: '#F0E68C' },
  { name: 'Hulk', emoji: '💪', color: '#70C931' },
  { name: 'Black Widow', emoji: '🕸️', color: '#2B2B2B' },
];

const INFINITY_STONES = [
  { name: 'Space', color: '#3B82F6', emoji: '💙' },
  { name: 'Mind', color: '#FBBF24', emoji: '💛' },
  { name: 'Reality', color: '#EF4444', emoji: '❤️' },
  { name: 'Power', color: '#9333EA', emoji: '💜' },
  { name: 'Time', color: '#10B981', emoji: '💚' },
  { name: 'Soul', color: '#F97316', emoji: '🧡' },
];

export default function MegaSnakeGame() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [selectedHero, setSelectedHero] = useState(0);
  const [stonesCollected, setStonesCollected] = useState<string[]>([]);
  const [currentStone, setCurrentStone] = useState(0);
  const [combo, setCombo] = useState(0);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hero = HEROES[selectedHero];

  const generateFood = useCallback((): Position => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }, []);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('RIGHT');
    setFood(generateFood());
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setStonesCollected([]);
    setCurrentStone(0);
    setCombo(0);
  }, [generateFood]);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('PLAYING');
  }, [resetGame]);

  const togglePause = useCallback(() => {
    setGameState(prev => prev === 'PLAYING' ? 'PAUSED' : 'PLAYING');
  }, []);

  const changeHero = useCallback((index: number) => {
    setSelectedHero(index);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'MENU' || gameState === 'GAME_OVER') {
        if (e.code === 'Space' || e.code === 'Enter') {
          startGame();
        }
        return;
      }

      if (gameState === 'PAUSED') {
        if (e.code === 'Space') {
          togglePause();
        }
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        case 'Space':
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameState, startGame, togglePause]);

  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead: Position = { ...head };

        switch (direction) {
          case 'UP':
            newHead.y -= 1;
            break;
          case 'DOWN':
            newHead.y += 1;
            break;
          case 'LEFT':
            newHead.x -= 1;
            break;
          case 'RIGHT':
            newHead.x += 1;
            break;
        }

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setGameState('GAME_OVER');
          if (score > highScore) {
            setHighScore(score);
          }
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          const stoneName = INFINITY_STONES[currentStone].name;
          if (!stonesCollected.includes(stoneName)) {
            setStonesCollected(prev => [...prev, stoneName]);
          }
          setCurrentStone((prev) => (prev + 1) % INFINITY_STONES.length);
          setScore(prev => prev + 10 + combo * 5);
          setCombo(prev => Math.min(prev + 1, 5));
          setSpeed(prev => Math.max(prev - 5, 60));
          setFood(generateFood());
        } else {
          newSnake.pop();
          setCombo(0);
        }

        return newSnake;
      });
    }, speed);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [direction, food, gameState, generateFood, score, highScore, speed, currentStone, combo, stonesCollected]);

  const getStoneGlow = () => {
    if (stonesCollected.length === 0) return 'none';
    const glowColors = stonesCollected.map(stone => {
      const stoneData = INFINITY_STONES.find(s => s.name === stone);
      return stoneData?.color;
    }).filter(Boolean).join(', ');
    return `0 0 30px ${glowColors || 'transparent'}`;
  };

  const isGameWon = stonesCollected.length === INFINITY_STONES.length;

  if (gameState === 'MENU') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-4">🕷️</div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 mb-4">
            MEGA SNAKE
          </h1>
          <p className="text-xl text-purple-300 mb-8">MARVEL EDITION</p>
          
          <div className="mb-8">
            <p className="text-white/80 mb-4">Choose Your Hero:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {HEROES.map((h, index) => (
                <button
                  key={h.name}
                  onClick={() => changeHero(index)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    selectedHero === index
                      ? 'bg-white text-black scale-110 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span className="mr-2">{h.emoji}</span>
                  {h.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <p className="text-white/60 text-sm mb-4">Collect all 6 Infinity Stones:</p>
            <div className="flex justify-center gap-2">
              {INFINITY_STONES.map((stone) => (
                <div
                  key={stone.name}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg"
                  style={{ backgroundColor: stone.color }}
                >
                  {stone.emoji}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-12 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-xl rounded-full hover:scale-105 transition-transform shadow-lg shadow-red-500/30"
          >
            PLAY AS {hero.name.toUpperCase()}
          </button>
          
          <p className="text-white/40 mt-6 text-sm">
            Use Arrow Keys or WASD to move • Space to pause
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center justify-between w-full max-w-lg">
            <div className="flex items-center gap-4">
              <div 
                className="text-4xl"
                style={{ filter: `drop-shadow(${getStoneGlow()})` }}
              >
                {hero.emoji}
              </div>
              <div>
                <p className="text-white font-bold">{hero.name}</p>
                <p className="text-white/60 text-sm">Score: <span className="text-yellow-400 font-mono text-lg">{score}</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">High Score</p>
              <p className="text-white font-mono text-xl">{highScore}</p>
            </div>
          </div>

          <div className="flex gap-1 mb-2">
            {INFINITY_STONES.map((stone) => (
              <div
                key={stone.name}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  stonesCollected.includes(stone.name)
                    ? 'scale-100 opacity-100 shadow-lg'
                    : 'scale-75 opacity-30'
                }`}
                style={{ 
                  backgroundColor: stone.color,
                  boxShadow: stonesCollected.includes(stone.name) ? `0 0 15px ${stone.color}` : 'none'
                }}
              >
                {stone.emoji}
              </div>
            ))}
          </div>

          <div 
            ref={containerRef}
            className="relative bg-black/50 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl"
            style={{
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
            }}
          >
            <div className="absolute inset-0 grid grid-cols-20 opacity-20">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                <div key={i} className="border border-white/5" />
              ))}
            </div>

            {snake.map((segment, index) => (
              <div
                key={index}
                className="absolute rounded-lg flex items-center justify-center transition-all"
                style={{
                  left: segment.x * CELL_SIZE,
                  top: segment.y * CELL_SIZE,
                  width: CELL_SIZE - 1,
                  height: CELL_SIZE - 1,
                  backgroundColor: hero.color,
                  boxShadow: `0 0 ${index === 0 ? '15px' : '5px'} ${hero.color}`,
                  zIndex: snake.length - index,
                }}
              >
                {index === 0 && (
                  <span className="text-sm">{hero.emoji}</span>
                )}
              </div>
            ))}

            <div
              className="absolute rounded-full flex items-center justify-center animate-pulse"
              style={{
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: INFINITY_STONES[currentStone].color,
                boxShadow: `0 0 20px ${INFINITY_STONES[currentStone].color}`,
              }}
            >
              <span className="text-lg">{INFINITY_STONES[currentStone].emoji}</span>
            </div>

            {gameState === 'PAUSED' && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-4xl font-black text-white mb-4">PAUSED</p>
                  <button
                    onClick={togglePause}
                    className="px-6 py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
                  >
                    RESUME
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="text-white/40 text-sm">
              {combo > 0 && (
                <span className="text-yellow-400 font-bold animate-pulse">
                  🔥 COMBO x{combo}!
                </span>
              )}
            </div>
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              {gameState === 'PAUSED' ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={() => setGameState('MENU')}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Menu
            </button>
          </div>
        </div>
      </div>

      {gameState === 'GAME_OVER' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl text-center max-w-md border border-white/10">
            <div className="text-6xl mb-4">
              {isGameWon ? '🏆' : '💀'}
            </div>
            <h2 className="text-4xl font-black text-white mb-2">
              {isGameWon ? 'YOU WON!' : 'GAME OVER'}
            </h2>
            <p className="text-white/60 mb-6">
              {isGameWon 
                ? 'You collected all Infinity Stones!' 
                : `${hero.name} has fallen...`}
            </p>
            
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-white/60 text-sm">Final Score</p>
              <p className="text-4xl font-black text-yellow-400">{score}</p>
              {score === highScore && score > 0 && (
                <p className="text-green-400 text-sm mt-1">🎉 New High Score!</p>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={startGame}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-full hover:scale-105 transition-transform"
              >
                Play Again
              </button>
              <button
                onClick={() => setGameState('MENU')}
                className="px-6 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
