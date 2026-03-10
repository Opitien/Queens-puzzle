import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Undo2,
  Crown,
  Info,
  Layers,
  Settings,
  Network
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
type Pos = { r: number; c: number };
type Mode = 'play' | 'algorithm' | 'explore';
type AlgoType = 'backtracking' | 'min-conflicts';
type BoardSize = 4 | 6 | 8 | 10 | 12;

// --- UTILS ---
const isAttacking = (q1: Pos, q2: Pos) => {
  return q1.r === q2.r || q1.c === q2.c || Math.abs(q1.r - q2.r) === Math.abs(q1.c - q2.c);
};

const getAttackedSquares = (board: Pos[], n: number): boolean[][] => {
  const attacked = Array(n).fill(null).map(() => Array(n).fill(false));
  board.forEach(q => {
    for (let i = 0; i < n; i++) {
      attacked[q.r][i] = true;
      attacked[i][q.c] = true;
      // Diagonals
      if (q.r + i < n && q.c + i < n) attacked[q.r + i][q.c + i] = true;
      if (q.r - i >= 0 && q.c - i >= 0) attacked[q.r - i][q.c - i] = true;
      if (q.r + i < n && q.c - i >= 0) attacked[q.r + i][q.c - i] = true;
      if (q.r - i >= 0 && q.c + i < n) attacked[q.r - i][q.c + i] = true;
    }
  });
  return attacked;
};

const hasConflicts = (board: Pos[]) => {
  for (let i = 0; i < board.length; i++) {
    for (let j = i + 1; j < board.length; j++) {
      if (isAttacking(board[i], board[j])) return true;
    }
  }
  return false;
};

const solveAllSync = (n: number) => {
  const solutions: Pos[][] = [];
  const cols = new Set<number>();
  const diag1 = new Set<number>();
  const diag2 = new Set<number>();

  const solve = (row: number, currentBoard: Pos[]) => {
    if (row === n) {
      solutions.push([...currentBoard]);
      return;
    }
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue;
      cols.add(col); diag1.add(row - col); diag2.add(row + col);
      currentBoard.push({ r: row, c: col });
      solve(row + 1, currentBoard);
      cols.delete(col); diag1.delete(row - col); diag2.delete(row + col);
      currentBoard.pop();
    }
  };
  solve(0, []);
  return solutions;
};

// SYMMETRY UTILS
const getSymmetries = (board: Pos[], n: number): Pos[][] => {
  const b = Array(n).fill(0);
  board.forEach(q => b[q.r] = q.c);

  const rot90 = Array(n).fill(0);
  const rot180 = Array(n).fill(0);
  const rot270 = Array(n).fill(0);
  const refH = Array(n).fill(0);
  const refV = Array(n).fill(0);
  const refD1 = Array(n).fill(0);
  const refD2 = Array(n).fill(0);

  for(let r=0; r<n; r++) {
    const c = b[r];
    rot90[c] = n - 1 - r;
    rot180[n - 1 - r] = n - 1 - c;
    rot270[n - 1 - c] = r;
    refH[r] = n - 1 - c;
    refV[n - 1 - r] = c;
    refD1[c] = r;
    refD2[n - 1 - c] = n - 1 - r;
  }

  const toPos = (arr: number[]) => arr.map((c, r) => ({r, c}));
  return [b, rot90, rot180, rot270, refH, refV, refD1, refD2].map(toPos);
};

const getBoardString = (board: Pos[]) => {
  const arr = Array(board.length).fill(0);
  board.forEach(q => arr[q.r] = q.c);
  return arr.join(',');
};

const groupSolutions = (solutions: Pos[][], n: number) => {
  const groups = new Map<string, Pos[][]>();
  
  solutions.forEach(sol => {
    const syms = getSymmetries(sol, n);
    const strings = syms.map(getBoardString);
    const canonical = [...strings].sort()[0];

    if (!groups.has(canonical)) {
      groups.set(canonical, []);
    }
    
    const currentGroup = groups.get(canonical)!;
    const solStr = getBoardString(sol);
    if (!currentGroup.some(existing => getBoardString(existing) === solStr)) {
      currentGroup.push(sol);
    }
  });
  
  return Array.from(groups.values());
};

// --- VISUALIZER GENERATORS ---
type AlgoYield = {
  board: Pos[];
  active?: Pos;
  isConflict?: boolean;
  msg: string;
  steps: number;
  secondaryMetric: number;
  isDone?: boolean;
};

