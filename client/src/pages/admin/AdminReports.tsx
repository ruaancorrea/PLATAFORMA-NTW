import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { api } from '../../services/api';
import { Download, Users, Video, Clock, CheckCircle } from 'lucide-react';

interface ProgressReport {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    department: string;
  };
  videoId: {
    _id: string;
    title: string;
    department: string;
  };
  startedAt: string;
  completedAt?: string;
  watchedTime: number;
  answeredQuestions: any[];
  isCompleted: boolean;
}

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    fetchReports();
    fetchDepartments();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/admin/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/admin/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    }
  };

  const filteredReports = filterDepartment
    ? reports.filter(report => report.userId.department === filterDepartment)
    : reports;

  const completedReports = filteredReports.filter(report => report.isCompleted);
  const completionRate = filteredReports.length > 0 
    ? Math.round((completedReports.length / filteredReports.length) * 100)
    : 0;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const exportReports = () => {
    const csvContent = [
      ['Nome', 'Email', 'Departamento', 'Vídeo', 'Status', 'Tempo Assistido', 'Data Início', 'Data Conclusão'].join(','),
      ...filteredReports.map(report => [
        report.userId.name,
        report.userId.email,
        report.userId.department,
        report.videoId.title,
        report.isCompleted ? 'Concluído' : 'Em andamento',
        formatDuration(report.watchedTime),
        new Date(report.startedAt).toLocaleDateString('pt-BR'),
        report.completedAt ? new Date(report.completedAt).toLocaleDateString('pt-BR') : '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-treinamentos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            <h2 className="text-2xl font-bold text-gray-900">Relatórios de Progresso</h2>
            <p className="text-gray-600 mt-1">
              Acompanhe o progresso dos funcionários nos treinamentos
            </p>
          </div>
          <button
            onClick={exportReports}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="h-5 w-5" />
            Exportar CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredReports.length}
                </p>
                <p className="text-sm text-gray-500">Total de Registros</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">
                  {completedReports.length}
                </p>
                <p className="text-sm text-gray-500">Concluídos</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredReports.length - completedReports.length}
                </p>
                <p className="text-sm text-gray-500">Em Andamento</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">
                  {completionRate}%
                </p>
                <p className="text-sm text-gray-500">Taxa de Conclusão</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="card">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Filtrar por Departamento:
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">Todos os Departamentos</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vídeo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo Assistido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Início
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Conclusão
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.userId.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.userId.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.userId.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.videoId.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.isCompleted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.isCompleted ? 'Concluído' : 'Em andamento'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(report.watchedTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.startedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.completedAt 
                        ? new Date(report.completedAt).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;