import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { bootstrapTenant } from '@/api/persistence'
import {
  getLocalTenantConfiguration,
  initPersistenceRuntime,
} from '@/lib/persistenceSync'
import {
  getTenantIdFromEnv,
  getTenantNameFromEnv,
  isPersistenceEnabled,
} from '@/lib/tenantEnv'
import type { TenantBootstrapResponse, TenantConfiguration } from '@/types/persistence'

interface TenantContextValue {
  isReady: boolean
  error: string | null
  tenantId: string | null
  tenantName: string | null
  configuration: TenantConfiguration | null
  refreshConfiguration: () => Promise<void>
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(!isPersistenceEnabled())
  const [error, setError] = useState<string | null>(null)
  const [bootstrap, setBootstrap] = useState<TenantBootstrapResponse | null>(null)

  const loadTenant = useCallback(async () => {
    if (!isPersistenceEnabled()) {
      setIsReady(true)
      return
    }

    const tenantId = getTenantIdFromEnv()
    const tenantName = getTenantNameFromEnv()

    try {
      const result = await bootstrapTenant(tenantId, tenantName)
      initPersistenceRuntime(result.tenant_id, result.configuration)
      setBootstrap(result)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tenant configuration'
      setError(message)
      console.warn('[persistence] tenant bootstrap failed', err)
    } finally {
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    void loadTenant()
  }, [loadTenant])

  const refreshConfiguration = useCallback(async () => {
    await loadTenant()
  }, [loadTenant])

  const value = useMemo<TenantContextValue>(
    () => ({
      isReady,
      error,
      tenantId: bootstrap?.tenant_id ?? (isPersistenceEnabled() ? getTenantIdFromEnv() : null),
      tenantName: bootstrap?.tenant_name ?? (isPersistenceEnabled() ? getTenantNameFromEnv() : null),
      configuration: getLocalTenantConfiguration() ?? bootstrap?.configuration ?? null,
      refreshConfiguration,
    }),
    [isReady, error, bootstrap, refreshConfiguration],
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}

export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext)
}