function* nQueensVisualizer(n: number): Generator<AlgoYield, void, unknown> {
  const board: Pos[] = [];
  let steps = 0;
  let backtracks = 0;
  const cols = new Set<number>();
  const diag1 = new Set<number>();
  const diag2 = new Set<number>();

  function* solve(row: number): Generator<AlgoYield, boolean, unknown> {
    if (row === n) return true;

    for (let col = 0; col < n; col++) {
      steps++;
      yield { 
        board: [...board], active: { r: row, c: col }, 
        msg: `Checking square (Row ${row + 1}, Col ${String.fromCharCode(65 + col)})`,
        steps, secondaryMetric: backtracks 
      };

      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) {
        yield { 
          board: [...board, { r: row, c: col }], active: { r: row, c: col }, isConflict: true,
          msg: `Conflict detected on (Row ${row + 1}, Col ${String.fromCharCode(65 + col)})`,
          steps, secondaryMetric: backtracks 
        };
        continue;
      }

      cols.add(col); diag1.add(row - col); diag2.add(row + col);
      board.push({ r: row, c: col });
      
      yield { 
        board: [...board], active: { r: row, c: col }, 
        msg: `Safe placement. Queen secured at (Row ${row + 1}, Col ${String.fromCharCode(65 + col)})`,
        steps, secondaryMetric: backtracks 
      };

      const success = yield* solve(row + 1);
      if (success) return true;

      board.pop();
      cols.delete(col); diag1.delete(row - col); diag2.delete(row + col);
      backtracks++;
      yield { 
        board: [...board], active: { r: row, c: col }, isConflict: true,
        msg: `Dead end reached. Backtracking from (Row ${row + 1}, Col ${String.fromCharCode(65 + col)})`,
        steps, secondaryMetric: backtracks 
      };
    }
    return false;
  }

  const success = yield* solve(0);
  yield { 
    board: [...board], 
    msg: success ? `Solution Found! Algorithm complete.` : `No solution exists.`,
    steps, secondaryMetric: backtracks, isDone: true
  };
}

function* minConflictsVisualizer(n: number): Generator<AlgoYield, void, unknown> {
  let steps = 0;
  let board: Pos[] = [];
  
  for (let c = 0; c < n; c++) {
    board.push({ r: Math.floor(Math.random() * n), c });
  }

  const getTotalConflicts = (b: Pos[]) => {
    let count = 0;
    for(let i=0; i<b.length; i++) {
      for(let j=i+1; j<b.length; j++) {
        if(isAttacking(b[i], b[j])) count++;
      }
    }
    return count;
  };

  const getPosConflicts = (r: number, c: number, currentBoard: Pos[]) => {
    let conflicts = 0;
    for (const q of currentBoard) {
      if (q.c === c && q.r === r) continue;
      if (q.c === c) continue;
      if (q.r === r) conflicts++;
      if (Math.abs(q.r - r) === Math.abs(q.c - c)) conflicts++;
    }
    return conflicts;
  };

  yield { board: [...board], msg: 'Initial random placement', steps, secondaryMetric: getTotalConflicts(board) };

  for (let iter = 0; iter < 1000; iter++) {
    const conflictedCols: number[] = [];
    for (let c = 0; c < n; c++) {
      const q = board.find(q => q.c === c);
      if (q && getPosConflicts(q.r, q.c, board) > 0) {
        conflictedCols.push(c);
      }
    }

    if (conflictedCols.length === 0) {
      yield { board: [...board], msg: 'Solution Found! Local search complete.', steps, secondaryMetric: 0, isDone: true };
      return;
    }

    const col = conflictedCols[Math.floor(Math.random() * conflictedCols.length)];
    const currentQ = board.find(q => q.c === col)!;
    
    steps++;
    yield { board: [...board], active: currentQ, isConflict: true, msg: `Selected conflicted queen in Col ${String.fromCharCode(65 + col)}`, steps, secondaryMetric: getTotalConflicts(board) };

    let minConflicts = Infinity;
    let bestRows: number[] = [];
    const boardWithoutCol = board.filter(q => q.c !== col);

    for (let r = 0; r < n; r++) {
      const conf = getPosConflicts(r, col, boardWithoutCol);
      if (conf < minConflicts) {
        minConflicts = conf;
        bestRows = [r];
      } else if (conf === minConflicts) {
        bestRows.push(r);
      }
    }

    const bestRow = bestRows[Math.floor(Math.random() * bestRows.length)];
    board = [...boardWithoutCol, { r: bestRow, c: col }];
    
    yield { board: [...board], active: { r: bestRow, c: col }, msg: `Moved to Row ${n - bestRow} (Local Conflicts: ${minConflicts})`, steps, secondaryMetric: getTotalConflicts(board) };
  }
  
  yield { board: [...board], msg: 'Max steps reached. Stuck in local minimum.', steps, secondaryMetric: getTotalConflicts(board), isDone: true };
}

