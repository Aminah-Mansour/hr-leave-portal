import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

import { configureAmplify } from './lib/amplify'
import App from './App.tsx'
import './i18n'
import './index.css'

// Configure Amplify once before mounting the React tree.
configureAmplify()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div data-theme="hr-light">
      <Authenticator>
        <App />
      </Authenticator>
    </div>
  </StrictMode>,
)
