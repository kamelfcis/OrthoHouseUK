// Absolutely minimal test - no dependencies
const ProductsMinimal = () => {
  console.log('ProductsMinimal RENDERING NOW!')
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'red',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      color: 'white',
      fontWeight: 'bold'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '72px', marginBottom: '20px' }}>🚨</div>
        <div>IF YOU SEE THIS, THE COMPONENT WORKS!</div>
        <div style={{ fontSize: '24px', marginTop: '20px' }}>
          The route is working, component is rendering
        </div>
      </div>
    </div>
  )
}

export default ProductsMinimal

