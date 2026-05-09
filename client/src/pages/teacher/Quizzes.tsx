import { useState } from "react";
import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles, BookOpen, Eye, EyeOff, Users, CheckCircle2, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type QuestionType = "mcq" | "true_false" | "short_answer" | "long_answer";

interface QuestionDraft {
  questionText: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
  orderIndex: number;
}

interface QuizDraft {
  title: string;
  description: string;
  classId: number;
  dueDate: string;
  timeLimit: number | undefined;
  autoGrade: boolean;
  questions: QuestionDraft[];
}

const defaultQuestion = (): QuestionDraft => ({
  questionText: "",
  questionType: "mcq",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 1,
  orderIndex: 0,
});

export default function TeacherQuizzes() {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiSubject, setAiSubject] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiTypes, setAiTypes] = useState<("mcq" | "true_false" | "short_answer")[]>(["mcq"]);

  const [draft, setDraft] = useState<QuizDraft>({
    title: "",
    description: "",
    classId: 0,
    dueDate: "",
    timeLimit: undefined,
    autoGrade: true,
    questions: [defaultQuestion()],
  });

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: quizzes, refetch } = trpc.quizzes.myQuizzes.useQuery();

  const createQuiz = trpc.quizzes.create.useMutation();
  const saveQuestions = trpc.quizzes.saveQuestions.useMutation();
  const publishQuiz = trpc.quizzes.publish.useMutation();
  const deleteQuiz = trpc.quizzes.delete.useMutation();
  const aiGenerate = trpc.quizzes.aiGenerate.useMutation();

  const handleSaveQuiz = async () => {
    if (!draft.title.trim() || !draft.classId) {
      toast.error("Please fill in the quiz title and select a class.");
      return;
    }
    try {
      const result = await createQuiz.mutateAsync({
        classId: draft.classId,
        title: draft.title,
        description: draft.description || undefined,
        dueDate: draft.dueDate || undefined,
        timeLimit: draft.timeLimit,
        autoGrade: draft.autoGrade,
      });
      if (result?.id) {
        await saveQuestions.mutateAsync({
          quizId: result.id,
          questions: draft.questions
            .filter((q) => q.questionText.trim())
            .map((q, i) => ({
              ...q,
              orderIndex: i,
              options: (q.questionType === "mcq" || q.questionType === "true_false") ? q.options.filter(Boolean) : undefined,
              correctAnswer: q.correctAnswer || undefined,
            })),
        });
        toast.success("Quiz saved as draft!");
        setShowBuilder(false);
        resetDraft();
        refetch();
      }
    } catch (e) {
      toast.error("Failed to save quiz.");
    }
  };

  const handlePublish = async (quizId: number, published: boolean) => {
    try {
      await publishQuiz.mutateAsync({ quizId, published });
      toast.success(published ? "Quiz published!" : "Quiz unpublished.");
      refetch();
    } catch {
      toast.error("Failed to update quiz status.");
    }
  };

  const handleDelete = async (quizId: number) => {
    try {
      await deleteQuiz.mutateAsync({ quizId });
      toast.success("Quiz deleted.");
      refetch();
    } catch {
      toast.error("Failed to delete quiz.");
    }
  };

  const handleAIGenerate = async () => {
    if (!aiSubject || !aiTopic) { toast.error("Enter subject and topic."); return; }
    try {
      const questions = await aiGenerate.mutateAsync({ subject: aiSubject, topic: aiTopic, questionCount: aiCount, questionTypes: aiTypes });
      const mapped: QuestionDraft[] = questions.map((q: any, i: number) => ({
        questionText: q.questionText,
        questionType: q.questionType as QuestionType,
        options: q.options ?? (q.questionType === "true_false" ? ["True", "False"] : ["", "", "", ""]),
        correctAnswer: q.correctAnswer ?? "",
        points: q.points ?? 1,
        orderIndex: i,
      }));
      setDraft((d) => ({ ...d, questions: mapped }));
      setShowAIDialog(false);
      setShowBuilder(true);
      toast.success(`${mapped.length} questions generated by AI!`);
    } catch {
      toast.error("AI generation failed. Try again.");
    }
  };

  const resetDraft = () => {
    setDraft({ title: "", description: "", classId: 0, dueDate: "", timeLimit: undefined, autoGrade: true, questions: [defaultQuestion()] });
  };

  const updateQuestion = (idx: number, updates: Partial<QuestionDraft>) => {
    setDraft((d) => {
      const qs = [...d.questions];
      qs[idx] = { ...qs[idx], ...updates };
      return { ...d, questions: qs };
    });
  };

  const addQuestion = () => {
    setDraft((d) => ({ ...d, questions: [...d.questions, { ...defaultQuestion(), orderIndex: d.questions.length }] }));
  };

  const removeQuestion = (idx: number) => {
    setDraft((d) => ({ ...d, questions: d.questions.filter((_, i) => i !== idx) }));
  };

  const filteredQuizzes = selectedClassId ? quizzes?.filter((q) => q.classId === selectedClassId) : quizzes;

  return (
    <SchoolLayout role="teacher">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Quiz Builder</h1>
            <p className="text-muted-foreground mt-1">Create, manage, and publish quizzes for your classes</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  AI Generate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">AI Quiz Generator</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Subject</Label>
                    <Input value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} placeholder="e.g. Mathematics" className="mt-1" />
                  </div>
                  <div>
                    <Label>Topic</Label>
                    <Input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g. Quadratic Equations" className="mt-1" />
                  </div>
                  <div>
                    <Label>Number of Questions</Label>
                    <Input type="number" min={1} max={20} value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Question Types</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(["mcq", "true_false", "short_answer"] as ("mcq" | "true_false" | "short_answer")[]).map((t) => (
                        <Badge
                          key={t}
                          variant={aiTypes.includes(t) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setAiTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}
                        >
                          {t === "mcq" ? "Multiple Choice" : t === "true_false" ? "True/False" : "Short Answer"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAIGenerate} disabled={aiGenerate.isPending} className="w-full">
                    {aiGenerate.isPending ? "Generating..." : "Generate Questions"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={() => { resetDraft(); setShowBuilder(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              New Quiz
            </Button>
          </div>
        </div>

        {/* Class Filter */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={selectedClassId === null ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setSelectedClassId(null)}
          >
            All Classes
          </Badge>
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

        {/* Quiz Builder Modal */}
        {showBuilder && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl mx-4 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold">Build Quiz</h2>
                <Button variant="ghost" onClick={() => setShowBuilder(false)}>✕</Button>
              </div>

              {/* Quiz Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Quiz Title *</Label>
                  <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="e.g. Chapter 3 Quiz" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Optional instructions..." className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Class *</Label>
                  <Select value={draft.classId ? String(draft.classId) : "__none"} onValueChange={(v) => setDraft((d) => ({ ...d, classId: v === "__none" ? 0 : Number(v) }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="datetime-local" value={draft.dueDate} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Time Limit (minutes)</Label>
                  <Input type="number" placeholder="No limit" value={draft.timeLimit ?? ""} onChange={(e) => setDraft((d) => ({ ...d, timeLimit: e.target.value ? Number(e.target.value) : undefined }))} className="mt-1" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={draft.autoGrade} onCheckedChange={(v) => setDraft((d) => ({ ...d, autoGrade: v }))} />
                  <Label>Auto-grade MCQ & True/False</Label>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Questions ({draft.questions.length})</h3>
                  <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1">
                    <Plus className="h-3 w-3" /> Add Question
                  </Button>
                </div>

                {draft.questions.map((q, idx) => (
                  <Card key={idx} className="border border-border">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-muted-foreground font-mono text-sm mt-2 w-6 shrink-0">{idx + 1}.</span>
                        <div className="flex-1 space-y-3">
                          <Textarea
                            value={q.questionText}
                            onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
                            placeholder="Question text..."
                            rows={2}
                          />
                          <div className="flex gap-3 flex-wrap">
                            <Select value={q.questionType} onValueChange={(v) => updateQuestion(idx, { questionType: v as QuestionType, options: v === "true_false" ? ["True", "False"] : ["", "", "", ""], correctAnswer: "" })}>
                              <SelectTrigger className="w-44">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mcq">Multiple Choice</SelectItem>
                                <SelectItem value="true_false">True / False</SelectItem>
                                <SelectItem value="short_answer">Short Answer</SelectItem>
                                <SelectItem value="long_answer">Long Answer</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Points:</Label>
                              <Input type="number" min={0.5} step={0.5} value={q.points} onChange={(e) => updateQuestion(idx, { points: Number(e.target.value) })} className="w-20" />
                            </div>
                          </div>

                          {/* MCQ Options */}
                          {q.questionType === "mcq" && (
                            <div className="space-y-2">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${idx}`}
                                    checked={q.correctAnswer === opt && opt !== ""}
                                    onChange={() => updateQuestion(idx, { correctAnswer: opt })}
                                    className="shrink-0"
                                  />
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const opts = [...q.options];
                                      opts[oi] = e.target.value;
                                      updateQuestion(idx, { options: opts });
                                    }}
                                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                    className="flex-1"
                                  />
                                </div>
                              ))}
                              <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
                            </div>
                          )}

                          {/* True/False */}
                          {q.questionType === "true_false" && (
                            <div className="flex gap-4">
                              {["True", "False"].map((opt) => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name={`tf-${idx}`} checked={q.correctAnswer === opt} onChange={() => updateQuestion(idx, { correctAnswer: opt })} />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* Short/Long Answer */}
                          {(q.questionType === "short_answer") && (
                            <Input value={q.correctAnswer} onChange={(e) => updateQuestion(idx, { correctAnswer: e.target.value })} placeholder="Model answer (for reference)" />
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeQuestion(idx)} className="text-destructive shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
                <Button onClick={handleSaveQuiz} disabled={createQuiz.isPending || saveQuestions.isPending}>
                  {createQuiz.isPending ? "Saving..." : "Save Quiz"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz List */}
        {filteredQuizzes?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-serif text-lg">No quizzes yet</p>
            <p className="text-sm mt-1">Create your first quiz or use AI to generate questions</p>
          </div>
        )}

        <div className="grid gap-4">
          {filteredQuizzes?.map((quiz) => {
            const cls = classes?.find((c) => c.id === quiz.classId);
            return (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif font-semibold text-lg truncate">{quiz.title}</h3>
                        <Badge variant={quiz.published ? "default" : "secondary"} className="shrink-0">
                          {quiz.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      {quiz.description && <p className="text-muted-foreground text-sm line-clamp-1 mb-2">{quiz.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {cls && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{cls.name}</span>}
                        {quiz.dueDate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due {new Date(quiz.dueDate).toLocaleDateString()}</span>}
                        {quiz.timeLimit && <span>{quiz.timeLimit} min limit</span>}
                        {quiz.autoGrade && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" />Auto-graded</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublish(quiz.id, !quiz.published)}
                        disabled={publishQuiz.isPending}
                        className="gap-1"
                      >
                        {quiz.published ? <><EyeOff className="h-3 w-3" /> Unpublish</> : <><Eye className="h-3 w-3" /> Publish</>}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(quiz.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SchoolLayout>
  );
}
