import React, { useEffect, useState } from 'react';
import UserLayout from '../../components/Layout/UserLayout';
import { api } from '../../services/api';
import { Play, FileText, Clock, CheckCircle, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Video {
  _id: string;
  title: string;
  description: string;
  videoLink: string;
  tags: string[];
  department: string;
  pdfLink?: string;
  questions: any[];
  createdAt: string;
}

interface Progress {
  _id: string;
  videoId: string;
  startedAt?: string;
  completedAt?: string;
  watchedTime: number;
  isCompleted: boolean;
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetchVideos();
    fetchProgress();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await api.get('/videos');
      setVideos(response.data);
      
      // Extract unique tags
      const tags = new Set<string>();
      response.data.forEach((video: Video) => {
        video.tags.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await api.get('/progress');
      setProgress(response.data);
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    }
  };

  const getVideoProgress = (videoId: string) => {
    return progress.find(p => p.videoId === videoId);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredVideos = selectedTag 
    ? videos.filter(video => video.tags.includes(selectedTag))
    : videos;

  const completedCount = progress.filter(p => p.isCompleted).length;
  const inProgressCount = progress.filter(p => !p.isCompleted && p.startedAt).length;

  if (loading) {
    return (
      <UserLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Continue seu desenvolvimento com nossos treinamentos corporativos
          </p>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">{completedCount}</p>
                <p className="text-sm text-gray-500">Treinamentos Concluídos</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">{inProgressCount}</p>
                <p className="text-sm text-gray-500">Em Andamento</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-primary-600" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">{videos.length}</p>
                <p className="text-sm text-gray-500">Disponíveis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter by Tags */}
        {allTags.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Filtrar por Categoria
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTag === ''
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Videos Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Seus Treinamentos {selectedTag && `- ${selectedTag}`}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const videoProgress = getVideoProgress(video._id);
              const isCompleted = videoProgress?.isCompleted;
              const hasStarted = videoProgress?.startedAt;
              
              return (
                <div key={video._id} className="card hover:shadow-lg transition-shadow">
                  {/* Video Thumbnail */}
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center relative">
                    <Play className="h-12 w-12 text-gray-400" />
                    {isCompleted && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-6 w-6 text-green-600 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  
                  {/* Video Info */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {video.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {video.description}
                  </p>
                  
                  {/* Tags */}
                  {video.tags.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {video.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Progress Info */}
                  {videoProgress && (
                    <div className="mb-3 text-sm text-gray-500">
                      {isCompleted ? (
                        <span className="text-green-600 font-medium">✓ Concluído</span>
                      ) : hasStarted ? (
                        <span className="text-orange-600 font-medium">
                          Em andamento - {formatDuration(videoProgress.watchedTime)} assistido
                        </span>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/video/${video._id}`}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      <Play className="h-4 w-4" />
                      {isCompleted ? 'Revisar' : hasStarted ? 'Continuar' : 'Assistir'}
                    </Link>
                    
                    {video.pdfLink && (
                      <a
                        href={video.pdfLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-primary-600 flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">PDF</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum vídeo encontrado
            </h3>
            <p className="text-gray-500">
              {selectedTag 
                ? `Não há vídeos disponíveis com a tag "${selectedTag}"`
                : 'Não há vídeos disponíveis para seu departamento no momento'
              }
            </p>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default UserDashboard;