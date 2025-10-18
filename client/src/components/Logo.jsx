import React from 'react'

export default function Logo({ className = "h-8 w-8", variant = "default" }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <img 
        src="/HAAN.jpg" 
        alt="Computer Booking System Logo"
        className="w-full h-full object-contain"
      />
    </div>
  )
}
