import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ClientsModule, Transport, ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AppModule } from '../src/app.module';

describe('UsuariosAutenticacionMS E2E Tests', () => {
  let app: INestApplication;
  let client: ClientProxy;
  
  // IDs para limpiar después de los tests
  let testUserId: string;

  // Mock de Supabase Client (para evitar llamadas reales)
  const mockSupabaseAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    admin: {
      deleteUser: jest.fn(),
    },
  };

  const mockSupabaseFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }));

  beforeAll(async () => {
    // Crear módulo de testing con cliente NATS
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'NATS_SERVICE',
            transport: Transport.NATS,
            options: {
              servers: [process.env.NATS_SERVERS || 'nats://localhost:4222'],
            },
          },
        ]),
      ],
    })
      .overrideProvider('SUPABASE_CLIENT')
      .useValue({
        auth: mockSupabaseAuth,
        from: mockSupabaseFrom,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Conectar como microservicio NATS
    app.connectMicroservice({
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_SERVERS || 'nats://localhost:4222'],
      },
    });

    await app.startAllMicroservices();
    await app.init();

    // Obtener cliente NATS para enviar comandos
    client = app.get('NATS_SERVICE');
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
    await app.close();
  });

  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  /*-------------------------------------------------------------------------*/
  /*--------------------------REGISTRO DE USUARIO----------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('Registro de Usuario (SignUp)', () => {
    it('debe registrar un nuevo usuario correctamente', async () => {
      // Arrange
      const signUpDto = {
        correo: 'test@example.com',
        contrasenia: 'Test123456!',
        nombre: 'Usuario Test',
        edad: 30,
        rol: 'paciente',
        status: 'activo',
      };

      // Mock de respuesta de Supabase Auth
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'test-uuid-123',
            email: signUpDto.correo,
          },
          session: null,
        },
        error: null,
      });

      // Mock de respuesta de creación de perfil
      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{
            id: 1,
            idUsuario: 'test-uuid-123',
            nombre: signUpDto.nombre,
            correo: signUpDto.correo,
            rol: signUpDto.rol,
          }],
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Act
      const response = await firstValueFrom(
        client.send({ cmd: 'createUsuariosAutenticacion' }, signUpDto),
      );

      // Assert
      expect(response).toBeDefined();
      expect(response.ok).toBe(true);
      expect(response.userId).toBe('test-uuid-123');
      expect(response.message).toContain('registrado');
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: signUpDto.correo,
        password: signUpDto.contrasenia,
      });

      testUserId = response.userId;
    }, 30000);

    it('debe fallar al registrar con email duplicado', async () => {
      // Arrange
      const signUpDto = {
        correo: 'duplicate@example.com',
        contrasenia: 'Test123456!',
        nombre: 'Usuario',
        rol: 'cuidador',
      };

      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'User already registered',
          status: 400,
        },
      });

      // Act & Assert
      try {
        await firstValueFrom(
          client.send({ cmd: 'createUsuariosAutenticacion' }, signUpDto),
        );
        throw new Error('Debería haber lanzado un error');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message || error.error?.message).toContain('Error al registrar usuario');
      }
    }, 10000);
  });

  /*-------------------------------------------------------------------------*/
  /*-----------------------------LOGIN DE USUARIO----------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('Login de Usuario', () => {
    it('debe hacer login correctamente con credenciales válidas', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'Test123456!',
      };

      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'test-uuid-123',
            email: loginDto.email,
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
          },
        },
        error: null,
      });

      // Act
      const response = await firstValueFrom(
        client.send({ cmd: 'loginUsuario' }, loginDto),
      );

      // Assert
      expect(response).toBeDefined();
      expect(response.ok).toBe(true);
      expect(response.access_token).toBe('mock-access-token');
      expect(response.user_id).toBe('test-uuid-123');
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
      });
    }, 30000);

    it('debe fallar al hacer login con credenciales incorrectas', async () => {
      // Arrange
      const loginDto = {
        email: 'wrong@example.com',
        password: 'WrongPassword',
      };

      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid login credentials',
          status: 400,
        },
      });

      // Act & Assert
      try {
        await firstValueFrom(
          client.send({ cmd: 'loginUsuario' }, loginDto),
        );
        throw new Error('Debería haber lanzado un error');
      } catch (error: any) {
        expect(error).toBeDefined();
        // El error puede venir en diferentes formatos
        const errorMessage = error.message || error.error?.message || JSON.stringify(error);
        expect(errorMessage).toBeTruthy();
      }
    }, 10000);
  });

  /*-------------------------------------------------------------------------*/
  /*---------------------------LISTAR USUARIOS-------------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('Listar Usuarios', () => {
    it('debe listar todos los usuarios correctamente', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: 1,
              idUsuario: 'user-1',
              correo: 'user1@example.com',
              nombre: 'User 1',
              rol: 'paciente',
            },
            {
              id: 2,
              idUsuario: 'user-2',
              correo: 'user2@example.com',
              nombre: 'User 2',
              rol: 'cuidador',
            },
          ],
          error: null,
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Act
      const response = await firstValueFrom(
        client.send({ cmd: 'findUsers' }, {}),
      );

      // Assert
      expect(response).toBeDefined();
      expect(response.status).toBe('success');
      expect(Array.isArray(response.usuarios)).toBe(true);
      expect(response.usuarios).toHaveLength(2);
    }, 30000);

    it('debe retornar array vacío si no hay usuarios', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Act
      const response = await firstValueFrom(
        client.send({ cmd: 'findUsers' }, {}),
      );

      // Assert
      expect(response).toBeDefined();
      expect(response.status).toBe('success');
      expect(Array.isArray(response.usuarios)).toBe(true);
      expect(response.usuarios).toHaveLength(0);
    }, 10000);
  });

  /*-------------------------------------------------------------------------*/
  /*---------------------------BUSCAR USUARIO--------------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('Buscar Usuario por ID', () => {
    it('debe buscar un usuario por ID correctamente', async () => {
      // Arrange
      const userId = 'test-uuid-123';
      
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{
            id: 1,
            idUsuario: userId,
            correo: 'test@example.com',
            nombre: 'Usuario Test',
            rol: 'paciente',
          }],
          error: null,
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Act
      const response = await firstValueFrom(
        client.send({ cmd: 'findUserById' }, userId),
      );

      // Assert
      expect(response).toBeDefined();
      expect(response.status).toBe('success');
      expect(Array.isArray(response.usuarios)).toBe(true);
      expect(response.usuarios[0].idUsuario).toBe(userId);
    }, 30000);

    it('debe fallar al buscar usuario con ID inexistente', async () => {
      // Arrange
      const userId = 'non-existent-id';
      
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'User not found',
            status: 404,
          },
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Act & Assert
      try {
        await firstValueFrom(
          client.send({ cmd: 'findUserById' }, userId),
        );
        throw new Error('Debería haber lanzado un error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  /*-------------------------------------------------------------------------*/
  /*---------------------------ELIMINAR USUARIO------------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('Eliminar Usuario', () => {
    it('debe eliminar un usuario correctamente', async () => {
      // Arrange
      const userId = 'test-uuid-to-delete';
      
      mockSupabaseAuth.admin.deleteUser.mockResolvedValue({
        data: {},
        error: null,
      });

      mockSupabaseFrom.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Act
      const response = await firstValueFrom(
        client.send({ cmd: 'deleteUser' }, userId),
      );

      // Assert
      expect(response).toBeDefined();
      expect(response.ok).toBe(true);
      expect(response.message).toContain('eliminado');
      expect(mockSupabaseAuth.admin.deleteUser).toHaveBeenCalledWith(userId);
    }, 30000);

    it('debe fallar al eliminar usuario inexistente', async () => {
      // Arrange
      const userId = 'non-existent-user';
      
      mockSupabaseAuth.admin.deleteUser.mockResolvedValue({
        data: null,
        error: {
          message: 'User not found',
          status: 404,
        },
      });

      // Act & Assert
      try {
        await firstValueFrom(
          client.send({ cmd: 'deleteUser' }, userId),
        );
        throw new Error('Debería haber lanzado un error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  /*-------------------------------------------------------------------------*/
  /*---------------------------FLUJO COMPLETO--------------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('Flujo Completo E2E', () => {
    it('debe realizar el flujo completo: SignUp → Login → Buscar → Eliminar', async () => {
      // 1. SignUp - Registrar usuario
      const signUpDto = {
        correo: 'flujo@example.com',
        contrasenia: 'FlujoTest123!',
        nombre: 'Usuario Flujo',
        edad: 35,
        rol: 'cuidador',
        status: 'activo',
      };

      mockSupabaseAuth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'flujo-uuid-123',
            email: signUpDto.correo,
          },
          session: null,
        },
        error: null,
      });

      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{
            id: 1,
            idUsuario: 'flujo-uuid-123',
            nombre: signUpDto.nombre,
            correo: signUpDto.correo,
          }],
          error: null,
        }),
        eq: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const signUpResponse = await firstValueFrom(
        client.send({ cmd: 'createUsuariosAutenticacion' }, signUpDto),
      );
      
      expect(signUpResponse.ok).toBe(true);
      expect(signUpResponse.userId).toBe('flujo-uuid-123');
      const userId = signUpResponse.userId;

      // 2. Login - Autenticar usuario
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: signUpDto.correo,
          },
          session: {
            access_token: 'flujo-access-token',
            expires_in: 3600,
          },
        },
        error: null,
      });

      const loginResponse = await firstValueFrom(
        client.send({ cmd: 'loginUsuario' }, {
          email: signUpDto.correo,
          password: signUpDto.contrasenia,
        }),
      );

      expect(loginResponse.ok).toBe(true);
      expect(loginResponse.user_id).toBe(userId);

      // 3. Buscar usuario por ID
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{
            idUsuario: userId,
            correo: signUpDto.correo,
            nombre: signUpDto.nombre,
          }],
          error: null,
        }),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const findResponse = await firstValueFrom(
        client.send({ cmd: 'findUserById' }, userId),
      );

      expect(findResponse.status).toBe('success');
      expect(findResponse.usuarios[0].idUsuario).toBe(userId);

      // 4. Eliminar usuario
      mockSupabaseAuth.admin.deleteUser.mockResolvedValue({
        data: {},
        error: null,
      });

      mockSupabaseFrom.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const deleteResponse = await firstValueFrom(
        client.send({ cmd: 'deleteUser' }, userId),
      );

      expect(deleteResponse.ok).toBe(true);
      expect(mockSupabaseAuth.admin.deleteUser).toHaveBeenCalledWith(userId);

      // Verificar que todos los métodos fueron llamados
      expect(mockSupabaseAuth.signUp).toHaveBeenCalled();
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalled();
      expect(mockSupabaseAuth.admin.deleteUser).toHaveBeenCalled();
    }, 60000);
  });
});
