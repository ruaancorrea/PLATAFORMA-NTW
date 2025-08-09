import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserLayout from '../../components/Layout/UserLayout';
import { api } from '../../services/api';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Video {
  _id: string;
  title: string;
  description: string;
  videoLink: string;
  tags: string[];
  department: string;
  pdfLink?: string;
  questions: Question[];
}

interface Question {
  _id: string;
  question: string;
  type: 'multiple' | 'text';
  options?: string[];
  correctAnswer?: string;
}

interface Progress {
  _id: string;
  videoId: string;
  startedAt?: string;
  completedAt?: string;
  watchedTime: number;
  answeredQuestions: any[];
  isCompleted: boolean;
}

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showQuestions, setShowQuestions] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [hasUnsavedProgress, setHasUnsavedProgress] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchProgress();
    }
  }, [id]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (video && !progress?.isCompleted) {
      const interval = setInterval(() => {
        saveProgress();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [video, watchTime]);

  // Track watch time
  useEffect(() => {
    if (video && !showQuestions && !progress?.isCompleted) {
      const interval = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          setHasUnsavedProgress(true);
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [video, showQuestions, progress?.isCompleted]);

  // Handle page leave warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedProgress && !progress?.isCompleted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedProgress, progress?.isCompleted]);

  const fetchVideo = async () => {
    try {
      const response = await api.get(`/videos/${id}`);
      setVideo(response.data);
    } catch (error) {
      console.error('Erro ao carregar vídeo:', error);
      navigate('/dashboard');
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await api.get(`/progress/${id}`);
      if (response.data) {
        setProgress(response.data);
        setWatchTime(response.data.watchedTime || 0);
        
        // Load saved answers
        const savedAnswers: { [key: string]: string } = {};
        response.data.answeredQuestions.forEach((answer: any) => {
          savedAnswers[answer.questionId] = answer.answer;
        });
        setAnswers(savedAnswers);
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!video || !id) return;

    try {
      await api.post('/progress', {
        videoId: id,
        watchedTime: watchTime,
        answeredQuestions: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      });
      setHasUnsavedProgress(false);
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };

  const markAsCompleted = async () => {
    if (!video || !id) return;

    try {
      await api.post('/progress/complete', {
        videoId: id,
        watchedTime: watchTime,
        answeredQuestions: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      });
      
      toast.success('Treinamento concluído com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setHasUnsavedProgress(true);
  };

  const handleVideoEnd = () => {
    if (video?.questions.length > 0) {
      saveProgress();
      setShowQuestions(true);
    } else {
      markAsCompleted();
    }
  };

  const handleBackClick = () => {
    if (hasUnsavedProgress && !progress?.isCompleted) {
      setShowExitWarning(true);
    } else {
      navigate('/dashboard');
    }
  };

  const confirmExit = () => {
    navigate('/dashboard');
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </UserLayout>
    );
  }

  if (!video) {
    return (
      <UserLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vídeo não encontrado</h2>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Voltar ao Dashboard
          </button>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar ao Dashboard
          </button>
          
          {video.pdfLink && (
            <a
              href={video.pdfLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              <FileText className="h-5 w-5" />
              Material PDF
            </a>
          )}
        </div>

        {/* Progress Info */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                Tempo assistido: {formatDuration(watchTime)}
              </span>
            </div>
            
            {progress?.isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Concluído</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Player */}
        {!showQuestions && (
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{video.title}</h1>
            
            <div className="aspect-video mb-6">
              <iframe
                src={getEmbedUrl(video.videoLink)}
                className="w-full h-full rounded-lg"
                allowFullScreen
                onLoad={() => {
                  // Start tracking if not already completed
                  if (!progress?.isCompleted) {
                    saveProgress();
                  }
                }}
              />
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-600">{video.description}</p>
            </div>
            
            {video.questions.length > 0 && !progress?.isCompleted && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 font-medium mb-2">
                  Este treinamento possui {video.questions.length} pergunta(s) para responder.
                </p>
                <button
                  onClick={handleVideoEnd}
                  className="btn-primary"
                >
                  Ir para as Perguntas
                </button>
              </div>
            )}
            
            {video.questions.length === 0 && !progress?.isCompleted && (
              <div className="mt-6">
                <button
                  onClick={markAsCompleted}
                  className="btn-primary"
                >
                  Marcar como Concluído
                </button>
              </div>
            )}
          </div>
        )}

        {/* Questions */}
        {showQuestions && video.questions.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Perguntas sobre o Treinamento
            </h2>
            
            <div className="space-y-6">
              {video.questions.map((question, index) => (
                <div key={question._id} className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {index + 1}. {question.question}
                  </h3>
                  
                  {question.type === 'multiple' && question.options ? (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name={question._id}
                            value={option}
                            checked={answers[question._id] === option}
                            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                            className="form-radio"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={answers[question._id] || ''}
                      onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                      className="input-field h-32 resize-none"
                      placeholder="Digite sua resposta..."
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={markAsCompleted}
                className="btn-primary"
                disabled={video.questions.some(q => !answers[q._id])}
              >
                Finalizar Treinamento
              </button>
            </div>
          </div>
        )}

        {/* Exit Warning Modal */}
        {showExitWarning && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-medium">Sair do Treinamento?</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Você tem progresso não salvo. Se sair agora, seu progresso será perdido
                e você precisará começar novamente.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExitWarning(false)}
                  className="btn-secondary"
                >
                  Continuar Assistindo
                </button>
                <button
                  onClick={confirmExit}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Sair Mesmo Assim
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default VideoPlayer;