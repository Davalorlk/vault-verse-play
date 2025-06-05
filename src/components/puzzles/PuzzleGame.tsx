import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Brain, Zap, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface Puzzle {
  id: number;
  type: string;
  question: string;
  answer: string;
  category: string;
  difficulty: string;
  coins: number;
  experience: number;
}

interface PuzzleGameProps {
  user: any;
  onUpdateUser: (stats: any) => void;
}

// Helper to parse puzzle.txt format
function parsePuzzles(raw: string): Puzzle[] {
  const blocks = raw.split(/---+/g).map(b => b.trim()).filter(Boolean);
  let id = 1;
  return blocks.map(block => {
    const typeMatch = block.match(/\*\*Type:\*\*\s*(.+)/);
    const questionMatch = block.match(/\*\*Type:\*\*.+?\n([\s\S]+?)\n\*\*Solution:/);
    const answerMatch = block.match(/\*\*Solution:\*\*\s*(.+)/);
    const type = typeMatch ? typeMatch[1].trim() : 'Unknown';
    const question = questionMatch ? questionMatch[1].replace(/\n/g, ' ').trim() : '';
    const answer = answerMatch ? answerMatch[1].trim() : '';
    // Simple heuristics for category/difficulty/coins/experience
    let category = 'General', difficulty = 'Easy', coins = 10, experience = 25;
    if (/math/i.test(type)) category = 'Math';
    if (/word/i.test(type)) category = 'Word';
    if (/trivia/i.test(type)) category = 'Trivia';
    if (/logic/i.test(type)) category = 'Logic';
    if (/sequence/i.test(type)) difficulty = 'Medium';
    if (/equation/i.test(type)) difficulty = 'Medium';
    if (/scramble/i.test(type)) difficulty = 'Medium';
    if (/riddle/i.test(type)) difficulty = 'Hard';
    if (difficulty === 'Medium') { coins = 15; experience = 35; }
    if (difficulty === 'Hard') { coins = 25; experience = 50; }
    return {
      id: id++,
      type,
      question,
      answer,
      category,
      difficulty,
      coins,
      experience
    };
  });
}

export const PuzzleGame = ({ user, onUpdateUser }: PuzzleGameProps) => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solvedPuzzles, setSolvedPuzzles] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load and parse puzzles from puzzle.txt
  useEffect(() => {
    fetch('/puzzle.txt')
      .then(res => res.text())
      .then(text => {
        const parsed = parsePuzzles(text);
        setPuzzles(parsed);
        setLoading(false);
      });
  }, []);

  // Load solved puzzles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`mindVault_solved_${user.id}`);
    if (saved) {
      setSolvedPuzzles(JSON.parse(saved));
    }
  }, [user.id]);

  // Find the next unsolved puzzle
  const nextUnsolvedIndex = puzzles.findIndex(p => !solvedPuzzles.includes(p.id));
  const allSolved = puzzles.length > 0 && solvedPuzzles.length >= puzzles.length;
  const currentPuzzle = !allSolved && puzzles.length > 0 && nextUnsolvedIndex !== -1 ? puzzles[nextUnsolvedIndex] : null;
  const progress = puzzles.length ? (solvedPuzzles.length / puzzles.length) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || !currentPuzzle) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const correct = userAnswer.toLowerCase().trim() === currentPuzzle.answer.toLowerCase();
      setIsCorrect(correct);
      setShowResult(true);
      if (correct && !solvedPuzzles.includes(currentPuzzle.id)) {
        const newSolvedPuzzles = [...solvedPuzzles, currentPuzzle.id];
        setSolvedPuzzles(newSolvedPuzzles);
        localStorage.setItem(`mindVault_solved_${user.id}`, JSON.stringify(newSolvedPuzzles));
        const newCoins = user.coins + currentPuzzle.coins;
        const newExperience = user.experience + currentPuzzle.experience;
        const newPuzzlesSolved = user.puzzlesSolved + 1;
        const newLevel = Math.floor(newExperience / 100) + 1;
        onUpdateUser({ coins: newCoins, experience: newExperience, puzzlesSolved: newPuzzlesSolved, level: newLevel });
        toast.success(`Correct! +${currentPuzzle.coins} coins, +${currentPuzzle.experience} XP`);
      } else if (correct) {
        toast.info('You already solved this puzzle!');
      } else {
        toast.error('Incorrect answer. Try again!');
      }
      setIsSubmitting(false);
    }, 1000);
  };

  const nextPuzzle = () => {
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswer('');
    // Move to next unsolved puzzle
    const nextIdx = puzzles.findIndex((p, i) => i > nextUnsolvedIndex && !solvedPuzzles.includes(p.id));
    if (nextIdx !== -1) setCurrentPuzzleIndex(nextIdx);
    else setCurrentPuzzleIndex(0); // fallback
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) return <div className="text-white">Loading puzzles...</div>;
  if (allSolved) return (
    <div className="flex flex-col items-center justify-center h-96">
      <CheckCircle className="h-16 w-16 text-green-400 mb-4" />
      <div className="text-2xl font-bold text-white mb-2">Congratulations!</div>
      <div className="text-lg text-slate-300 mb-4">You've solved all available puzzles.</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Daily Challenges</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-400">
            Progress: {solvedPuzzles.length}/{puzzles.length}
          </div>
          <Progress value={progress} className="w-32" />
        </div>
      </div>
      {currentPuzzle && (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Brain className="h-5 w-5 mr-2 text-yellow-400" />
              Puzzle #{currentPuzzle.id}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                {currentPuzzle.category}
              </Badge>
              <Badge className={`text-white ${getDifficultyColor(currentPuzzle.difficulty)}`}>
                {currentPuzzle.difficulty}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg text-slate-300 leading-relaxed">
            {currentPuzzle.question}
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-400">
            <div className="flex items-center">
              <Gift className="h-4 w-4 mr-1 text-yellow-400" />
              {currentPuzzle.coins} coins
            </div>
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-1 text-green-400" />
              {currentPuzzle.experience} XP
            </div>
          </div>
          {!showResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter your answer..."
                className="bg-slate-700 border-slate-600 text-white text-lg"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                disabled={isSubmitting || !userAnswer.trim()}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                {isSubmitting ? 'Checking...' : 'Submit Answer'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center space-x-3 p-4 rounded-lg ${
                isCorrect ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
              }`}>
                {isCorrect ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400" />
                )}
                <div>
                  <div className={`font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </div>
                  <div className="text-slate-300">
                    The answer is: <span className="font-semibold">{currentPuzzle.answer}</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={nextPuzzle}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                Next Puzzle
              </Button>
            </div>
          )}
          {solvedPuzzles.includes(currentPuzzle.id) && (
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Already Solved</span>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};
