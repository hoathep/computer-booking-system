import { useEffect, useState } from 'react'
import axios from 'axios'
import { Save, TestTube, Bot, Server, Key, Globe } from 'lucide-react'

export default function AdminAISettings() {
  const [form, setForm] = useState({
    provider: 'localai',
    // OpenAI settings
    openaiApiKey: '',
    openaiBaseUrl: 'https://api.openai.com/v1',
    openaiModel: 'gpt-3.5-turbo',
    openaiMaxTokens: 1000,
    openaiTemperature: 0.7,
    // Local AI settings
    localAiUrl: 'http://10.73.135.29:8000/v1',
    localAiApiKey: '',
    localAiModel: '/home/aidata/h100/gpt-oss-120b/',
    localAiMaxTokens: 1000,
    localAiTemperature: 0.7,
    // Fallback settings
    fallbackEnabled: true,
    fallbackMessage: 'Xin lỗi, AI Assistant tạm thời không khả dụng. Vui lòng thử lại sau.',
    // Suggested questions
    adminQuestions: [
      "Cách quản lý users?",
      "Hướng dẫn cấu hình email?",
      "Cách xuất báo cáo?",
      "Quản lý nhóm người dùng?",
      "Khắc phục sự cố admin?"
    ],
    userQuestions: [
      "Cách đặt máy tính?",
      "Làm sao hủy lịch đặt?",
      "Tính năng admin có gì?",
      "Cài đặt hệ thống như thế nào?",
      "Khắc phục sự cố?"
    ]
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/admin/ai-settings')
        if (res.data) {
          setForm(prev => ({ ...prev, ...res.data }))
        }
      } catch (e) {
        console.error('Failed to load AI settings:', e)
      }
    }
    load()
  }, [])

  const onSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await axios.post('/api/admin/ai-settings', form)
      setMessage({ type: 'success', text: 'Đã lưu cấu hình AI' })
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Lỗi khi lưu cấu hình' })
    } finally {
      setSaving(false)
    }
  }

  const onTest = async () => {
    setTesting(true)
    setMessage(null)
    try {
      const res = await axios.post('/api/admin/ai-settings/test', form)
      setMessage({ type: 'success', text: res.data.message })
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Lỗi khi test kết nối' })
    } finally {
      setTesting(false)
    }
  }

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bot className="h-6 w-6 mr-2" />
            Cài đặt AI Assistant
          </h1>
          <p className="text-gray-600 mt-1">
            Cấu hình kết nối AI Assistant
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            disabled={testing} 
            onClick={onTest} 
            className="btn btn-secondary inline-flex items-center"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Đang test...' : 'Test kết nối'}
          </button>
          <button disabled={saving} onClick={onSave} className="btn btn-primary inline-flex items-center">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Provider Selection */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Server className="h-5 w-5 mr-2" />
          AI Provider
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn nhà cung cấp AI
            </label>
            <select
              value={form.provider}
              onChange={(e) => updateForm('provider', e.target.value)}
              className="input w-full"
            >
              <option value="openai">OpenAI</option>
              <option value="localai">Local AI (OpenAI Compatible)</option>
            </select>
          </div>
        </div>
      </div>

      {/* OpenAI Configuration */}
      {form.provider === 'openai' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            OpenAI Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={form.openaiApiKey}
                onChange={(e) => updateForm('openaiApiKey', e.target.value)}
                className="input w-full"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <input
                type="url"
                value={form.openaiBaseUrl}
                onChange={(e) => updateForm('openaiBaseUrl', e.target.value)}
                className="input w-full"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                value={form.openaiModel}
                onChange={(e) => updateForm('openaiModel', e.target.value)}
                className="input w-full"
                placeholder="gpt-3.5-turbo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={form.openaiMaxTokens}
                onChange={(e) => updateForm('openaiMaxTokens', parseInt(e.target.value))}
                className="input w-full"
                min="1"
                max="4000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={form.openaiTemperature}
                onChange={(e) => updateForm('openaiTemperature', parseFloat(e.target.value))}
                className="input w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Local AI Configuration */}
      {form.provider === 'localai' && (
        <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Server className="h-5 w-5 mr-2" />
          Local AI Configuration
        </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Server URL
              </label>
              <input
                type="url"
                value={form.localAiUrl}
                onChange={(e) => updateForm('localAiUrl', e.target.value)}
                className="input w-full"
                placeholder="http://localhost:8000/v1"
              />
              <p className="text-xs text-gray-500 mt-1">OpenAI compatible server endpoint</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key (Optional)
              </label>
              <input
                type="password"
                value={form.localAiApiKey}
                onChange={(e) => updateForm('localAiApiKey', e.target.value)}
                className="input w-full"
                placeholder="Optional API key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Name
              </label>
              <input
                type="text"
                value={form.localAiModel}
                onChange={(e) => updateForm('localAiModel', e.target.value)}
                className="input w-full"
                placeholder="microsoft/DialoGPT-medium"
              />
              <p className="text-xs text-gray-500 mt-1">Model name or path for local AI</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={form.localAiMaxTokens}
                onChange={(e) => updateForm('localAiMaxTokens', parseInt(e.target.value))}
                className="input w-full"
                min="1"
                max="4000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={form.localAiTemperature}
                onChange={(e) => updateForm('localAiTemperature', parseFloat(e.target.value))}
                className="input w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Fallback Configuration */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Key className="h-5 w-5 mr-2" />
          Fallback Configuration
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={form.fallbackEnabled}
                onChange={(e) => updateForm('fallbackEnabled', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable fallback responses
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fallback Message
            </label>
            <textarea
              value={form.fallbackMessage}
              onChange={(e) => updateForm('fallbackMessage', e.target.value)}
              className="input w-full"
              rows="3"
              placeholder="Xin lỗi, AI Assistant tạm thời không khả dụng..."
            />
          </div>
        </div>
      </div>

      {/* Suggested Questions Configuration */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          Gợi ý Câu Hỏi
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admin Questions */}
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
              <Server className="h-4 w-4 mr-2" />
              Câu hỏi cho Admin
            </h3>
            <div className="space-y-3">
              {form.adminQuestions.map((question, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => {
                      const newQuestions = [...form.adminQuestions];
                      newQuestions[index] = e.target.value;
                      updateForm('adminQuestions', newQuestions);
                    }}
                    className="input flex-1 text-sm"
                    placeholder={`Câu hỏi ${index + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* User Questions */}
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Câu hỏi cho User
            </h3>
            <div className="space-y-3">
              {form.userQuestions.map((question, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => {
                      const newQuestions = [...form.userQuestions];
                      newQuestions[index] = e.target.value;
                      updateForm('userQuestions', newQuestions);
                    }}
                    className="input flex-1 text-sm"
                    placeholder={`Câu hỏi ${index + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Lưu ý:</strong> Những câu hỏi này sẽ hiển thị dưới dạng gợi ý trong AI Assistant. 
            Admin sẽ thấy câu hỏi admin, user thường sẽ thấy câu hỏi user.
          </p>
        </div>
      </div>

      {/* Current Status */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Current Status
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Provider:
              </span>
              <p className="text-sm text-gray-900">{form.provider.toUpperCase()}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Endpoint:
              </span>
              <p className="text-sm text-gray-900">
                {form.provider === 'openai' ? form.openaiBaseUrl : form.localAiUrl}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Model:
              </span>
              <p className="text-sm text-gray-900">
                {form.provider === 'openai' ? form.openaiModel : form.localAiModel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
