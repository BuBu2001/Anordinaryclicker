import { useState, useEffect, useCallback, useRef } from 'react';

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  icon: string;
  purchased: boolean;
}

interface LevelInfo {
  level: number;
  name: string;
  requiredClicks: number;
  color: string;
  emoji: string;
}

const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Новичок', requiredClicks: 0, color: 'from-gray-400 to-gray-600', emoji: '🐣' },
  { level: 2, name: 'Ученик', requiredClicks: 20, color: 'from-green-400 to-green-600', emoji: '🌱' },
  { level: 3, name: 'Практик', requiredClicks: 50, color: 'from-blue-400 to-blue-600', emoji: '💪' },
  { level: 4, name: 'Мастер', requiredClicks: 120, color: 'from-purple-400 to-purple-600', emoji: '⚡' },
  { level: 5, name: 'Эксперт', requiredClicks: 250, color: 'from-orange-400 to-orange-600', emoji: '🔥' },
  { level: 6, name: 'Гуру', requiredClicks: 500, color: 'from-red-400 to-red-600', emoji: '🌋' },
  { level: 7, name: 'Легенда', requiredClicks: 1000, color: 'from-yellow-400 to-yellow-600', emoji: '⭐' },
  { level: 8, name: 'Мифический', requiredClicks: 2000, color: 'from-pink-400 to-pink-600', emoji: '🦄' },
  { level: 9, name: 'Божественный', requiredClicks: 5000, color: 'from-cyan-400 to-cyan-600', emoji: '👑' },
  { level: 10, name: 'Трансцендентный', requiredClicks: 10000, color: 'from-violet-400 to-fuchsia-600', emoji: '🌌' },
];

const INITIAL_UPGRADES: Upgrade[] = [
  { id: 'double', name: 'Двойной клик', description: 'Каждый клик = 2', cost: 30, multiplier: 2, icon: '✌️', purchased: false },
  { id: 'triple', name: 'Тройной клик', description: 'Каждый клик = 3', cost: 80, multiplier: 3, icon: '🤟', purchased: false },
  { id: 'mega', name: 'Мега клик', description: 'Каждый клик = 5', cost: 200, multiplier: 5, icon: '💥', purchased: false },
  { id: 'ultra', name: 'Ультра клик', description: 'Каждый клик = 10', cost: 500, multiplier: 10, icon: '🚀', purchased: false },
  { id: 'quantum', name: 'Квантовый клик', description: 'Каждый клик = 25', cost: 1500, multiplier: 25, icon: '🔮', purchased: false },
  { id: 'cosmic', name: 'Космический клик', description: 'Каждый клик = 50', cost: 4000, multiplier: 50, icon: '🌠', purchased: false },
];

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  value: number;
}

