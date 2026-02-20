// Temporary test component to verify rendering
import { useAuth } from '../../contexts/AuthContext'

const ProductsTest = () => {
  const { appUser, loading: authLoading } = useAuth()

  return (
    <div style={{ padding: '30px', background: '#fff', minHeight: '400px' }}>
      <h1 style={{ color: '#000', marginBottom: '5px' }}>Products Management - TEST</h1>
      <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <p><strong>App User:</strong> {appUser ? 'Loaded' : 'Not loaded'}</p>
        <p><strong>Auth Loading:</strong> {authLoading ? 'Yes' : 'No'}</p>
        <p><strong>User Type:</strong> {appUser?.user_type || 'N/A'}</p>
        <p><strong>Branch ID:</strong> {appUser?.branch_id || 'N/A'}</p>
      </div>
      <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #005f9a', borderRadius: '8px' }}>
        <h2>If you can see this, the component is rendering!</h2>
        <p>The Products page should be working. If you still see blank, check:</p>
        <ul>
          <li>Browser console for errors (F12)</li>
          <li>Network tab for failed requests</li>
          <li>That your database tables exist</li>
        </ul>
      </div>
    </div>
  )
}

export default ProductsTest

