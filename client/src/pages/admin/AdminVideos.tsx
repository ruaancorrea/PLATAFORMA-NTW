import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { api } from '../../services/api';
import { Plus, Edit, Trash2, Search, ExternalLink } from 'lucide-react';
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
  createdAt: string;
}

interface Question {
  _id?: string;
  question: string;
  type: 'multiple' | 'text';
  options?: string[];
  correctAnswer?: string;
}

const AdminVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoLink: '',
    tags: '',
    department: '',
    pdfLink: '',
    questions: [] as Question[],
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await api.get('/admin/videos');
      setVideos(response.data);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const videoData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      if (editingVideo) {
        await api.put(`/admin/videos/${editingVideo._id}`, videoData);
        toast.success('Vídeo atualizado com sucesso!');
      } else {
        await api.post('/admin/videos', videoData);
        toast.success('Vídeo criado com sucesso!');
      }
      fetchVideos();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      videoLink: video.videoLink,
      tags: video.tags.join(', '),
      department: video.department,
      pdfLink: video.pdfLink || '',
      questions: video.questions,
    });
    setShowModal(true);
  };

  const handleDelete = async (videoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este vídeo?')) {
      return;
    }

    try {
      await api.delete(`/admin/videos/${videoId}`);
      toast.success('Vídeo excluído com sucesso!');
      fetchVideos();
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { question: '', type: 'multiple', options: ['', '', '', ''], correctAnswer: '' },
      ],
    });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoLink: '',
      tags: '',
      department: '',
      pdfLink: '',
      questions: [],
    });
    setEditingVideo(null);
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Vídeos</h2>
            <p className="text-gray-600 mt-1">
              Adicione, edite ou remova conteúdos de treinamento
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Adicionar Vídeo
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, departamento ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div key={video._id} className="card">
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-gray-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {video.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                {video.description}
              </p>
              
              <div className="mb-3">
                <p className="text-sm text-gray-500">Departamento: {video.department}</p>
                <p className="text-sm text-gray-500">Perguntas: {video.questions.length}</p>
              </div>
              
              {video.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleEdit(video)}
                  className="text-primary-600 hover:text-primary-800 flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(video._id)}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8 max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">
                {editingVideo ? 'Editar Vídeo' : 'Adicionar Vídeo'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Título do vídeo"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Departamento"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                
                <textarea
                  placeholder="Descrição do vídeo"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field h-24 resize-none"
                  required
                />
                
                <input
                  type="url"
                  placeholder="Link do vídeo (YouTube ou Google Drive)"
                  value={formData.videoLink}
                  onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                  className="input-field"
                  required
                />
                
                <input
                  type="url"
                  placeholder="Link do PDF (opcional)"
                  value={formData.pdfLink}
                  onChange={(e) => setFormData({ ...formData, pdfLink: e.target.value })}
                  className="input-field"
                />
                
                <input
                  type="text"
                  placeholder="Tags (separadas por vírgula)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="input-field"
                />

                {/* Questions Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium">Perguntas do Vídeo</h4>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="btn-secondary text-sm"
                    >
                      Adicionar Pergunta
                    </button>
                  </div>

                  {formData.questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-medium">Pergunta {index + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Digite a pergunta"
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        className="input-field mb-3"
                        required
                      />

                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                        className="input-field mb-3"
                      >
                        <option value="multiple">Múltipla Escolha</option>
                        <option value="text">Dissertativa</option>
                      </select>

                      {question.type === 'multiple' && (
                        <div className="space-y-2">
                          {question.options?.map((option, optionIndex) => (
                            <input
                              key={optionIndex}
                              type="text"
                              placeholder={`Opção ${optionIndex + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [])];
                                newOptions[optionIndex] = e.target.value;
                                updateQuestion(index, 'options', newOptions);
                              }}
                              className="input-field"
                            />
                          ))}
                          <input
                            type="text"
                            placeholder="Resposta correta"
                            value={question.correctAnswer || ''}
                            onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                            className="input-field"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingVideo ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVideos;