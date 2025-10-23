'use client'

import { useRive, useStateMachineInput } from '@rive-app/react-canvas'
import { useEffect } from 'react'

interface RiveButtonProps {
  /**
   * Path to the .riv file
   * Download from: https://rive.app/community/files/8359-16034-download-button-animation/
   */
  src: string
  /**
   * Name of the state machine in the Rive file
   */
  stateMachine?: string
  /**
   * Callback when button is clicked
   */
  onClick?: () => void
  /**
   * Whether the button action was successful (triggers success state)
   */
  isSuccess?: boolean
  /**
   * Custom className for the container
   */
  className?: string
  /**
   * Whether to show hover states
   */
  enableHover?: boolean
}

export function RiveButton({
  src,
  stateMachine = 'State Machine 1',
  onClick,
  isSuccess = false,
  className = '',
  enableHover = true,
}: RiveButtonProps) {
  const { RiveComponent, rive } = useRive({
    src,
    stateMachines: stateMachine,
    autoplay: true,
  })

  // Get inputs from the state machine
  const hoverInput = useStateMachineInput(rive, stateMachine, 'Hover')
  const clickInput = useStateMachineInput(rive, stateMachine, 'Click')
  const successInput = useStateMachineInput(rive, stateMachine, 'Success')

  // Handle success state
  useEffect(() => {
    if (successInput && isSuccess) {
      successInput.fire()
    }
  }, [isSuccess, successInput])

  const handleMouseEnter = () => {
    if (hoverInput && enableHover) {
      hoverInput.value = true
    }
  }

  const handleMouseLeave = () => {
    if (hoverInput && enableHover) {
      hoverInput.value = false
    }
  }

  const handleClick = () => {
    if (clickInput) {
      clickInput.fire()
    }
    onClick?.()
  }

  return (
    <div
      className={`cursor-pointer ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <RiveComponent />
    </div>
  )
}
