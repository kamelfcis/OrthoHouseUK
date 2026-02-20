// Debug component to test if Products page is loading
import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const ProductsDebug = () => {
  const { appUser, loading: authLoading } = useAuth()

  useEffect(() => {
    console.log('ProductsDebug mounted')
    console.log('appUser:', appUser)
    console.log('authLoading:', authLoading)
  }, [appUser, authLoading])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Products Debug</h1>
      <p>App User: {appUser ? JSON.stringify(appUser, null, 2) : 'Not loaded'}</p>
      <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
    </div>
  )
}

export default ProductsDebug

