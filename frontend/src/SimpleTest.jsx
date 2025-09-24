import React from 'react'

const SimpleTest = () => {
  console.log('🧪 SimpleTest component rendered')
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Teste Simples</h1>
      <p>Se você está vendo isso, o React está funcionando!</p>
      <button onClick={() => console.log('Botão clicado!')}>
        Testar Console
      </button>
    </div>
  )
}

export default SimpleTest
