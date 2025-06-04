
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Brain, Zap, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface PuzzleGameProps {
  user: any;
  onUpdateUser: (stats: any) => void;
}

const samplePuzzles = [
  {
    id: 1,
    type: 'sequence',
    question: 'What comes next in the sequence: 2, 4, 8, 16, ?',
    answer: '32',
    category: 'Math',
    difficulty: 'Easy',
    coins: 10,
    experience: 25
  },
  {
    id: 2,
    type: 'trivia',
    question: 'What is the capital of France?',
    answer: 'Paris',
    category: 'Geography',
    difficulty: 'Easy',
    coins: 10,
    experience: 25
  },
  {
    id: 3,
    type: 'math',
    question: 'If x + 5 = 12, what is the value of x?',
    answer: '7',
    category: 'Math',
    difficulty: 'Easy',
    coins: 15,
    experience: 30
  },
  {
    id: 4,
    type: 'sequence',
    question: 'Complete the sequence: 1, 1, 2, 3, 5, 8, ?',
    answer: '13',
    category: 'Math',
    difficulty: 'Medium',
    coins: 20,
    experience: 40
  },
  {
    id: 5,
    type: 'word',
    question: 'Unscramble this word: TPUCOMRE',
    answer: 'COMPUTER',
    category: 'Word',
    difficulty: 'Medium',
    coins: 15,
    experience: 35
  }
];

export const PuzzleGame = ({ user, onUpdateUser }: PuzzleGameProps) => {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solvedPuzzles, setSolvedPuzzles] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentPuzzle = samplePuzzles[currentPuzzleIndex];
  const progress = (solvedPuzzles.length / samplePuzzles.length) * 100;

  useEffect(() => {
    // Load solved puzzles from localStorage
    const saved = localStorage.getItem(`mindVault_solved_${user.id}`);
    if (saved) {
      setSolvedPuzzles(JSON.parse(saved));
    }
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setIsSubmitting(true);
    
    // Simulate processing time
    setTimeout(() => {
      const correct = userAnswer.toLowerCase().trim() === currentPuzzle.answer.toLowerCase();
      setIsCorrect(correct);
      setShowResult(true);

      if (correct && !solvedPuzzles.includes(currentPuzzle.id)) {
        // Update user stats
        const newSolvedPuzzles = [...solvedPuzzles, currentPuzzle.id];
        setSolvedPuzzles(newSolvedPuzzles);
        localStorage.setItem(`mindVault_solved_${user.id}`, JSON.stringify(newSolvedPuzzles));

        const newCoins = user.coins + currentPuzzle.coins;
        const newExperience = user.experience + currentPuzzle.experience;
        const newPuzzlesSolved = user.puzzlesSolved + 1;
        const newLevel = Math.floor(newExperience / 100) + 1;

        onUpdateUser({
          coins: newCoins,
          experience: newExperience,
          puzzlesSolved: newPuzzlesSolved,
          level: newLevel
        });

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
    setCurrentPuzzleIndex((prev) => (prev + 1) % samplePuzzles.length);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Daily Challenges</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-400">
            Progress: {solvedPuzzles.length}/{samplePuzzles.length}
          </div>
          <Progress value={progress} className="w-32" />
        </div>
      </div>

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
    </div>
  );
};
