import { toast } from 'sonner'

export const useToast = () => {
  const showToast = {
    success: (message, description) => {
      toast.success(message, {
        description,
        duration: 4000,
      })
    },
    
    error: (message, description) => {
      toast.error(message, {
        description,
        duration: 5000,
      })
    },
    
    warning: (message, description) => {
      toast.warning(message, {
        description,
        duration: 4500,
      })
    },
    
    info: (message, description) => {
      toast.info(message, {
        description,
        duration: 4000,
      })
    },
    
    // Custom toast with action button
    promise: (promise, messages) => {
      toast.promise(promise, {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      })
    },
    
    // Custom toast with action
    action: (message, description, actionLabel, actionFn) => {
      toast(message, {
        description,
        action: {
          label: actionLabel,
          onClick: actionFn,
        },
      })
    },

    // Undo toast - perfect for delete operations
    undo: (message, description, undoFn, options = {}) => {
      const {
        undoLabel = 'Undo',
        duration = 8000, // Longer duration for undo actions
        position = 'bottom-center', // Better position for undo actions
        variant = 'info'
      } = options

      const toastFn = variant === 'success' ? toast.success : 
                     variant === 'error' ? toast.error :
                     variant === 'warning' ? toast.warning : toast.info

      return toastFn(message, {
        description,
        duration,
        position,
        action: {
          label: undoLabel,
          onClick: () => {
            undoFn()
            toast.success('Action undone', 'The operation has been reversed.')
          },
        },
      })
    },

    // Delete with undo - specialized for delete operations
    delete: (itemName, undoFn, options = {}) => {
      const {
        duration = 8000,
        position = 'bottom-center'
      } = options

      return toast.success(`${itemName} deleted`, {
        description: 'The item has been removed.',
        duration,
        position,
        action: {
          label: 'Undo',
          onClick: () => {
            undoFn()
            toast.success(`${itemName} restored`, 'The item has been restored.')
          },
        },
      })
    },

    // Archive with undo
    archive: (itemName, undoFn, options = {}) => {
      const {
        duration = 8000,
        position = 'bottom-center'
      } = options

      return toast.info(`${itemName} archived`, {
        description: 'The item has been moved to archive.',
        duration,
        position,
        action: {
          label: 'Undo',
          onClick: () => {
            undoFn()
            toast.success(`${itemName} unarchived`, 'The item has been restored.')
          },
        },
      })
    },

    // Move with undo
    move: (itemName, destination, undoFn, options = {}) => {
      const {
        duration = 6000,
        position = 'bottom-center'
      } = options

      return toast.success(`${itemName} moved`, {
        description: `Moved to ${destination}.`,
        duration,
        position,
        action: {
          label: 'Undo',
          onClick: () => {
            undoFn()
            toast.success(`${itemName} restored`, 'The item has been moved back.')
          },
        },
      })
    },
    
    // Dismiss all toasts
    dismiss: () => {
      toast.dismiss()
    },
  }
  
  return showToast
}
