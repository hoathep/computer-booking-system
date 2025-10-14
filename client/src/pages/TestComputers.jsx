import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import axios from 'axios'
import { Monitor, MapPin, Calendar, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addHours, startOfDay, endOfDay, eachHourOfInterval, isSameHour, isWithinInterval, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function TestComputers() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [computers, setComputers] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedComputer, setSelectedComputer] = useState(null)
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([])
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchComputers()
    fetchBookings()
  }, [selectedDate])

  const fetchComputers = async () => {
    try {
      const response = await axios.get('/api/computers')
      setComputers(response.data)
    } catch (error) {
      console.error('Failed to fetch computers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const startDate = startOfDay(selectedDate)
      const endDate = endOfDay(selectedDate)
      const response = await axios.get(`/api/bookings?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`)
      setBookings(response.data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  // Generate time slots for the selected date (8 AM to 10 PM)
  const generateTimeSlots = () => {
    const start = startOfDay(selectedDate)
    const end = endOfDay(selectedDate)
    const hours = eachHourOfInterval({ start, end })
    return hours.filter(hour => hour.getHours() >= 8 && hour.getHours() <= 22)
  }

  const timeSlots = generateTimeSlots()

  // Sort computers: available first, then booked
  const sortedComputers = [...computers].sort((a, b) => {
    if (a.is_currently_booked && !b.is_currently_booked) return 1
    if (!a.is_currently_booked && b.is_currently_booked) return -1
    return 0
  })

  const isTimeSlotBooked = (computer, timeSlot) => {
    return bookings.some(booking => 
      booking.computer_id === computer.id &&
      isWithinInterval(timeSlot, {
        start: new Date(booking.start_time),
        end: new Date(booking.end_time)
      })
    )
  }

  const isTimeSlotSelected = (timeSlot) => {
    return selectedTimeSlots.includes(timeSlot.getTime())
  }

  const handleComputerSelect = (computer) => {
    setSelectedComputer(computer)
    setSelectedTimeSlots([])
  }

  const handleTimeSlotClick = (timeSlot) => {
    if (!selectedComputer) return

    const slotTime = timeSlot.getTime()
    
    if (selectedTimeSlots.includes(slotTime)) {
      // Remove from selection
      setSelectedTimeSlots(prev => prev.filter(time => time !== slotTime))
    } else {
      // Add to selection
      setSelectedTimeSlots(prev => [...prev, slotTime].sort())
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Computer Booking</h1>
          <p className="text-gray-600 mt-1">Testing the new calendar interface</p>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex items-center justify-center space-x-4 bg-white p-4 rounded-lg border">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {format(selectedDate, 'dd/MM/yyyy', { locale: vi })}
          </h2>
          <p className="text-sm text-gray-600">
            {format(selectedDate, 'EEEE', { locale: vi })}
          </p>
        </div>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Debug Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Debug Info:</h3>
        <p className="text-sm text-blue-700">Computers: {computers.length}</p>
        <p className="text-sm text-blue-700">Bookings: {bookings.length}</p>
        <p className="text-sm text-blue-700">Time Slots: {timeSlots.length}</p>
        <p className="text-sm text-blue-700">Selected Computer: {selectedComputer?.name || 'None'}</p>
        <p className="text-sm text-blue-700">Selected Time Slots: {selectedTimeSlots.length}</p>
      </div>

      {/* Main Calendar Interface */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex">
          {/* Computer List (Left Side) */}
          <div className="w-1/4 border-r border-gray-200">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-900">Available Machines</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {sortedComputers.map((computer) => (
                <div
                  key={computer.id}
                  onClick={() => handleComputerSelect(computer)}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedComputer?.id === computer.id
                      ? 'bg-primary-50 border-primary-200'
                      : 'hover:bg-gray-50'
                  } ${computer.is_currently_booked ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${
                      computer.is_currently_booked ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <Monitor className={`h-4 w-4 ${
                        computer.is_currently_booked ? 'text-red-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate text-sm">{computer.name}</h4>
                      {computer.location && (
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{computer.location}</span>
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      computer.is_currently_booked
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {computer.is_currently_booked ? 'In Use' : 'Available'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Grid (Right Side) */}
          <div className="flex-1">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-900">
                {selectedComputer ? `Select time for ${selectedComputer.name}` : 'Select a machine first'}
              </h3>
            </div>
            <div className="p-4">
              {selectedComputer ? (
                <div className="space-y-2">
                  {/* Time Header */}
                  <div className="time-grid mb-2">
                    {timeSlots.map((timeSlot) => (
                      <div key={timeSlot.getTime()} className="text-center text-xs font-medium text-gray-600 py-1">
                        {format(timeSlot, 'HH:mm')}
                      </div>
                    ))}
                  </div>
                  
                  {/* Time Grid */}
                  <div className="time-grid">
                    {timeSlots.map((timeSlot) => {
                      const isBooked = isTimeSlotBooked(selectedComputer, timeSlot)
                      const isSelected = isTimeSlotSelected(timeSlot)
                      const isCurrentHour = isSameHour(timeSlot, new Date())
                      
                      return (
                        <button
                          key={timeSlot.getTime()}
                          onClick={() => handleTimeSlotClick(timeSlot)}
                          disabled={isBooked}
                          className={`h-8 rounded text-xs font-medium transition-all duration-200 ${
                            isBooked
                              ? 'bg-red-200 text-red-600 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-primary-500 text-white shadow-md'
                              : isCurrentHour
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {isBooked ? '❌' : isSelected ? '✓' : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Monitor className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Select a machine to book</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Actions */}
        {selectedComputer && selectedTimeSlots.length > 0 && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Selected time: {selectedTimeSlots.length} hours
                <span className="ml-2 text-primary-600 font-medium">
                  {format(new Date(Math.min(...selectedTimeSlots)), 'HH:mm')} - {format(new Date(Math.max(...selectedTimeSlots) + 60 * 60 * 1000), 'HH:mm')}
                </span>
              </div>
              <button
                onClick={() => setMessage({ type: 'success', text: 'Test booking successful!' })}
                className="btn btn-primary"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Test Booking
              </button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {computers.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No computers available</p>
        </div>
      )}
    </div>
  )
}
