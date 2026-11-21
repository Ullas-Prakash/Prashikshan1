import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function CourseQuiz() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase]           = useState('loading'); // 'loading' | 'quiz' | 'submitting' | 'result'
  const [attemptId, setAttemptId]   = useState(null);
  const [attemptNumber, setAttemptNumber] = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [answers, setAnswers]       = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult]         = useState(null);
  const [review, setReview]         = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [error, setError]           = useState('');
  const [config, setConfig]         = useState(null);

  // ── Load quiz config and start a quiz attempt ──
  useEffect(() => {
    async function startQuiz() {
      try {
        const [cfg, quizData] = await Promise.all([
          api(`/courses/${courseId}/quiz/config`),
          api(`/courses/${courseId}/quiz/start`, { method: 'POST' }),
        ]);
        setConfig(cfg);
        setAttemptId(quizData.attemptId);
        setAttemptNumber(quizData.attemptNumber);
        setQuestions(quizData.questions);
        setPhase('quiz');
      } catch (e) {
        setError(e.message);
        setPhase('error');
      }
    }
    startQuiz();
  }, [courseId]);

  const selectAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const unansweredCount = questions.filter((q) => !answers[q.id]).length;

  const submit = async () => {
    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. ` +
        `Submit anyway? Unanswered questions will be marked as incorrect.`
      );
      if (!confirm) return;
    } else {
      const confirm = window.confirm('Are you sure you want to submit your quiz? You cannot change your answers after submission.');
      if (!confirm) return;
    }

    setPhase('submitting');
    try {
      const answersPayload = questions.map((q) => ({
        id: q.id,
        selectedAnswer: answers[q.id] || '',
      }));

      const res = await api(`/courses/quiz/${attemptId}/submit`, {
        method: 'POST',
        body: { answers: answersPayload },
      });
      setResult(res);
      setPhase('result');
    } catch (e) {
      setError(e.message);
      setPhase('quiz');
    }
  };

  const retake = async () => {
    setPhase('loading');
    setAnswers({});
    setCurrentIdx(0);
    setResult(null);
    setReview(null);
    setShowReview(false);
    try {
      const quizData = await api(`/courses/${courseId}/quiz/start`, { method: 'POST' });
      setAttemptId(quizData.attemptId);
      setAttemptNumber(quizData.attemptNumber);
      setQuestions(quizData.questions);
      setPhase('quiz');
    } catch (e) {
      setError(e.message);
      setPhase('quiz');
    }
  };

  const loadReview = async () => {
    try {
      const data = await api(`/courses/quiz/${attemptId}/result`);
      setReview(data);
      setShowReview(true);
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Loading ──
  if (phase === 'loading') {
    return <div className="page-loader">Preparing your course quiz…</div>;
  }

  // ── Error ──
  if (phase === 'error') {
    return (
      <div className="assessment-page page-width">
        <div className="skill-select" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p className="eyebrow">Quiz unavailable</p>
          <h2 style={{ marginBottom: 12 }}>{error}</h2>
          <Link to="/courses" className="button" style={{ marginTop: 16 }}>← Back to Courses</Link>
        </div>
      </div>
    );
  }

  // ── Result ──
  if (phase === 'result' && result) {
    const passed = result.passed;
    return (
      <div className="result-card" style={{ maxWidth: 700, margin: '40px auto' }}>
        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>
          {passed ? '🎉' : '📚'}
        </div>
        <p className="eyebrow" style={{ textAlign: 'center' }}>
          {passed ? 'Quiz Passed' : 'Quiz Not Passed'}
        </p>
        <h1 style={{ textAlign: 'center', margin: '6px 0 16px' }}>
          {passed ? 'Congratulations!' : 'Keep learning — you can do this!'}
        </h1>

        {/* Score breakdown */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
          margin: '24px 0',
        }}>
          <div style={{ textAlign: 'center', padding: '14px', borderRadius: 7, border: '1px solid #d7e2cf', background: '#fcfdf7' }}>
            <span style={{ display: 'block', fontSize: 10, color: '#687b6d' }}>Score</span>
            <strong style={{ fontSize: 24, color: passed ? '#27573a' : '#943727', fontFamily: "'Playfair Display', serif" }}>
              {result.score}/{result.totalQuestions}
            </strong>
          </div>
          <div style={{ textAlign: 'center', padding: '14px', borderRadius: 7, border: '1px solid #d7e2cf', background: '#fcfdf7' }}>
            <span style={{ display: 'block', fontSize: 10, color: '#687b6d' }}>Percentage</span>
            <strong style={{ fontSize: 24, color: passed ? '#27573a' : '#943727', fontFamily: "'Playfair Display', serif" }}>
              {result.percentage}%
            </strong>
          </div>
          <div style={{ textAlign: 'center', padding: '14px', borderRadius: 7, border: '1px solid #d7e2cf', background: '#fcfdf7' }}>
            <span style={{ display: 'block', fontSize: 10, color: '#687b6d' }}>Correct</span>
            <strong style={{ fontSize: 24, color: '#27573a', fontFamily: "'Playfair Display', serif" }}>
              {result.correctAnswers}
            </strong>
          </div>
          <div style={{ textAlign: 'center', padding: '14px', borderRadius: 7, border: '1px solid #d7e2cf', background: '#fcfdf7' }}>
            <span style={{ display: 'block', fontSize: 10, color: '#687b6d' }}>Incorrect</span>
            <strong style={{ fontSize: 24, color: '#943727', fontFamily: "'Playfair Display', serif" }}>
              {result.incorrectAnswers}
            </strong>
          </div>
        </div>

        {/* Pass/fail status */}
        <div style={{
          padding: '14px 18px', borderRadius: 7, marginBottom: 20, textAlign: 'center',
          background: passed ? '#e4f2df' : '#fae9e5',
          border: `1px solid ${passed ? '#c7e1bf' : '#f3d0c8'}`,
        }}>
          {passed ? (
            <p style={{ margin: 0, fontSize: 13, color: '#26633f', fontWeight: 700 }}>
              ✓ You passed with {result.score}/{result.totalQuestions}. Minimum passing score: {result.minPassingScore}/{result.totalQuestions}.
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: '#943727', fontWeight: 700 }}>
              ✗ You scored {result.score}/{result.totalQuestions}. You need at least {result.minPassingScore}/{result.totalQuestions} to pass.
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {passed && result.certificateId && (
            <>
              <a
                href={`/api/certificates/pdf/${result.certificateId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-large"
                style={{ textDecoration: 'none' }}
              >
                ↓ Download Certificate
              </a>
              <Link
                to={`/verify/${result.certificateId}`}
                target="_blank"
                className="button button-large button-outline"
                style={{ textDecoration: 'none' }}
              >
                🔍 View Certificate
              </Link>
            </>
          )}
          {!passed && (
            <button className="button button-large" onClick={retake}>
              ↻ Retake Quiz
            </button>
          )}
          <button className="button button-large button-outline" onClick={loadReview}>
            📋 Review Answers
          </button>
          <Link to="/courses" className="button button-large button-ghost" style={{ textDecoration: 'none' }}>
            ← Back to Courses
          </Link>
        </div>

        {/* Answer review */}
        {showReview && review && (
          <div style={{ marginTop: 24, borderTop: '1px solid #e2ebe0', paddingTop: 20 }}>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Answer Review</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {review.questions.map((q, i) => {
                const isCorrect = q.selectedAnswer === q.correctAnswer;
                return (
                  <div key={q.id} style={{
                    padding: '16px', borderRadius: 7,
                    border: `1px solid ${isCorrect ? '#c7e1bf' : '#f3d0c8'}`,
                    background: isCorrect ? '#f6fcf4' : '#fdf6f5',
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>
                        {isCorrect ? '✅' : '❌'}
                      </span>
                      <div>
                        <strong style={{ fontSize: 12, color: '#243c2c' }}>
                          Q{i + 1}. {q.prompt}
                        </strong>
                        <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                          {q.options.map((opt, j) => {
                            const isCorrectOpt = opt === q.correctAnswer;
                            const isSelectedOpt = opt === q.selectedAnswer;
                            return (
                              <div key={j} style={{
                                padding: '6px 10px', borderRadius: 4, fontSize: 11,
                                background: isCorrectOpt ? '#e4f2df' : isSelectedOpt ? '#fae9e5' : '#f5f7f4',
                                color: isCorrectOpt ? '#26633f' : isSelectedOpt ? '#943727' : '#5c6b60',
                                fontWeight: isCorrectOpt || isSelectedOpt ? 700 : 400,
                                border: `1px solid ${isCorrectOpt ? '#c7e1bf' : isSelectedOpt ? '#f3d0c8' : '#e8ede7'}`,
                              }}>
                                {isCorrectOpt ? '✓ ' : isSelectedOpt ? '✗ ' : '  '}
                                {opt}
                                {isCorrectOpt && ' (correct answer)'}
                                {isSelectedOpt && !isCorrectOpt && ' (your answer)'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Quiz ──
  const q = questions[currentIdx];
  const answeredCount = questions.length - unansweredCount;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="assessment-page page-width">
      <section className="assessment-intro">
        <div>
          <p className="eyebrow">Course Completion Quiz · Attempt {attemptNumber}</p>
          <h1>{questions.length} questions · pass with {config?.minPassingScore || 14}+</h1>
          <p>Answer all questions and submit. Your score is calculated on the server.</p>
        </div>
        <div className="assessment-facts">
          <span>{questions.length} questions</span>
          <span>1 mark each</span>
          <span>Pass: {config?.minPassingScore || 14}/{questions.length}</span>
        </div>
      </section>

      {error && <p className="form-alert">{error}</p>}

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#3a5443', marginBottom: 5 }}>
          <span>Question {currentIdx + 1} of {questions.length}</span>
          <span>{answeredCount}/{questions.length} answered</span>
        </div>
        <div className="progress" style={{ height: 6 }}>
          <i style={{ width: `${progressPct}%`, background: '#6ea65b' }} />
        </div>
      </div>

      {/* Question card */}
      {q && (
        <section className="skill-select">
          <div className="quiz-card" style={{ padding: 24 }}>
            <div className="question-number">{currentIdx + 1}</div>
            <h2 style={{ margin: '6px 0 18px', fontSize: 16, color: '#2b4031', letterSpacing: '-0.02em' }}>
              {q.prompt}
            </h2>
            {q.skill && (
              <span style={{ fontSize: 9, color: '#8a968c', marginBottom: 12, display: 'block' }}>
                Topic: {q.skill}
              </span>
            )}

            <div className="answer-options" style={{ gridTemplateColumns: '1fr' }}>
              {q.options.map((opt, j) => (
                <button
                  key={j}
                  className={answers[q.id] === opt ? 'chosen' : ''}
                  onClick={() => selectAnswer(q.id, opt)}
                >
                  <span>{String.fromCharCode(65 + j)}</span>
                  {opt}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 10 }}>
              <button
                className="button button-outline"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              >
                ← Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  className="button"
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="button"
                  disabled={phase === 'submitting'}
                  onClick={submit}
                  style={unansweredCount > 0 ? { background: '#b45309', borderColor: '#b45309' } : undefined}
                >
                  {phase === 'submitting' ? 'Submitting…' :
                    unansweredCount > 0 ? `Submit (${unansweredCount} unanswered)` : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>

          {/* Question navigator */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16,
            justifyContent: 'center',
          }}>
            {questions.map((question, i) => {
              const isAnswered = !!answers[question.id];
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: 32, height: 32, borderRadius: 5,
                    border: `1px solid ${isCurrent ? '#37805a' : isAnswered ? '#c0ddb8' : '#dce4d9'}`,
                    background: isCurrent ? '#37805a' : isAnswered ? '#eaf5e7' : 'white',
                    color: isCurrent ? 'white' : isAnswered ? '#287048' : '#8a968c',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {unansweredCount > 0 && currentIdx === questions.length - 1 && (
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#946914', fontWeight: 700 }}>
              ⚠ {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered — these will be marked as incorrect.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
