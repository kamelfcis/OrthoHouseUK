// Simple test version to verify rendering
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const ProductsSimple = () => {
  const { appUser, isAdmin, isBranchManager, loading: authLoading } = useAuth()
  const [testRender, setTestRender] = useState(false)

  useEffect(() => {
    console.log('=== ProductsSimple component mounted! ===')
    console.log('appUser:', appUser)
    console.log('isAdmin:', isAdmin)
    console.log('isBranchManager:', isBranchManager)
    console.log('authLoading:', authLoading)
    setTestRender(true)
    
    // Force an alert to verify component mounted
    if (typeof window !== 'undefined' && window.alert) {
      // Don't actually alert, but log it
      console.log('✅ Component is definitely mounted and should be visible!')
    }
  }, [appUser, isAdmin, isBranchManager, authLoading])

  // Force render even if appUser is null
  if (!appUser) {
    return (
      <div style={{ 
        padding: '40px', 
        background: '#fff', 
        minHeight: '500px',
        border: '5px solid red',
        fontSize: '18px',
        zIndex: 9999,
        position: 'relative'
      }}>
        <h1 style={{ color: '#000', fontSize: '2rem' }}>⚠️ NO APP USER - BUT COMPONENT IS RENDERING!</h1>
        <p>This means the component is working, but user data isn't loaded yet.</p>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '40px', 
      background: '#fff', 
      minHeight: '500px',
      border: '5px solid #00ff00',
      fontSize: '18px',
      zIndex: 9999,
      position: 'relative'
    }}>
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        background: '#00ff00', 
        padding: '20px', 
        zIndex: 10000,
        border: '5px solid #000',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        ✅ VISIBLE!
      </div>
      <h1 style={{ color: '#000', fontSize: '2rem', marginBottom: '20px' }}>
        ✅ PRODUCTS PAGE IS RENDERING!
      </h1>
      
      <div style={{ 
        padding: '20px', 
        background: '#f0f0f0', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Debug Information:</h2>
        <p><strong>Component rendered:</strong> {testRender ? 'YES ✅' : 'NO ❌'}</p>
        <p><strong>App User:</strong> {appUser ? 'Loaded ✅' : 'Not loaded ❌'}</p>
        <p><strong>User Type:</strong> {appUser?.user_type || 'N/A'}</p>
        <p><strong>Branch ID:</strong> {appUser?.branch_id || 'N/A'}</p>
        <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
        <p><strong>Is Branch Manager:</strong> {isBranchManager ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ 
        padding: '20px', 
        background: '#e8f4f8', 
        borderRadius: '8px',
        border: '2px solid #005f9a'
      }}>
        <h2>If you can see this:</h2>
        <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
          <li>✅ The route is working</li>
          <li>✅ The component is rendering</li>
          <li>✅ The layout is working</li>
          <li>Next: Check browser console (F12) for any errors</li>
          <li>Next: Check if Supabase connection works</li>
        </ul>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>Next Steps:</h3>
        <ol style={{ fontSize: '16px', lineHeight: '1.8' }}>
          <li>Open browser console (F12 → Console tab)</li>
          <li>Look for any red error messages</li>
          <li>Check Network tab for failed API requests</li>
          <li>Verify your Supabase connection is working</li>
        </ol>
      </div>
    </div>
  )
}

export default ProductsSimple

