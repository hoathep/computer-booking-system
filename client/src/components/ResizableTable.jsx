import { useEffect, useRef } from 'react'

export default function ResizableTable({ children }) {
  const wrapperRef = useRef(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const table = wrapper.querySelector('table')
    if (!table) return

    table.style.tableLayout = table.style.tableLayout || 'auto'

    const ths = Array.from(table.querySelectorAll('thead th'))
    const rows = Array.from(table.querySelectorAll('tbody tr'))

    const cleanupFns = []

    ths.forEach((th, colIndex) => {
      th.style.position = th.style.position || 'relative'

      const handle = document.createElement('div')
      handle.style.position = 'absolute'
      handle.style.top = '0'
      handle.style.right = '0'
      handle.style.width = '6px'
      handle.style.cursor = 'col-resize'
      handle.style.userSelect = 'none'
      handle.style.height = '100%'
      handle.style.transform = 'translateX(50%)'

      let startX = 0
      let startWidth = 0

      const onMouseMove = (e) => {
        const delta = e.clientX - startX
        const newWidth = Math.max(60, startWidth + delta)
        th.style.width = newWidth + 'px'
        // apply width to all cells in this column
        rows.forEach((tr) => {
          const td = tr.children[colIndex]
          if (td) td.style.width = newWidth + 'px'
        })
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      const onMouseDown = (e) => {
        e.preventDefault()
        startX = e.clientX
        startWidth = th.getBoundingClientRect().width
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      }

      handle.addEventListener('mousedown', onMouseDown)
      th.appendChild(handle)

      cleanupFns.push(() => {
        handle.removeEventListener('mousedown', onMouseDown)
        if (handle.parentNode) handle.parentNode.removeChild(handle)
      })
    })

    return () => {
      cleanupFns.forEach((fn) => fn())
    }
  }, [children])

  return (
    <div ref={wrapperRef}>
      {children}
    </div>
  )
}


