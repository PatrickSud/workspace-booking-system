// Mock service para demonstração no GitHub Pages
// Este arquivo substitui o authService quando o backend não está disponível

const MOCK_USERS = [
  {
    id: 1,
    email: 'admin@workspace.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin',
    department: 'TI',
    phone: '(11) 99999-9999'
  },
  {
    id: 2,
    email: 'ana.silva@empresa.com',
    password: 'user123',
    name: 'Ana Silva',
    role: 'user',
    department: 'Vendas',
    phone: '(11) 88888-8888'
  }
]

const MOCK_TOKEN = 'mock-jwt-token-' + Date.now()

export const mockAuthService = {
  // Login user
  login: async (email, password) => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000))

    const user = MOCK_USERS.find(
      u => u.email === email && u.password === password
    )

    if (!user) {
      throw new Error('Credenciais inválidas')
    }

    // Simular resposta do servidor
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        phone: user.phone
      },
      token: MOCK_TOKEN
    }
  },

  // Register user
  register: async userData => {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newUser = {
      id: MOCK_USERS.length + 1,
      ...userData,
      role: 'user'
    }

    MOCK_USERS.push(newUser)

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        phone: newUser.phone
      },
      token: MOCK_TOKEN
    }
  },

  // Get user profile
  getProfile: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))

    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Token não encontrado')
    }

    // Simular busca do usuário pelo token
    const user = MOCK_USERS[0] // Usar primeiro usuário como exemplo

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      phone: user.phone
    }
  },

  // Update user profile
  updateProfile: async profileData => {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const user = MOCK_USERS[0]
    Object.assign(user, profileData)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      phone: user.phone
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const user = MOCK_USERS[0]
    if (user.password !== currentPassword) {
      throw new Error('Senha atual incorreta')
    }

    user.password = newPassword

    return { message: 'Senha alterada com sucesso' }
  },

  // Refresh token
  refreshToken: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      token: MOCK_TOKEN + '-refreshed'
    }
  },

  // Logout
  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))

    return { message: 'Logout realizado com sucesso' }
  }
}
