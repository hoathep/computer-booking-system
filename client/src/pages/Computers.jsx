import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import axios from 'axios'
import { Monitor, MapPin, Calendar, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addHours, startOfDay, endOfDay, eachMinuteOfInterval, isSameMinute, isWithinInterval, addDays } from 'date-fns'
import { vi, ja, enUS } from 'date-fns/locale'

export default function Computers() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const [computers, setComputers] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedComputer, setSelectedComputer] = useState(null)
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [message, setMessage] = useState(null)
  const [tooltip, setTooltip] = useState({ show: false, content: null, x: 0, y: 0 })
  const [tooltipTimeout, setTooltipTimeout] = useState(null)

  useEffect(() => {
    fetchComputers()
    fetchBookings()
    // Auto cleanup expired bookings
    cleanupExpiredBookings()
    
    // Auto refresh every 30 seconds to update status
    const interval = setInterval(() => {
      fetchComputers()
      fetchBookings()
      cleanupExpiredBookings()
    }, 30000)
    
    return () => {
      clearInterval(interval)
      // Cleanup tooltip timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout)
      }
    }
  }, [selectedDate, tooltipTimeout])

  // Auto cleanup expired bookings
  const cleanupExpiredBookings = async () => {
    try {
      await axios.post('/api/computers/cleanup-expired')
    } catch (error) {
      console.error('Failed to cleanup expired bookings:', error)
    }
  }

  const fetchComputers = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const response = await axios.get(`/api/computers?date=${dateStr}`)
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

  // Generate time slots for the selected date (full 24h) with 30-minute steps
  const generateTimeSlots = () => {
    const start = startOfDay(selectedDate)
    const end = endOfDay(selectedDate)
    const minutes = eachMinuteOfInterval({ start, end }, { step: 30 })
    return minutes
  }

  const timeSlots = generateTimeSlots()

  // Horizontal scroll refs for timeline header and grid
  const headerScrollRef = useRef(null)
  const gridScrollRef = useRef(null)

  // Sync scroll positions between header and grid
  const syncHeaderScroll = (e) => {
    if (!gridScrollRef.current) return
    gridScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
  }
  const syncGridScroll = (e) => {
    if (!headerScrollRef.current) return
    headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
  }

  // On mount/change date, focus around 08:00 to 17:00 range
  useLayoutEffect(() => {
    const idx = 8 * 2 // 30-min slots → 2 slots per hour
    const header = headerScrollRef.current
    const grid = gridScrollRef.current
    if (!header) return
    const scrollToTarget = () => {
      const target = header.querySelector(`[data-idx="${idx}"]`)
      if (target) {
        const left = Math.max(0, target.offsetLeft - 100)
        header.scrollLeft = left
        if (grid) grid.scrollLeft = left
      }
    }
    // Ensure after first paint
    requestAnimationFrame(scrollToTarget)
    setTimeout(scrollToTarget, 0)
  }, [selectedDate, timeSlots.length])

  // Sort computers: booked first, then by status
  const sortedComputers = [...computers].sort((a, b) => {
    // First: booked computers (in_use or booked) - these go to top
    if ((a.status === 'in_use' || a.status === 'booked' || a.status === 'partially_available') && !(b.status === 'in_use' || b.status === 'booked' || b.status === 'partially_available')) return -1
    if (!(a.status === 'in_use' || a.status === 'booked' || a.status === 'partially_available') && (b.status === 'in_use' || b.status === 'booked' || b.status === 'partially_available')) return 1
    
    // Second: maintenance and disabled
    if ((a.status === 'maintenance' || a.status === 'disabled') && !(b.status === 'maintenance' || b.status === 'disabled')) return 1
    if (!(a.status === 'maintenance' || a.status === 'disabled') && (b.status === 'maintenance' || b.status === 'disabled')) return -1
    
    // Third: by name
    return a.name.localeCompare(b.name)
  })

  const isTimeSlotBooked = (computer, timeSlot) => {
    const t = timeSlot.getTime()
    return bookings.some(booking => {
      if (booking.computer_id !== computer.id) return false
      // Ignore cancelled or completed bookings for clickability
      if (booking.status && !['booked', 'active'].includes(booking.status)) return false
      const start = new Date(booking.start_time).getTime()
      const end = new Date(booking.end_time).getTime()
      // Include the slot that ends at the booking end time
      // This ensures the last 30-minute slot is properly marked as booked
      return t >= start && t <= end
    })
  }

  // Disable the last time slot (23:30-00:00) to avoid booking conflicts
  const isLastTimeSlot = (timeSlot) => {
    const slotTime = timeSlot.getTime()
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 30, 0, 0)
    return slotTime === endOfDay.getTime()
  }

  // Calculate business hours availability status
  const getBusinessHoursStatus = (computer) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const businessStart = new Date(today.getTime() + 8 * 60 * 60 * 1000) // 8 AM
    const businessEnd = new Date(today.getTime() + 17 * 60 * 60 * 1000) // 5 PM
    
    // Only check if we're within business hours or future
    if (now > businessEnd) return null
    
    const businessHoursSlots = timeSlots.filter(slot => {
      const slotTime = slot.getTime()
      return slotTime >= businessStart.getTime() && slotTime < businessEnd.getTime()
    })
    
    if (businessHoursSlots.length === 0) return null
    
    const bookedSlots = businessHoursSlots.filter(slot => isTimeSlotBooked(computer, slot))
    const bookedRatio = bookedSlots.length / businessHoursSlots.length
    
    if (bookedRatio === 1) return 'full'
    if (bookedRatio > 0) return 'partial'
    return 'available'
  }


  const isTimeSlotSelected = (timeSlot) => {
    return selectedTimeSlots.includes(timeSlot.getTime())
  }

  const handleComputerSelect = (computer) => {
    // Clear any previous messages first
    setMessage(null)
    
    // Don't allow selection of maintenance or disabled computers
    if (computer.status === 'maintenance' || computer.status === 'disabled') {
      setMessage({ type: 'error', text: t('computers.cannotBookMaintenance') })
      return
    }
    // Allow selection of in_use or booked computers for additional time slots
    setSelectedComputer(computer)
    setSelectedTimeSlots([])
  }

  const handleTimeSlotClick = (timeSlot) => {
    if (!selectedComputer) return
    const slotTime = timeSlot.getTime()
    // Single-click selects exactly one 30-min block
    setIsSelecting(false)
    setSelectionStart(slotTime)
    setSelectedTimeSlots([slotTime])
  }

  const handleTimeSlotMouseDown = (timeSlot) => {
    if (!selectedComputer) return
    setIsSelecting(true)
    const t = timeSlot.getTime()
    setSelectionStart(t)
    // Toggle exact 30-min block select on mousedown
    setSelectedTimeSlots(prev => {
      if (prev.length === 1 && prev[0] === t) return []
      return [t]
    })
  }

  const handleTimeSlotMouseEnter = (timeSlot) => {
    if (!isSelecting || !selectedComputer) return
    
    const startTime = selectionStart
    const endTime = timeSlot.getTime()
    const minTime = Math.min(startTime, endTime)
    const maxTime = Math.max(startTime, endTime)
    
    const newSlots = []
    for (let time = minTime; time <= maxTime; time += 30 * 60 * 1000) { // Add 30 minutes
      newSlots.push(time)
    }
    setSelectedTimeSlots(newSlots)
  }

  const handleMouseUp = () => {
    setIsSelecting(false)
    setSelectionStart(null)
  }

  const handleMouseEnter = (computer, event) => {
    // Clear any existing timeout to prevent tooltip from hiding
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout)
      setTooltipTimeout(null)
    }
    
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({
      show: true,
      content: computer,
      x: rect.right + 10, // Completely to the right of the button
      y: rect.top // Align with top of the button
    })
  }


  const handleBookingSubmit = async () => {
    if (selectedTimeSlots.length === 0) {
      setMessage({ type: 'error', text: t('computers.pleaseSelectTime') })
      return
    }

    // Check if selected computer is in maintenance or disabled
    if (selectedComputer && (selectedComputer.status === 'maintenance' || selectedComputer.status === 'disabled')) {
      setMessage({ type: 'error', text: t('computers.cannotBookMaintenance') })
      return
    }
    // Allow booking on in_use or booked computers for additional time slots

    setMessage(null)

    try {
      const startTime = new Date(Math.min(...selectedTimeSlots))
      const endTime = new Date(Math.max(...selectedTimeSlots) + 30 * 60 * 1000) // Add 30 minutes to last slot

      const response = await axios.post('/api/bookings', {
        computer_id: selectedComputer.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      })

      setMessage({ 
        type: 'success', 
        text: t('computers.bookingSuccessMessage', { unlockCode: response.data.unlockCode })
      })
      
      // Keep selected time slots visible after successful booking
      // setSelectedComputer(null)
      // setSelectedTimeSlots([])
      fetchComputers()
      fetchBookings()
    } catch (error) {
      console.error('Booking error:', error.response?.data)
      const errorMessage = error.response?.data?.error || t('computers.bookingError')
      
      // Handle specific error messages with i18n
      if (errorMessage.includes('Start time cannot be in the past')) {
        setMessage({ 
          type: 'error', 
          text: t('computers.pastTime')
        })
      } else if (errorMessage.includes('End time must be after start time')) {
        setMessage({ 
          type: 'error', 
          text: t('computers.invalidTime')
        })
      } else if (errorMessage.includes('time slots')) {
        setMessage({ 
          type: 'error', 
          text: t('computers.bookingLimitExceeded') || errorMessage
        })
      } else if (errorMessage.includes('already booked')) {
        setMessage({ 
          type: 'error', 
          text: t('computers.alreadyBooked')
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: errorMessage
        })
      }
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
    <div className="space-y-6" onMouseUp={handleMouseUp}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('computers.title')}</h1>
          <p className="text-gray-600 mt-1">{t('computers.subtitle')}</p>
        </div>
        <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border">
          {t('computers.limit')}: <strong>{user?.max_concurrent_bookings || 1}</strong> {t('computers.machinesAtOnce')}
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
              {format(selectedDate, 'EEEE', { 
                locale: i18n.language === 'vi' ? vi : i18n.language === 'ja' ? ja : enUS 
              })}
            </p>
        </div>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Message */}
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

      {/* Main Calendar Interface */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex">
          {/* Computer List (Left Side) */}
          <div className="w-[15%] border-r border-gray-200">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-900">{t('computers.availableMachines')}</h3>
            </div>
            <div 
              className="max-h-96 overflow-y-auto"
              onMouseLeave={() => {
                // Only hide tooltip when leaving the entire computer list
                const timeout = setTimeout(() => {
                  setTooltip({ show: false, content: null, x: 0, y: 0 })
                }, 100)
                setTooltipTimeout(timeout)
              }}
            >
              {sortedComputers.map((computer) => (
                <div
                  key={computer.id}
                  onClick={() => handleComputerSelect(computer)}
                  onMouseEnter={(e) => handleMouseEnter(computer, e)}
                  className={`p-3 border-b border-gray-100 transition-colors ${
                    computer.status === 'maintenance' || computer.status === 'disabled'
                      ? 'cursor-not-allowed opacity-50 bg-gray-100'
                      : selectedComputer?.id === computer.id
                      ? 'bg-primary-50 border-primary-200 cursor-pointer'
                      : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${
                      computer.status === 'maintenance' ? 'bg-orange-100' :
                      computer.status === 'disabled' ? 'bg-gray-100' :
                      computer.status === 'in_use' ? 'bg-red-100' : 
                      computer.status === 'booked' ? 'bg-blue-100' :
                      computer.status === 'partially_available' ? 'bg-yellow-100' :
                      'bg-green-100'
                    }`}>
                      <Monitor className={`h-4 w-4 ${
                        computer.status === 'maintenance' ? 'text-orange-600' :
                        computer.status === 'disabled' ? 'text-gray-600' :
                        computer.status === 'in_use' ? 'text-red-600' : 
                        computer.status === 'booked' ? 'text-blue-600' :
                        computer.status === 'partially_available' ? 'text-yellow-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate text-sm">{computer.name}</h4>
                      <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                        {computer.status === 'maintenance' ? t('computers.maintenance') :
                         computer.status === 'disabled' ? t('computers.disabled') :
                         computer.status === 'in_use' ? t('computers.inUse') :
                         computer.status === 'booked' ? t('computers.booked') :
                         computer.status === 'partially_available' ? t('computers.partiallyAvailable') :
                         t('computers.available')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Grid (Right Side) */}
          <div className="flex-1">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-900">
                {selectedComputer ? `${t('computers.selectTimeFor')} ${selectedComputer.name}` : t('computers.selectMachineFirst')}
              </h3>
            </div>
            <div className="p-4">
              {selectedComputer ? (
                <div className="space-y-2">
                  {/* Time Header */}
                  <div className="time-grid mb-2 overflow-x-hidden" ref={headerScrollRef} onScroll={syncHeaderScroll}>
                    <div className="min-w-max grid grid-flow-col auto-cols-[17px] gap-1 items-end">
                      {timeSlots.map((timeSlot, i) => (
                        <div key={timeSlot.getTime()} data-idx={i} className="text-center text-[13px] font-medium text-gray-700 py-0 leading-none">
                          {format(timeSlot, 'mm') === '00' ? `${format(timeSlot, 'H')}h` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Time Grid */}
                  <div className="time-grid overflow-x-hidden" ref={gridScrollRef} onScroll={syncGridScroll}>
                    <div className="min-w-max grid grid-flow-col auto-cols-[17px] gap-1">
                    {timeSlots.map((timeSlot) => {
                      const isBooked = isTimeSlotBooked(selectedComputer, timeSlot)
                      const isLastSlot = isLastTimeSlot(timeSlot)
                      const isSelected = isTimeSlotSelected(timeSlot)
                      const isCurrentHour = isSameMinute(timeSlot, new Date())
                      const hour = timeSlot.getHours()
                      const inWorking = hour >= 8 && hour < 17
                      const isDisabled = isBooked || isLastSlot
                      
                      return (
                        <button
                          key={timeSlot.getTime()}
                          onClick={() => !isDisabled && handleTimeSlotClick(timeSlot)}
                          onMouseDown={() => !isDisabled && handleTimeSlotMouseDown(timeSlot)}
                          onMouseEnter={() => !isDisabled && handleTimeSlotMouseEnter(timeSlot)}
                          disabled={isDisabled}
                          className={`h-[22px] rounded text-[11px] font-medium transition-all duration-200 ${
                            isDisabled
                              ? isLastSlot 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                                : 'bg-red-200 text-red-600 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-primary-500 text-white shadow-md'
                              : isCurrentHour
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : inWorking
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
                          title={isLastSlot ? `${format(timeSlot, 'HH:mm')} (${t('computers.cannotBookSlot')})` : `${format(timeSlot, 'HH:mm')}`}
                        >
                          {isBooked ? '❌' : isLastSlot ? '🚫' : isSelected ? '✓' : ''}
                        </button>
                      )
                    })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Monitor className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">{t('computers.selectMachineToBook')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

         {/* Booking Actions */}
         {selectedComputer && selectedTimeSlots.length > 0 && (
           <div className="p-4 bg-gray-50 border-t">
             <div className="flex items-center justify-between">
               <div className="text-lg text-gray-600">
                 {t('computers.selectedTime')}: <strong className="font-bold">{selectedTimeSlots.length * 0.5} {t('computers.hours')}</strong>
                 <span className="ml-2 text-primary-600 font-bold">
                   {format(new Date(Math.min(...selectedTimeSlots)), 'HH:mm')} - {format(new Date(Math.max(...selectedTimeSlots) + 30 * 60 * 1000), 'HH:mm')}
                 </span>
               </div>
               <button
                 onClick={handleBookingSubmit}
                 className="btn btn-primary inline-flex items-center"
               >
                 <Calendar className="h-4 w-4 mr-2" />
                 {t('computers.confirmBooking')}
               </button>
             </div>
           </div>
         )}
      </div>

      {computers.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{t('computers.noMachines')}</p>
        </div>
      )}

      {/* Custom Tooltip */}
      {tooltip.show && tooltip.content && (
        <>
          {/* Invisible bridge between button and tooltip */}
          <div
            className="fixed z-40"
            style={{
              left: tooltip.x - 10,
              top: tooltip.y,
              width: 20,
              height: 40
            }}
            onMouseEnter={() => {
              if (tooltipTimeout) {
                clearTimeout(tooltipTimeout)
                setTooltipTimeout(null)
              }
            }}
          />
          
          {/* Tooltip content */}
          <div
            className="fixed z-50 bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs border border-gray-200"
            style={{
              left: tooltip.x,
              top: tooltip.y
            }}
            onMouseEnter={() => {
              // Clear timeout when mouse enters tooltip
              if (tooltipTimeout) {
                clearTimeout(tooltipTimeout)
                setTooltipTimeout(null)
              }
            }}
            onMouseLeave={() => {
              // Hide tooltip when mouse leaves tooltip
              setTooltip({ show: false, content: null, x: 0, y: 0 })
            }}
          >
            <div className="font-bold text-gray-900 mb-1">{tooltip.content.name}</div>
            <div className="text-gray-600 text-xs">
              <div>{t('computers.location')}: {tooltip.content.location || t('computers.notAvailable')}   -   {t('computers.priorityGroup')}: {tooltip.content.preferred_group || t('computers.notAvailable')}</div>
              <div>{t('computers.memory')}: {tooltip.content.memory_gb || t('computers.notAvailable')}   -   {t('computers.ipAddress')}: {tooltip.content.ip_address || t('computers.notAvailable')}</div>
              <div>{t('computers.description')}: {tooltip.content.description || t('computers.notAvailable')}</div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}


