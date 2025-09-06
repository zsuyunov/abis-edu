'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useLoading } from '@/components/providers/LoadingProvider';

interface ActionState {
  isLoading: boolean;
  progress?: number;
  message?: string;
  error?: string;
}

interface ActionFeedbackOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  showProgress?: boolean;
  showToast?: boolean;
  autoHideLoader?: boolean;
  timeout?: number;
}

export const useActionFeedback = () => {
  const { showLoader, hideLoader } = useLoading();
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});

  const executeWithFeedback = useCallback(
    async <T>(
      actionId: string,
      action: () => Promise<T>,
      options: ActionFeedbackOptions = {}
    ): Promise<T> => {
      const {
        loadingMessage = 'Processing...',
        successMessage,
        errorMessage = 'Operation failed',
        showProgress = false,
        showToast = true,
        autoHideLoader = true,
        timeout = 30000, // 30 seconds
      } = options;

      // Set loading state
      setActionStates(prev => ({
        ...prev,
        [actionId]: {
          isLoading: true,
          progress: showProgress ? 0 : undefined,
          message: loadingMessage,
        },
      }));

      // Show global loader if needed
      if (showToast) {
        showLoader(loadingMessage);
      }

      // Progress simulation for better UX
      let progressInterval: NodeJS.Timeout | undefined;
      if (showProgress) {
        progressInterval = setInterval(() => {
          setActionStates(prev => {
            const current = prev[actionId];
            if (current && current.progress !== undefined && current.progress < 90) {
              return {
                ...prev,
                [actionId]: {
                  ...current,
                  progress: current.progress + Math.random() * 10,
                },
              };
            }
            return prev;
          });
        }, 200);
      }

      // Timeout protection
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeout);
      });

      try {
        // Execute the action with timeout protection
        const result = await Promise.race([action(), timeoutPromise]);

        // Complete progress
        if (showProgress) {
          setActionStates(prev => ({
            ...prev,
            [actionId]: {
              ...prev[actionId],
              progress: 100,
            },
          }));
        }

        // Show success feedback
        if (successMessage && showToast) {
          toast.success(successMessage);
        }

        // Clean up
        if (progressInterval) clearInterval(progressInterval);
        if (autoHideLoader) hideLoader();

        // Remove action state after a delay
        setTimeout(() => {
          setActionStates(prev => {
            const { [actionId]: _, ...rest } = prev;
            return rest;
          });
        }, 1000);

        return result;
      } catch (error) {
        // Clean up
        if (progressInterval) clearInterval(progressInterval);
        if (autoHideLoader) hideLoader();

        // Set error state
        const errorMsg = error instanceof Error ? error.message : errorMessage;
        setActionStates(prev => ({
          ...prev,
          [actionId]: {
            isLoading: false,
            error: errorMsg,
          },
        }));

        // Show error feedback
        if (showToast) {
          toast.error(errorMsg);
        }

        // Remove error state after a delay
        setTimeout(() => {
          setActionStates(prev => {
            const { [actionId]: _, ...rest } = prev;
            return rest;
          });
        }, 3000);

        throw error;
      }
    },
    [showLoader, hideLoader]
  );

  const getActionState = useCallback(
    (actionId: string): ActionState => {
      return actionStates[actionId] || { isLoading: false };
    },
    [actionStates]
  );

  const isActionLoading = useCallback(
    (actionId: string): boolean => {
      return actionStates[actionId]?.isLoading || false;
    },
    [actionStates]
  );

  const clearActionState = useCallback((actionId: string) => {
    setActionStates(prev => {
      const { [actionId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    executeWithFeedback,
    getActionState,
    isActionLoading,
    clearActionState,
  };
};

// Specialized hooks for common actions
export const useNavigationFeedback = () => {
  const { executeWithFeedback } = useActionFeedback();

  const navigateWithFeedback = useCallback(
    async (path: string, router: any) => {
      return executeWithFeedback(
        `navigate-${path}`,
        async () => {
          router.push(path);
          // Wait a bit to ensure navigation starts
          await new Promise(resolve => setTimeout(resolve, 100));
        },
        {
          loadingMessage: 'Navigating...',
          showToast: false, // Navigation feedback is handled by global loader
          autoHideLoader: false, // Let navigation loader handle this
        }
      );
    },
    [executeWithFeedback]
  );

  return { navigateWithFeedback };
};

export const useSaveFeedback = () => {
  const { executeWithFeedback } = useActionFeedback();

  const saveWithFeedback = useCallback(
    async <T>(
      saveAction: () => Promise<T>,
      options?: {
        entityName?: string;
        showProgress?: boolean;
      }
    ) => {
      const { entityName = 'item', showProgress = true } = options || {};
      
      return executeWithFeedback(
        `save-${entityName}-${Date.now()}`,
        saveAction,
        {
          loadingMessage: `Saving ${entityName}...`,
          successMessage: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} saved successfully`,
          errorMessage: `Failed to save ${entityName}`,
          showProgress,
        }
      );
    },
    [executeWithFeedback]
  );

  return { saveWithFeedback };
};

export const useDeleteFeedback = () => {
  const { executeWithFeedback } = useActionFeedback();

  const deleteWithFeedback = useCallback(
    async <T>(
      deleteAction: () => Promise<T>,
      options?: {
        entityName?: string;
        confirmMessage?: string;
      }
    ) => {
      const { entityName = 'item', confirmMessage } = options || {};
      
      // Show confirmation if provided
      if (confirmMessage && !window.confirm(confirmMessage)) {
        throw new Error('Operation cancelled');
      }
      
      return executeWithFeedback(
        `delete-${entityName}-${Date.now()}`,
        deleteAction,
        {
          loadingMessage: `Deleting ${entityName}...`,
          successMessage: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} deleted successfully`,
          errorMessage: `Failed to delete ${entityName}`,
          showProgress: false,
        }
      );
    },
    [executeWithFeedback]
  );

  return { deleteWithFeedback };
};

export const useExportFeedback = () => {
  const { executeWithFeedback } = useActionFeedback();

  const exportWithFeedback = useCallback(
    async <T>(
      exportAction: () => Promise<T>,
      options?: {
        format?: string;
        filename?: string;
      }
    ) => {
      const { format = 'file', filename = 'export' } = options || {};
      
      return executeWithFeedback(
        `export-${filename}-${Date.now()}`,
        exportAction,
        {
          loadingMessage: `Preparing ${format} export...`,
          successMessage: `${filename} exported successfully`,
          errorMessage: `Failed to export ${filename}`,
          showProgress: true,
          timeout: 60000, // 1 minute for exports
        }
      );
    },
    [executeWithFeedback]
  );

  return { exportWithFeedback };
};

export const useImportFeedback = () => {
  const { executeWithFeedback } = useActionFeedback();

  const importWithFeedback = useCallback(
    async <T>(
      importAction: () => Promise<T>,
      options?: {
        filename?: string;
        recordCount?: number;
      }
    ) => {
      const { filename = 'file', recordCount } = options || {};
      
      return executeWithFeedback(
        `import-${filename}-${Date.now()}`,
        importAction,
        {
          loadingMessage: recordCount 
            ? `Importing ${recordCount} records...` 
            : `Importing ${filename}...`,
          successMessage: recordCount
            ? `Successfully imported ${recordCount} records`
            : `${filename} imported successfully`,
          errorMessage: `Failed to import ${filename}`,
          showProgress: true,
          timeout: 120000, // 2 minutes for imports
        }
      );
    },
    [executeWithFeedback]
  );

  return { importWithFeedback };
};

export const useBulkActionFeedback = () => {
  const { executeWithFeedback } = useActionFeedback();

  const bulkActionWithFeedback = useCallback(
    async <T>(
      bulkAction: () => Promise<T>,
      options?: {
        actionName?: string;
        itemCount?: number;
      }
    ) => {
      const { actionName = 'process', itemCount } = options || {};
      
      return executeWithFeedback(
        `bulk-${actionName}-${Date.now()}`,
        bulkAction,
        {
          loadingMessage: itemCount 
            ? `Processing ${itemCount} items...` 
            : `Processing items...`,
          successMessage: itemCount
            ? `Successfully processed ${itemCount} items`
            : `Bulk operation completed successfully`,
          errorMessage: `Bulk operation failed`,
          showProgress: true,
          timeout: 180000, // 3 minutes for bulk operations
        }
      );
    },
    [executeWithFeedback]
  );

  return { bulkActionWithFeedback };
};
