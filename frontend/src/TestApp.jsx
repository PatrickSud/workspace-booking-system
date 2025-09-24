import React from 'react'

function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 Sistema de Reserva de Espaços</h1>
      <p>✅ Frontend funcionando!</p>
      <p>✅ Backend rodando em: http://localhost:3001</p>
      <p>✅ Banco de dados SQLite configurado</p>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>📋 Credenciais de Teste:</h3>
        <p><strong>Admin:</strong> admin@workspace.com / admin123</p>
        <p><strong>Usuário:</strong> ana.silva@empresa.com / user123</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/login'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Ir para Login
        </button>
      </div>
    </div>
  )
}

export default TestApp
