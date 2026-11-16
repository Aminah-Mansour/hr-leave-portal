import { Amplify } from 'aws-amplify'
import { fetchAuthSession } from 'aws-amplify/auth'

export interface UiRuntimeConfig {
  apiUrl?: string
  userPoolId?: string
  userPoolClientId?: string
  agentRuntimeUrl?: string
  agentRuntimeArn?: string
  region?: string
}

declare global {
  interface Window {
    __HR_LEAVE_PORTAL_CONFIG__?: UiRuntimeConfig
  }
}

/** Resolve deployment-time config first, retaining Vite envs for local development. */
export function getUiRuntimeConfig(): Required<UiRuntimeConfig> {
  const runtime = window.__HR_LEAVE_PORTAL_CONFIG__ ?? {}
  return {
    apiUrl: runtime.apiUrl ?? import.meta.env.VITE_API_URL ?? '',
    userPoolId: runtime.userPoolId ?? import.meta.env.VITE_USER_POOL_ID ?? '',
    userPoolClientId: runtime.userPoolClientId ?? import.meta.env.VITE_USER_POOL_CLIENT_ID ?? '',
    agentRuntimeUrl: runtime.agentRuntimeUrl ?? import.meta.env.VITE_AGENT_RUNTIME_URL ?? '',
    agentRuntimeArn: runtime.agentRuntimeArn ?? import.meta.env.VITE_AGENT_RUNTIME_ARN ?? '',
    region: runtime.region ?? import.meta.env.VITE_AWS_REGION ?? '',
  }
}

/**
 * Configure Amplify with values injected at build time via Vite env vars.
 * Must be called once at app startup before any auth or API operations.
 */
export function configureAmplify(): void {
  const { userPoolId, userPoolClientId, apiUrl, region } = getUiRuntimeConfig()

  if (!userPoolId || !userPoolClientId || !apiUrl) {
    throw new Error('HR Leave Portal runtime configuration is incomplete.')
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
    API: {
      REST: {
        HrLeavePortalApi: {
          endpoint: apiUrl,
          region: region || undefined,
        },
      },
    },
  })
}

/**
 * Returns the current user's Cognito access token for AgentCore.
 * The AgentCore runtime's Cognito configuration validates access tokens.
 */
export async function getJwt(): Promise<string> {
  const session = await fetchAuthSession()
  const token = session.tokens?.accessToken?.toString()
  if (!token) {
    throw new Error('No active session — user must be authenticated')
  }
  return token
}

/**
 * Returns the Cognito ID token required by the REST API's user-pool authorizer.
 * Its API Gateway methods have no OAuth scopes, so API Gateway validates an ID
 * token rather than the access token used by AgentCore.
 */
export async function getApiJwt(): Promise<string> {
  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()
  if (!token) {
    throw new Error('No active identity token — user must be authenticated')
  }
  return token
}
