import { createContext } from 'react'
import type { User } from '../types'

export interface AuthValue {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
  loginUrl: string
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)
