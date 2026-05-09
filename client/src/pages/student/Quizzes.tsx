import { useState } from "react";
import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BookOpen, Clock, CheckCircle2, Trophy, ChevronLeft } from "lucide-react";

export default function StudentQuizzes() {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: quizzes } = trpc.quizzes.forClass.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );
  const { data: quizData } = trpc.quizzes.getWithQuestions.useQuery(
    { quizId: activeQuizId! },
    { enabled: !!activeQuizId }
  );
  const { data: myAttempt } = trpc.quizzes.myAttempt.useQuery(
    { quizId: activeQuizId! },
    { enabled: !!activeQuizId }
  );

  const submitQuiz = trpc.quizzes.submit.useMutation();

  const handleSubmit = async () => {
    if (!activeQuizId) return;
    try {
      const res = await submitQuiz.mutateAsync({ quizId: activeQuizId, answers });
      setResult({ score: res.score, maxScore: res.maxScore });
      setSubmitted(true);
      toast.success("Quiz submitted!");
    } catch (e: any) {
      if (e?.message?.includes("Already submitted")) {
        toast.error("You have already submitted this quiz.");
      } else {
        toast.error("Failed to submit quiz.");
      }
    }
  };

  const startQuiz = (quizId: number) => {
    setActiveQuizId(quizId);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  const exitQuiz = () => {
    setActiveQuizId(null);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  // Taking a quiz
  if (activeQuizId && quizData) {
    const { quiz, questions } = quizData;
    const alreadyDone = !!myAttempt;

    if (alreadyDone && !submitted) {
      return (
        <SchoolLayout role="student">
          <div className="p-6 max-w-2xl mx-auto">
            <Button variant="ghost" onClick={exitQuiz} className="mb-4 gap-2">
              <ChevronLeft className="h-4 w-4" /> Back to Quizzes
            </Button>
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <h2 className="font-serif text-2xl font-bold">Already Submitted</h2>
                <p className="text-muted-foreground">You have already completed this quiz.</p>
                {myAttempt.score !== null && myAttempt.score !== undefined && (
                  <div className="bg-muted rounded-lg p-4 inline-block">
                    <p className="text-3xl font-bold text-primary">{myAttempt.score} / {myAttempt.maxScore}</p>
                    <p className="text-sm text-muted-foreground mt-1">Your Score</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SchoolLayout>
      );
    }

    if (submitted && result) {
      const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
      return (
        <SchoolLayout role="student">
          <div className="p-6 max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center space-y-6">
                <Trophy className="h-16 w-16 text-amber-500 mx-auto" />
                <h2 className="font-serif text-3xl font-bold">Quiz Complete!</h2>
                <div className="bg-muted rounded-xl p-6 inline-block">
                  <p className="text-5xl font-bold text-primary">{pct}%</p>
                  <p className="text-lg text-muted-foreground mt-2">{result.score} / {result.maxScore} points</p>
                </div>
                <p className="text-muted-foreground">
                  {pct >= 90 ? "Excellent work!" : pct >= 70 ? "Good job!" : pct >= 50 ? "Keep practising!" : "Review the material and try again next time."}
                </p>
                <Button onClick={exitQuiz} className="w-full max-w-xs">Back to Quizzes</Button>
              </CardContent>
            </Card>
          </div>
        </SchoolLayout>
      );
    }

    return (
      <SchoolLayout role="student">
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={exitQuiz} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Exit Quiz
            </Button>
            {quiz.timeLimit && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" /> {quiz.timeLimit} min
              </Badge>
            )}
          </div>

          <div>
            <h1 className="font-serif text-2xl font-bold">{quiz.title}</h1>
            {quiz.description && <p className="text-muted-foreground mt-1">{quiz.description}</p>}
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <Card key={q.id} className="border border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-sm text-muted-foreground shrink-0 mt-0.5">{idx + 1}.</span>
                    <div className="flex-1 space-y-3">
                      <p className="font-medium">{q.questionText}</p>
                      <Badge variant="outline" className="text-xs">{Number(q.points)} pt{Number(q.points) !== 1 ? "s" : ""}</Badge>

                      {(q.questionType === "mcq" || q.questionType === "true_false") && Array.isArray(q.options) && (
                        <RadioGroup
                          value={answers[String(q.id)] ?? ""}
                          onValueChange={(v) => setAnswers((a) => ({ ...a, [String(q.id)]: v }))}
                        >
                          {(q.options as string[]).map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <RadioGroupItem value={opt} id={`q${q.id}-opt${oi}`} />
                              <Label htmlFor={`q${q.id}-opt${oi}`} className="cursor-pointer">{opt}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {(q.questionType === "short_answer" || q.questionType === "long_answer") && (
                        <Textarea
                          value={answers[String(q.id)] ?? ""}
                          onChange={(e) => setAnswers((a) => ({ ...a, [String(q.id)]: e.target.value }))}
                          placeholder="Your answer..."
                          rows={q.questionType === "long_answer" ? 5 : 2}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSubmit} disabled={submitQuiz.isPending} size="lg" className="min-w-32">
              {submitQuiz.isPending ? "Submitting..." : "Submit Quiz"}
            </Button>
          </div>
        </div>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout role="student">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground mt-1">Take quizzes assigned by your teachers</p>
        </div>

        {/* Class selector */}
        <div className="flex gap-2 flex-wrap">
          {classes?.map((c) => (
            <Badge
              key={c.id}
              variant={selectedClassId === c.id ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedClassId(c.id)}
            >
              {c.name}
            </Badge>
          ))}
        </div>

        {!selectedClassId && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-serif text-lg">Select a class to view quizzes</p>
          </div>
        )}

        {selectedClassId && quizzes?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-serif text-lg">No quizzes yet</p>
            <p className="text-sm mt-1">Your teacher hasn't published any quizzes for this class</p>
          </div>
        )}

        <div className="grid gap-4">
          {quizzes?.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-lg">{quiz.title}</h3>
                    {quiz.description && <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{quiz.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      {quiz.dueDate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due {new Date(quiz.dueDate).toLocaleDateString()}</span>}
                      {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
                    </div>
                  </div>
                  <Button onClick={() => startQuiz(quiz.id)} className="shrink-0">
                    Start Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SchoolLayout>
  );
}