function App() {
  const [clicks, setClicks] = useState(() => {
    const saved = localStorage.getItem('clicker_clicks');
    return saved ? parseInt(saved) : 0;
  });
  const [totalClicks, setTotalClicks] = useState(() => {
    const saved = localStorage.getItem('clicker_total');
    return saved ? parseInt(saved) : 0;
  });
  const [clickPower, setClickPower] = useState(() => {
    const saved = localStorage.getItem('clicker_power');
    return saved ? parseInt(saved) : 1;
  });
  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => {
    const saved = localStorage.getItem('clicker_upgrades');
    return saved ? JSON.parse(saved) : INITIAL_UPGRADES;
  });
  const [effects, setEffects] = useState<ClickEffect[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [cps, setCps] = useState(0);
  const clickTimesRef = useRef<number[]>([]);
  const effectIdRef = useRef(0);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('clicker_clicks', clicks.toString());
    localStorage.setItem('clicker_total', totalClicks.toString());
    localStorage.setItem('clicker_power', clickPower.toString());
    localStorage.setItem('clicker_upgrades', JSON.stringify(upgrades));
  }, [clicks, totalClicks, clickPower, upgrades]);

  // Calculate current level
  const getCurrentLevel = useCallback(() => {
    let currentLevel = LEVELS[0];
    for (const level of LEVELS) {
      if (totalClicks >= level.requiredClicks) {
        currentLevel = level;
      }
    }
    return currentLevel;
  }, [totalClicks]);

  const currentLevel = getCurrentLevel();
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);

  // Check for level up
  const prevLevelRef = useRef(currentLevel.level);
  useEffect(() => {
    if (currentLevel.level > prevLevelRef.current) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2500);
    }
    prevLevelRef.current = currentLevel.level;
  }, [currentLevel.level]);

  // CPS calculation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 1000);
      setCps(clickTimesRef.current.length * clickPower);
    }, 200);
    return () => clearInterval(interval);
  }, [clickPower]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClicks(prev => prev + clickPower);
    setTotalClicks(prev => prev + clickPower);
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 100);

    // Add floating effect
    const effectId = effectIdRef.current++;
    setEffects(prev => [...prev, { id: effectId, x, y, value: clickPower }]);
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== effectId));
    }, 1000);

    // Track for CPS
    clickTimesRef.current.push(Date.now());
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (clicks >= upgrade.cost && !upgrade.purchased) {
      setClicks(prev => prev - upgrade.cost);
      setClickPower(upgrade.multiplier);
      setUpgrades(prev => prev.map(u =>
        u.id === upgrade.id ? { ...u, purchased: true } : u
      ));
    }
  };

  const getProgress = () => {
    if (!nextLevel) return 100;
    const currentReq = currentLevel.requiredClicks;
    const nextReq = nextLevel.requiredClicks;
    const progress = ((totalClicks - currentReq) / (nextReq - currentReq)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const resetGame = () => {
    if (confirm('Вы уверены? Весь прогресс будет потерян!')) {
      setClicks(0);
      setTotalClicks(0);
      setClickPower(1);
      setUpgrades(INITIAL_UPGRADES);
      localStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white overflow-hidden">
      {/* Level Up Animation */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce text-center">
            <div className="text-8xl mb-4 animate-pulse">{currentLevel.emoji}</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
              Уровень {currentLevel.level}!
            </div>
            <div className="text-2xl text-yellow-200 mt-2">{currentLevel.name}</div>
          </div>
        </div>
      )}

      {/* Background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
            🎮 Кликер
          </h1>
          <p className="text-gray-400 text-lg">Путь к Мастерству</p>
        </div>

        {/* Level Display */}
        <div className={`text-center mb-6 p-4 rounded-2xl bg-gradient-to-r ${currentLevel.color} bg-opacity-20 backdrop-blur-sm border border-white/10`}>
          <div className="text-5xl mb-2">{currentLevel.emoji}</div>
          <div className="text-2xl font-bold">
            Уровень {currentLevel.level}: {currentLevel.name}
          </div>
          {nextLevel && (
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Прогресс</span>
                <span>{totalClicks} / {nextLevel.requiredClicks} кликов</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${currentLevel.color} rounded-full transition-all duration-300 ease-out`}
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>
          )}
          {!nextLevel && (
            <div className="mt-2 text-yellow-300 font-bold text-lg">🏆 Максимальный уровень достигнут!</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Stats */}
          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <h3 className="text-lg font-bold mb-3 text-purple-300">📊 Статистика</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Всего кликов:</span>
                  <span className="font-bold text-green-400">{totalClicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Доступно:</span>
                  <span className="font-bold text-yellow-400">{clicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Сила клика:</span>
                  <span className="font-bold text-cyan-400">×{clickPower}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Кликов/сек:</span>
                  <span className="font-bold text-pink-400">{cps}</span>
                </div>
              </div>
            </div>

            {/* Levels list */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <h3 className="text-lg font-bold mb-3 text-purple-300">🏆 Уровни</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {LEVELS.map(level => (
                  <div
                    key={level.level}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                      level.level === currentLevel.level
                        ? 'bg-white/10 border border-white/20 scale-105'
                        : totalClicks >= level.requiredClicks
                        ? 'opacity-70'
                        : 'opacity-40'
                    }`}
                  >
                    <span className="text-xl">{level.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold">{level.name}</div>
                      <div className="text-xs text-gray-400">{level.requiredClicks} кликов</div>
                    </div>
                    {totalClicks >= level.requiredClicks && (
                      <span className="text-green-400">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Click Button */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <button
                onClick={handleClick}
                className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-br ${currentLevel.color} 
                  shadow-2xl transition-all duration-100 active:scale-95 hover:shadow-3xl hover:scale-105
                  ${isPressed ? 'scale-90' : 'scale-100'}
                  border-4 border-white/20 cursor-pointer select-none`}
                style={{
                  boxShadow: `0 0 40px rgba(168, 85, 247, 0.4), 0 0 80px rgba(168, 85, 247, 0.2)`,
                }}
              >
                <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm" />
                <div className="relative z-10 text-center">
                  <div className="text-6xl md:text-7xl mb-2">{currentLevel.emoji}</div>
                  <div className="text-lg font-bold text-white/90">КЛИК!</div>
                  <div className="text-sm text-white/70">+{clickPower}</div>
                </div>
              </button>

              {/* Click effects */}
              {effects.map(effect => (
                <div
                  key={effect.id}
                  className="absolute pointer-events-none text-yellow-300 font-bold text-xl animate-float-up"
                  style={{
                    left: effect.x,
                    top: effect.y,
                  }}
                >
                  +{effect.value}
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                {clicks.toLocaleString()}
              </div>
              <div className="text-gray-400 mt-1">очков доступно</div>
            </div>

            <button
              onClick={resetGame}
              className="mt-6 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm hover:bg-red-500/30 transition-colors"
            >
              🔄 Сбросить прогресс
            </button>
          </div>

          {/* Right - Upgrades */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <h3 className="text-lg font-bold mb-3 text-purple-300">🛒 Улучшения</h3>
            <div className="space-y-3">
              {upgrades.map(upgrade => (
                <div
                  key={upgrade.id}
                  className={`p-3 rounded-xl border transition-all ${
                    upgrade.purchased
                      ? 'bg-green-500/10 border-green-500/30'
                      : clicks >= upgrade.cost
                      ? 'bg-white/5 border-white/20 hover:bg-white/10 cursor-pointer hover:scale-[1.02]'
                      : 'bg-white/5 border-white/5 opacity-50'
                  }`}
                  onClick={() => !upgrade.purchased && buyUpgrade(upgrade)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{upgrade.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{upgrade.name}</div>
                      <div className="text-xs text-gray-400">{upgrade.description}</div>
                    </div>
                    <div className="text-right">
                      {upgrade.purchased ? (
                        <span className="text-green-400 text-sm font-bold">✓ Куплено</span>
                      ) : (
                        <div className={`text-sm font-bold ${clicks >= upgrade.cost ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {upgrade.cost} 🪙
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
