import { useEffect, useState } from 'react'
import axios from 'axios'
import { Save, Plus, Edit, Trash2, Eye, Mail, TestTube } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'

export default function AdminEmailTemplates() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState([])
  const [filteredTemplates, setFilteredTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [testData, setTestData] = useState({})
  const [testResult, setTestResult] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    variables: [],
    is_active: true
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, statusFilter])

  const filterTemplates = () => {
    let filtered = templates

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(template =>
        statusFilter === 'active' ? template.is_active : !template.is_active
      )
    }

    setFilteredTemplates(filtered)
  }

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/admin/email-templates')
      setTemplates(res.data)
    } catch (error) {
      setMessage({ type: 'error', text: t('admin.emailTemplates.messages.loadError') || 'Failed to load email templates' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await axios.put(`/api/admin/email-templates/${editingTemplate.id}`, form)
        setMessage({ type: 'success', text: t('admin.emailTemplates.messages.updated') })
      } else {
        await axios.post('/api/admin/email-templates', form)
        setMessage({ type: 'success', text: t('admin.emailTemplates.messages.created') })
      }
      setShowModal(false)
      setEditingTemplate(null)
      resetForm()
      fetchTemplates()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || t('admin.emailTemplates.messages.saveError') || 'Failed to save template' })
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: template.variables || [],
      is_active: template.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.emailTemplates.messages.deleteConfirm') || 'Are you sure you want to delete this template?')) return
    
    try {
      await axios.delete(`/api/admin/email-templates/${id}`)
      setMessage({ type: 'success', text: t('admin.emailTemplates.messages.deleted') })
      fetchTemplates()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || t('admin.emailTemplates.messages.deleteError') || 'Failed to delete template' })
    }
  }

  const handleTest = async (template) => {
    setEditingTemplate(template)
    setTestData({})
    setTestResult(null)
    setShowTestModal(true)
  }

  const runTest = async () => {
    try {
      const res = await axios.post(`/api/admin/email-templates/${editingTemplate.id}/test`, {
        testData
      })
      setTestResult(res.data)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || t('admin.emailTemplates.messages.testError') || 'Failed to test template' })
    }
  }

  const resetForm = () => {
    setForm({
      name: '',
      subject: '',
      body: '',
      variables: [],
      is_active: true
    })
  }

  const openCreateModal = () => {
    setEditingTemplate(null)
    resetForm()
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setShowTestModal(false)
    setEditingTemplate(null)
    resetForm()
    setTestResult(null)
  }

  const addVariable = () => {
    setForm(prev => ({
      ...prev,
      variables: [...prev.variables, '']
    }))
  }

  const updateVariable = (index, value) => {
    setForm(prev => ({
      ...prev,
      variables: prev.variables.map((v, i) => i === index ? value : v)
    }))
  }

  const removeVariable = (index) => {
    setForm(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading') || 'Loading...'}</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Mail className="h-6 w-6 mr-2" />
            {t('admin.emailTemplates.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('admin.emailTemplates.description')}
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary inline-flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.emailTemplates.createTemplate')}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Template Count removed per request */}

      {/* Templates Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 first:border-l-0">
                  {t('admin.emailTemplates.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 first:border-l-0">
                  {t('admin.emailTemplates.subject')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 first:border-l-0">
                  {t('admin.emailTemplates.variables')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 first:border-l-0">
                  <div className="flex flex-col items-start space-y-1">
                    <span>{t('admin.emailTemplates.table.status')}</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="all">{t('common.all')}</option>
                      <option value="active">{t('admin.emailTemplates.active')}</option>
                      <option value="inactive">{t('admin.emailTemplates.inactive')}</option>
                    </select>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 first:border-l-0">
                  {t('admin.emailTemplates.table.created')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 first:border-l-0">
                  {t('admin.emailTemplates.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map(template => (
                <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 first:border-l-0">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {template.body.substring(0, 60)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-l border-gray-200 first:border-l-0">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={template.subject}>
                      {template.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 first:border-l-0">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {template.variables?.length || 0} {t('admin.emailTemplates.table.vars')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 first:border-l-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      template.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.is_active ? t('admin.emailTemplates.active') : t('admin.emailTemplates.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-l border-gray-200 first:border-l-0">
                    {new Date(template.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium border-l border-gray-200 first:border-l-0">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleTest(template)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title={t('admin.emailTemplates.testTemplate')}
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        {t('admin.emailTemplates.table.test')}
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title={t('admin.emailTemplates.editTemplate')}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {t('admin.emailTemplates.table.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title={t('admin.emailTemplates.deleteTemplate')}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t('admin.emailTemplates.table.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {templates.length === 0 
                ? t('admin.emailTemplates.noTemplates')
                : t('admin.emailTemplates.noMatch')
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {templates.length === 0 
                ? t('admin.emailTemplates.createFirst')
                : t('admin.emailTemplates.adjustFilters')
              }
            </p>
            {templates.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin.emailTemplates.createTemplate')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTemplate ? t('admin.emailTemplates.editTemplate') : t('admin.emailTemplates.createTemplate')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emailTemplates.name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input w-full"
                  placeholder={t('admin.emailTemplates.name')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emailTemplates.subject')}</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="input w-full"
                  placeholder={t('admin.emailTemplates.subject')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emailTemplates.body')}</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
                  className="input w-full"
                  rows="8"
                  placeholder={t('admin.emailTemplates.body')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emailTemplates.variables')}</label>
                <div className="space-y-2">
                  {form.variables.map((variable, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={variable}
                        onChange={(e) => updateVariable(index, e.target.value)}
                        className="input flex-1"
                        placeholder={`${t('admin.emailTemplates.variables')} (e.g., user_name)`}
                      />
                      <button
                        onClick={() => removeVariable(index)}
                        className="btn btn-sm btn-danger"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addVariable} className="btn btn-sm btn-secondary">
                    <Plus className="h-3 w-3 mr-1" />
                    {t('admin.emailTemplates.addVariable')}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">{t('admin.emailTemplates.active')}</label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button onClick={closeModal} className="btn btn-secondary">
                {t('common.cancel') || 'Cancel'}
              </button>
              <button onClick={handleSave} className="btn btn-primary inline-flex items-center">
                <Save className="h-4 w-4 mr-2" />
                {editingTemplate ? t('common.update') || 'Update' : t('common.create') || 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{t('admin.emailTemplates.testTemplate')}: {editingTemplate?.name}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emailTemplates.testData')}</label>
                <div className="space-y-2">
                  {editingTemplate?.variables?.map((variable, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <label className="w-32 text-sm text-gray-600">{variable}:</label>
                      <input
                        type="text"
                        value={testData[variable] || ''}
                        onChange={(e) => setTestData(prev => ({ ...prev, [variable]: e.target.value }))}
                        className="input flex-1"
                        placeholder={`${t('admin.emailTemplates.testData')} for ${variable}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button onClick={runTest} className="btn btn-primary inline-flex items-center">
                  <TestTube className="h-4 w-4 mr-2" />
                  {t('admin.emailTemplates.runTest')}
                </button>
                <button onClick={closeModal} className="btn btn-secondary">
                  {t('common.close') || 'Close'}
                </button>
              </div>
              
              {testResult && (
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('admin.emailTemplates.testSubject')}:</h3>
                    <div className="p-3 bg-gray-50 rounded border">
                      {testResult.testSubject}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('admin.emailTemplates.testBody')}:</h3>
                    <div className="p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                      {testResult.testBody}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}