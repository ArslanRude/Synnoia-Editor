import { useAuth } from './useAuth'

// Auth guard for protecting routes/pages
export async function requireAuth(): Promise<boolean> {
  const { user, checkAuth, isLoading } = useAuth()
  
  // Wait for auth check to complete
  await checkAuth()
  
  // If no user, redirect to login
  if (!user.value) {
    // Save current URL for redirect after login
    sessionStorage.setItem('redirectAfterLogin', window.location.href)
    
    // Redirect to login page
    window.location.href = 'https://synnoia.vercel.app/auth/login.html'
    return false
  }
  
  return true
}

// Get current user if authenticated
export async function getCurrentUser() {
  const { user, checkAuth } = useAuth()
  await checkAuth()
  return user.value
}

// Check if user is authenticated without redirect
export async function isAuthenticated(): Promise<boolean> {
  const { user, checkAuth } = useAuth()
  await checkAuth()
  return !!user.value
}