// --- MAIN COMPONENT ---
export function QueensGambitLab() {
  const [mode, setMode] = useState<Mode>('play');
  const [n, setN] = useState<BoardSize>(8);
  
  // -- Play State --
  const [playBoard, setPlayBoard] = useState<Pos[]>([]);
  const [playHistory, setPlayHistory] = useState<Pos[][]>([]);
  const [showHint, setShowHint] = useState(false);
  
  // -- Algorithm State --
  const [algoType, setAlgoType] = useState<AlgoType>('backtracking');
  const algoGeneratorRef = useRef<Generator<AlgoYield, void, unknown> | null>(null);
  const [algoState, setAlgoState] = useState<{
    isRunning: boolean; speed: number; currentBoard: Pos[]; activeSquare: Pos | null;
    isConflict: boolean; msg: string; steps: number; secondaryMetric: number; isDone: boolean;
  }>({
    isRunning: false, speed: 500, currentBoard: [], activeSquare: null, isConflict: false,
    msg: 'Select strategy and press Start.', steps: 0, secondaryMetric: 0, isDone: false
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -- Explore State --
  const { allSolutions, solutionFamilies } = useMemo(() => {
    const all = solveAllSync(n);
    const families = groupSolutions(all, n);
    return { allSolutions: all, solutionFamilies: families };
  }, [n]);
  const [exploreFamilyIndex, setExploreFamilyIndex] = useState(0);
  const [exploreVariantIndex, setExploreVariantIndex] = useState(0);

  useEffect(() => {
    setExploreFamilyIndex(0);
    setExploreVariantIndex(0);
  }, [n]);

  const currentFamily = solutionFamilies[exploreFamilyIndex] || [];
  const activeExploreBoard = currentFamily[exploreVariantIndex] || [];

  // --- HANDLERS ---
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    stopAlgorithm();
  };

  const handleNChange = (newN: BoardSize) => {
    setN(newN);
    resetPlay();
    resetAlgorithm(newN);
  };

  const resetPlay = () => {
    setPlayBoard([]);
    setPlayHistory([]);
    setShowHint(false);
  };

  const onSquareClickPlay = (r: number, c: number) => {
    if (playBoard.length >= n && !playBoard.some(q => q.r === r && q.c === c)) return;
    setPlayHistory([...playHistory, playBoard]);
    if (playBoard.some(q => q.r === r && q.c === c)) {
      setPlayBoard(playBoard.filter(q => !(q.r === r && q.c === c)));
    } else {
      setPlayBoard([...playBoard, { r, c }]);
    }
  };

  const undoPlay = () => {
    if (playHistory.length > 0) {
      setPlayBoard(playHistory[playHistory.length - 1]);
      setPlayHistory(playHistory.slice(0, -1));
    }
  };

  const resetAlgorithm = (currentN: number = n) => {
    stopAlgorithm();
    algoGeneratorRef.current = null;
    setAlgoState(prev => ({
      ...prev, currentBoard: [], activeSquare: null, isConflict: false,
      msg: 'Ready. Press Start to run.', steps: 0, secondaryMetric: 0, isDone: false
    }));
  };

  const stepAlgorithm = useCallback(() => {
    if (!algoGeneratorRef.current) {
      algoGeneratorRef.current = algoType === 'backtracking' ? nQueensVisualizer(n) : minConflictsVisualizer(n);
    }
    const result = algoGeneratorRef.current.next();
    
    if (result.value) {
      setAlgoState(prev => ({
        ...prev, currentBoard: result.value!.board, activeSquare: result.value!.active || null,
        isConflict: !!result.value!.isConflict, msg: result.value!.msg,
        steps: result.value!.steps, secondaryMetric: result.value!.secondaryMetric,
        isDone: !!result.value!.isDone
      }));
    }
    
    if (result.done || result.value?.isDone) {
      stopAlgorithm();
    }
    return !result.done && !result.value?.isDone;
  }, [n, algoType]);

  const startAlgorithm = () => {
    if (algoState.isDone) resetAlgorithm();
    setAlgoState(prev => ({ ...prev, isRunning: true }));
  };

  const stopAlgorithm = () => {
    setAlgoState(prev => ({ ...prev, isRunning: false }));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    if (algoState.isRunning && !algoState.isDone) {
      const runStep = () => {
        const hasMore = stepAlgorithm();
        if (hasMore && algoState.isRunning) {
          timeoutRef.current = setTimeout(runStep, algoState.speed);
        }
      };
      timeoutRef.current = setTimeout(runStep, algoState.speed);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [algoState.isRunning, algoState.speed, stepAlgorithm]);

  const randomSolution = () => {
    if (solutionFamilies.length === 0) return;
    const fIdx = Math.floor(Math.random() * solutionFamilies.length);
    const vIdx = Math.floor(Math.random() * solutionFamilies[fIdx].length);
    setExploreFamilyIndex(fIdx);
    setExploreVariantIndex(vIdx);
  };

  // --- RENDER HELPERS ---
  const activeBoard = 
    mode === 'play' ? playBoard :
    mode === 'algorithm' ? algoState.currentBoard :
    activeExploreBoard;

  const attackedMatrix = useMemo(() => getAttackedSquares(activeBoard, n), [activeBoard, n]);
  
  const playHasConflicts = mode === 'play' && hasConflicts(playBoard);
  const playIsWon = mode === 'play' && playBoard.length === n && !playHasConflicts;

  const safeSquaresCount = useMemo(() => {
    if (mode !== 'play') return 0;
    let count = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!attackedMatrix[r][c] && !playBoard.some(q => q.r === r && q.c === c)) count++;
      }
    }
    return count;
  }, [attackedMatrix, playBoard, n, mode]);

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#2a2a2a] border-b border-[#3a3a3a] shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Crown className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Queen's Gambit Lab</h1>
            <p className="text-xs font-medium text-slate-400">N-Queens Problem Explorer</p>
          </div>
        </div>

        <nav className="flex bg-[#1e1e1e] p-1 rounded-lg border border-[#3a3a3a]">
          <button onClick={() => handleModeChange('play')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200", mode === 'play' ? "bg-[#3a3a3a] text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-[#2a2a2a]")}>Play</button>
          <button onClick={() => handleModeChange('algorithm')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200", mode === 'algorithm' ? "bg-[#3a3a3a] text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-[#2a2a2a]")}>Algorithm</button>
          <button onClick={() => handleModeChange('explore')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200", mode === 'explore' ? "bg-[#3a3a3a] text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-[#2a2a2a]")}>Solutions</button>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* CENTER BOARDS AREA */}
        <section className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative overflow-y-auto min-h-0">
          
          <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none z-10">
            {playIsWon && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-amber-500/20 text-amber-300 border border-amber-500/50 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center gap-3 backdrop-blur-sm pointer-events-auto">
                <Crown className="w-5 h-5" />
                <span className="font-semibold text-lg">Puzzle Solved — {n} Queens Successfully Placed.</span>
              </div>
            )}
            {mode === 'algorithm' && algoState.isDone && (
               <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-amber-500/20 text-amber-300 border border-amber-500/50 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center gap-3 backdrop-blur-sm">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">{algoState.msg}</span>
               </div>
            )}
          </div>

          {/* CHESSBOARD WRAPPER */}
          <div className="flex w-full max-w-[75vh] max-h-[80vh] aspect-square relative transition-all duration-500 rounded-lg p-3 bg-[#2a2a2a] border border-[#3a3a3a] shadow-2xl"
               style={{ 
                 boxShadow: playIsWon || (mode === 'algorithm' && algoState.isDone && !algoState.isConflict) ? '0 0 60px rgba(245,158,11,0.15)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
               }}>
            
            {/* Rank Labels (Left) */}
            <div className="flex flex-col justify-around items-center w-6 text-[#8a8a8a] font-semibold text-xs sm:text-sm pb-6 mr-1">
              {Array.from({ length: n }).map((_, i) => (
                <span key={i}>{n - i}</span>
              ))}
            </div>
            
            <div className="flex-1 flex flex-col h-full w-full">
              {/* Chessboard Grid */}
              <div 
                className="flex-1 grid border-[4px] border-[#4a3b32] rounded-sm overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]"
                style={{ 
                  gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`
                }}
              >
                {Array.from({ length: n * n }).map((_, i) => {
                  const r = Math.floor(i / n);
                  const c = i % n;
                  const isLight = (r + c) % 2 === 0;
                  
                  const hasQueen = activeBoard.some(q => q.r === r && q.c === c);
                  
                  const isVisualizerActive = mode === 'algorithm' && algoState.activeSquare?.r === r && algoState.activeSquare?.c === c;
                  const isVisualizerConflict = mode === 'algorithm' && isVisualizerActive && algoState.isConflict;
                  const isVisualizerTry = mode === 'algorithm' && isVisualizerActive && !algoState.isConflict;

                  const isUnderAttackPlay = mode === 'play' && attackedMatrix[r][c] && !hasQueen;
                  const isSafeHint = mode === 'play' && showHint && !attackedMatrix[r][c] && !hasQueen;
                  const isHoverable = mode === 'play';
                  
                  return (
                    <div 
                      key={i}
                      onClick={() => mode === 'play' && onSquareClickPlay(r, c)}
                      className={cn(
                        "relative w-full h-full flex items-center justify-center transition-all duration-300 select-none",
                        isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]",
                        isHoverable && "cursor-pointer hover:brightness-110",
                        
                        // Overlays
                        isUnderAttackPlay && "after:absolute after:inset-0 after:bg-[rgba(255,0,0,0.25)] after:transition-opacity",
                        isSafeHint && "after:absolute after:inset-0 after:bg-[rgba(16,185,129,0.3)] after:transition-opacity",
                        isVisualizerConflict && "after:absolute after:inset-0 after:bg-[rgba(255,0,0,0.4)] after:animate-pulse z-10",
                        isVisualizerTry && "after:absolute after:inset-0 after:bg-[rgba(251,191,36,0.3)] z-10"
                      )}
                    >
                      {hasQueen && (
                        <div className={cn(
                          "text-[clamp(2rem,6cqw,6rem)] leading-none text-black/90 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] z-20 transition-all duration-300 transform-gpu animate-in zoom-in-50",
                          isVisualizerActive ? "scale-110 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" : "hover:scale-105",
                          mode === 'play' && playHasConflicts && "animate-[shake_0.5s_ease-in-out]",
                          (playIsWon || (mode === 'algorithm' && algoState.isDone && !algoState.isConflict)) && "drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] scale-105"
                        )}>
                          ♛
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* File Labels (Bottom) */}
              <div className="flex justify-around items-center h-6 text-[#8a8a8a] font-semibold text-xs sm:text-sm mt-1 ml-0">
                {Array.from({ length: n }).map((_, i) => (
                  <span key={i}>{String.fromCharCode(65 + i)}</span>
                ))}
              </div>
            </div>
          </div>
          
        </section>

        {/* RIGHT SIDEBAR CONTROLS */}
        <aside className="w-full lg:w-[360px] bg-[#2a2a2a] border-l border-[#3a3a3a] flex flex-col shrink-0 z-10 shadow-xl">
          
          <div className="flex-1 p-6 overflow-y-auto space-y-8">
            
            <div className="space-y-3">
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                Board Size
              </label>
              <div className="grid grid-cols-5 gap-2">
                {([4, 6, 8, 10, 12] as BoardSize[]).map(size => (
                  <button 
                    key={size}
                    onClick={() => handleNChange(size)}
                    className={cn(
                      "py-2 rounded border text-sm font-medium transition-colors",
                      n === size 
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                        : "bg-[#1e1e1e] border-[#3a3a3a] text-slate-400 hover:bg-[#3a3a3a] hover:text-white"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-[#3a3a3a]" />

            {/* --- PLAY CONTROLS --- */}
            {mode === 'play' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1e1e1e] rounded-lg p-4 border border-[#3a3a3a] flex flex-col items-center justify-center text-center">
                     <span className="text-3xl font-bold text-white mb-1">{playBoard.length}</span>
                     <span className="text-xs text-slate-400 uppercase tracking-wide">Queens Placed</span>
                  </div>
                  <div className="bg-[#1e1e1e] rounded-lg p-4 border border-[#3a3a3a] flex flex-col items-center justify-center text-center">
                     <span className="text-3xl font-bold text-emerald-400 mb-1">{safeSquaresCount}</span>
                     <span className="text-xs text-slate-400 uppercase tracking-wide">Safe Squares</span>
                  </div>
                </div>

                <div className="bg-[#1e1e1e] rounded-lg p-4 border border-[#3a3a3a] flex flex-col items-center justify-center text-center shadow-inner">
                   <span className={cn("text-xl font-bold mb-1 transition-colors duration-300", playHasConflicts ? "text-red-400" : "text-emerald-400")}>
                      {playHasConflicts ? "Conflicts Detected" : "No Conflicts"}
                   </span>
                </div>

                <div className="space-y-3 pt-2">
                  <button onClick={undoPlay} disabled={playHistory.length === 0} className="w-full flex items-center justify-center gap-2 py-3 bg-[#1e1e1e] hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-[#3a3a3a] text-sm font-medium transition-colors text-slate-200">
                    <Undo2 className="w-4 h-4" /> Undo Last Move
                  </button>
                  <button onClick={resetPlay} className="w-full flex items-center justify-center gap-2 py-3 bg-[#1e1e1e] hover:bg-[#3a3a3a] rounded-lg border border-[#3a3a3a] text-sm font-medium transition-colors text-slate-200">
                    <RotateCcw className="w-4 h-4" /> Reset Board
                  </button>
                  <button onClick={() => setShowHint(!showHint)} className={cn("w-full flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-colors", showHint ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#1e1e1e] border-[#3a3a3a] text-slate-200 hover:bg-[#3a3a3a]")}>
                    {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showHint ? "Hide Safe Squares" : "Show Safe Squares"}
                  </button>
                  <button onClick={() => handleModeChange('algorithm')} className="w-full flex items-center justify-center gap-2 py-3 bg-[#1e1e1e] hover:bg-[#3a3a3a] rounded-lg border border-[#3a3a3a] text-sm font-medium transition-colors text-slate-200">
                    <Network className="w-4 h-4" /> Solve Automatically
                  </button>
                </div>
              </div>
            )}

            {/* --- ALGORITHM CONTROLS --- */}
            {mode === 'algorithm' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                <div className="space-y-3 pb-4 border-b border-[#3a3a3a]">
                   <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Optimization Strategy</label>
                   <div className="grid grid-cols-2 gap-2">
                     <button 
                       onClick={() => { setAlgoType('backtracking'); resetAlgorithm(); }}
                       className={cn("py-2 px-3 rounded text-xs font-medium transition-colors text-center border", algoType === 'backtracking' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-[#1e1e1e] border-[#3a3a3a] text-slate-400 hover:bg-[#3a3a3a] hover:text-white")}
                     >
                       Backtracking
                     </button>
                     <button 
                       onClick={() => { setAlgoType('min-conflicts'); resetAlgorithm(); }}
                       className={cn("py-2 px-3 rounded text-xs font-medium transition-colors text-center border", algoType === 'min-conflicts' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-[#1e1e1e] border-[#3a3a3a] text-slate-400 hover:bg-[#3a3a3a] hover:text-white")}
                     >
                       Min-Conflicts
                     </button>
                   </div>
                </div>

                <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#3a3a3a] font-mono text-sm text-slate-300 relative overflow-hidden group shadow-inner">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <p className="pl-2 line-clamp-2 min-h-[40px] flex items-center">{algoState.msg}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1e1e1e] rounded-lg p-3 border border-[#3a3a3a] flex flex-col items-center text-center">
                     <span className="text-2xl font-bold text-blue-400">{algoState.steps}</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Steps</span>
                  </div>
                  <div className="bg-[#1e1e1e] rounded-lg p-3 border border-[#3a3a3a] flex flex-col items-center text-center">
                     <span className="text-2xl font-bold text-orange-400">{algoState.secondaryMetric}</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                       {algoType === 'backtracking' ? "Backtracks" : "Total Conflicts"}
                     </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex justify-between">
                    <span>Speed</span>
                    <span className="text-slate-400 normal-case font-mono">{algoState.speed}ms</span>
                  </label>
                  <input 
                    type="range" min="10" max="1000" step="10" value={algoState.speed}
                    onChange={(e) => setAlgoState(s => ({...s, speed: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
                    <span>Fast</span><span>Slow</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {algoState.isRunning ? (
                    <button onClick={stopAlgorithm} className="flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 font-medium transition-colors">
                      <Pause className="w-4 h-4"/> Pause
                    </button>
                  ) : (
                    <button onClick={startAlgorithm} disabled={algoState.isDone} className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-[#3a3a3a] disabled:text-slate-400 rounded-lg border border-transparent font-medium transition-colors shadow-lg shadow-blue-900/20">
                      <Play className="w-4 h-4"/> Start
                    </button>
                  )}
                  <button onClick={stepAlgorithm} disabled={algoState.isRunning || algoState.isDone} className="flex items-center justify-center gap-2 py-3 bg-[#1e1e1e] hover:bg-[#3a3a3a] disabled:opacity-50 rounded-lg border border-[#3a3a3a] text-white font-medium transition-colors">
                    <StepForward className="w-4 h-4"/> Step
                  </button>
                </div>
                
                <button onClick={() => resetAlgorithm()} className="w-full flex items-center justify-center gap-2 py-3 bg-[#1e1e1e] hover:bg-[#3a3a3a] rounded-lg border border-[#3a3a3a] text-slate-300 text-sm font-medium transition-colors mt-3">
                  <RotateCcw className="w-4 h-4"/> Reset Algorithm
                </button>
              </div>
            )}

            {/* --- EXPLORE CONTROLS --- */}
            {mode === 'explore' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/20 text-center shadow-inner">
                  <div className="text-3xl font-black text-purple-400 mb-1">{allSolutions.length}</div>
                  <div className="text-xs font-bold text-purple-300/80 uppercase tracking-widest mb-2">Valid Solutions</div>
                  <div className="text-xs text-purple-300/60">
                    Mathematically verified safe configurations.
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Fundamental Pattern</label>
                  <div className="flex items-center justify-between bg-[#1e1e1e] rounded-lg p-2 border border-[#3a3a3a]">
                     <button onClick={() => { setExploreFamilyIndex(i => (i - 1 + solutionFamilies.length) % solutionFamilies.length); setExploreVariantIndex(0); }} className="p-2 hover:bg-[#3a3a3a] rounded-md text-slate-300 transition-colors">
                       <ChevronLeft className="w-4 h-4"/>
                     </button>
                     <div className="text-sm font-bold text-white tracking-wide">
                       Family {solutionFamilies.length > 0 ? exploreFamilyIndex + 1 : 0} of {solutionFamilies.length}
                     </div>
                     <button onClick={() => { setExploreFamilyIndex(i => (i + 1) % solutionFamilies.length); setExploreVariantIndex(0); }} className="p-2 hover:bg-[#3a3a3a] rounded-md text-slate-300 transition-colors">
                       <ChevronRight className="w-4 h-4"/>
                     </button>
                  </div>
                </div>

                <div className={cn("space-y-2 transition-opacity duration-300", currentFamily.length <= 1 ? "opacity-30 pointer-events-none" : "opacity-100")}>
                  <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center justify-between">
                    Symmetrical Variant
                    <span className="text-[10px] text-slate-500">(Rotation/Reflection)</span>
                  </label>
                  <div className="flex items-center justify-between bg-[#1e1e1e] rounded-lg p-2 border border-[#3a3a3a]">
                     <button onClick={() => setExploreVariantIndex(i => (i - 1 + currentFamily.length) % currentFamily.length)} className="p-1 hover:bg-[#3a3a3a] rounded-md text-slate-400 transition-colors">
                       <ChevronLeft className="w-4 h-4"/>
                     </button>
                     <div className="text-xs font-medium text-slate-300 tracking-wide">
                       Variant {exploreVariantIndex + 1} of {currentFamily.length || 1}
                     </div>
                     <button onClick={() => setExploreVariantIndex(i => (i + 1) % currentFamily.length)} className="p-1 hover:bg-[#3a3a3a] rounded-md text-slate-400 transition-colors">
                       <ChevronRight className="w-4 h-4"/>
                     </button>
                  </div>
                </div>

                <button onClick={randomSolution} className="w-full flex items-center justify-center gap-2 py-3 bg-[#1e1e1e] hover:bg-[#3a3a3a] rounded-lg border border-[#3a3a3a] text-slate-300 text-sm font-medium transition-colors mt-6">
                  <Shuffle className="w-4 h-4"/> Random Layout
                </button>

              </div>
            )}

          </div>
        </aside>

      </main>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-5deg); }
          50% { transform: translateX(4px) rotate(5deg); }
          75% { transform: translateX(-4px) rotate(-5deg); }
        }
      `}</style>
    </div>
  );
}