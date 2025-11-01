import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosAutenticacionService } from '../src/usuarios-autenticacion/usuarios-autenticacion.service';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';

describe('UsuariosAutenticacionService', () => {
  let service: UsuariosAutenticacionService;

  // Mock de Supabase Client
  const mockSupabaseClient = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      admin: {
        deleteUser: jest.fn(),
      },
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosAutenticacionService,
        {
          provide: 'SUPABASE_CLIENT',
          useValue: mockSupabaseClient,
        },
      ],
    }).compile();

    service = module.get<UsuariosAutenticacionService>(
      UsuariosAutenticacionService,
    );
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  /*-------------------------------------------------------------------------*/
  /*--------------------------------REGISTRO---------------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('signUp', () => {
    it('debe registrar un usuario correctamente', async () => {
      // Arrange
      const createUserDto = {
        nombre: 'Juan Pérez',
        edad: 30,
        status: 'activo',
        correo: 'juan@ejemplo.com',
        contrasenia: 'Password123!',
        rol: 'paciente',
      };

      const mockAuthResponse = {
        data: {
          user: {
            id: 'user-123-abc',
            email: createUserDto.correo,
          },
          session: null,
        },
        error: null,
      };

      const mockPerfilResponse = {
        data: [
          {
            idUsuario: 'user-123-abc',
            nombre: createUserDto.nombre,
            correo: createUserDto.correo,
          },
        ],
        error: null,
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue(mockAuthResponse);
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockPerfilResponse),
        }),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockSupabaseClient.from.mockReturnValue(mockFrom);

      // Act
      const resultado = await service.signUp(createUserDto);

      // Assert
      expect(resultado).toEqual({
        ok: true,
        message: 'Usuario registrado y perfil creado correctamente',
        userId: 'user-123-abc',
      });
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: createUserDto.correo,
        password: createUserDto.contrasenia,
      });
    });

    it('debe lanzar RpcException cuando falla el registro en auth', async () => {
      // Arrange
      const createUserDto = {
        nombre: 'Juan Pérez',
        correo: 'juan@ejemplo.com',
        contrasenia: 'Password123!',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email ya registrado' },
      });

      // Act & Assert
      await expect(service.signUp(createUserDto as any)).rejects.toThrow(
        RpcException,
      );
      
      try {
        await service.signUp(createUserDto as any);
      } catch (error) {
        expect(error).toBeInstanceOf(RpcException);
        expect(error.error.code).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('debe lanzar RpcException cuando no se obtiene el ID del usuario', async () => {
      // Arrange
      const createUserDto = {
        nombre: 'Juan Pérez',
        correo: 'juan@ejemplo.com',
        contrasenia: 'Password123!',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act & Assert
      await expect(service.signUp(createUserDto as any)).rejects.toThrow(
        RpcException,
      );
    });
  });

  /*-------------------------------------------------------------------------*/
  /*----------------------------------LOGIN----------------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('login', () => {
    it('debe iniciar sesión correctamente', async () => {
      // Arrange
      const loginDto = {
        email: 'juan@ejemplo.com',
        password: 'Password123!',
      };

      const mockLoginResponse = {
        data: {
          user: {
            id: 'user-123-abc',
            email: loginDto.email,
          },
          session: {
            access_token: 'token-abc-123',
            expires_in: 3600,
          },
        },
        error: null,
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        mockLoginResponse,
      );

      // Act
      const resultado = await service.login(loginDto);

      // Assert
      expect(resultado).toEqual({
        ok: true,
        access_token: 'token-abc-123',
        expires_in: 3600,
        user_id: 'user-123-abc',
      });
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
      });
    });

    it('debe manejar error de credenciales inválidas', async () => {
      // Arrange
      const loginDto = {
        email: 'juan@ejemplo.com',
        password: 'wrongpassword',
      };

      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Credenciales inválidas'),
      );

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(RpcException);
    });
  });

  /*-------------------------------------------------------------------------*/
  /*-------------------------------BUSCAR USUARIOS---------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('findAll', () => {
    it('debe retornar todos los usuarios', async () => {
      // Arrange
      const mockUsuarios = [
        { id: '1', nombre: 'Juan', correo: 'juan@ejemplo.com' },
        { id: '2', nombre: 'María', correo: 'maria@ejemplo.com' },
      ];

      const mockFrom = {
        select: jest.fn().mockResolvedValue({
          data: mockUsuarios,
          error: null,
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockSupabaseClient.from.mockReturnValue(mockFrom);

      // Act
      const resultado = await service.findAll();

      // Assert
      expect(resultado).toEqual({
        status: 'success',
        message: 'Usuarios encontrados correctamente',
        usuarios: mockUsuarios,
      });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('USUARIO');
    });

    it('debe lanzar RpcException cuando falla la consulta', async () => {
      // Arrange
      const mockFrom = {
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error de base de datos' },
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockSupabaseClient.from.mockReturnValue(mockFrom);

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow(RpcException);
    });
  });

  describe('findUserById', () => {
    it('debe retornar un usuario por ID', async () => {
      // Arrange
      const userId = 'user-123-abc';
      const mockUsuario = [
        {
          idUsuario: userId,
          nombre: 'Juan Pérez',
          correo: 'juan@ejemplo.com',
        },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockUsuario,
            error: null,
          }),
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockSupabaseClient.from.mockReturnValue(mockFrom);

      // Act
      const resultado = await service.findUserById(userId);

      // Assert
      expect(resultado).toEqual({
        status: 'success',
        message: 'Usuario encontrados correctamente',
        usuarios: mockUsuario,
      });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('PERFIL');
    });

    it('debe lanzar RpcException cuando no encuentra el usuario', async () => {
      // Arrange
      const userId = 'user-inexistente';

      const mockFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Usuario no encontrado' },
          }),
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockSupabaseClient.from.mockReturnValue(mockFrom);

      // Act & Assert
      await expect(service.findUserById(userId)).rejects.toThrow(RpcException);
    });
  });

  /*-------------------------------------------------------------------------*/
  /*-------------------------------ELIMINAR USUARIO--------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('deleteUser', () => {
    it('debe eliminar un usuario correctamente', async () => {
      // Arrange
      const userId = 'user-123-abc';

      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      const resultado = await service.deleteUser(userId);

      // Assert
      expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        userId,
      );
      // Verificar que no lanza error
      expect(resultado).toBeDefined();
    });

    it('debe lanzar RpcException cuando falla la eliminación', async () => {
      // Arrange
      const userId = 'user-123-abc';

      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
        data: null,
        error: { message: 'Error al eliminar usuario' },
      });

      // Act & Assert
      await expect(service.deleteUser(userId)).rejects.toThrow(RpcException);
    });
  });

  /*-------------------------------------------------------------------------*/
  /*-------------------------------CREAR PERFIL------------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('crearPerfil', () => {
    it('debe crear un perfil correctamente', async () => {
      // Arrange
      const createUserDto = {
        nombre: 'Juan Pérez',
        edad: 30,
        status: 'activo',
        correo: 'juan@ejemplo.com',
        contrasenia: 'Password123!',
        rol: 'paciente',
      };
      const userId = 'user-123-abc';

      const mockPerfilResponse = {
        data: [
          {
            idUsuario: userId,
            nombre: createUserDto.nombre,
            edad: createUserDto.edad,
            status: createUserDto.status,
            correo: createUserDto.correo,
            rol: createUserDto.rol,
          },
        ],
        error: null,
      };

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockPerfilResponse),
        }),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockSupabaseClient.from.mockReturnValue(mockFrom);

      // Act
      const resultado = await service.crearPerfil(createUserDto, userId);

      // Assert
      expect(resultado).toEqual({
        ok: true,
        message: 'Perfil creado correctamente',
        perfil: mockPerfilResponse.data[0],
      });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('PERFIL');
    });

    it('debe lanzar RpcException cuando falla la creación del perfil', async () => {
      // Arrange
      const createUserDto = {
        nombre: 'Juan Pérez',
        correo: 'juan@ejemplo.com',
        contrasenia: 'Password123!',
      };
      const userId = 'user-123-abc';

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Error al insertar perfil' },
          }),
        }),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockSupabaseClient.from.mockReturnValue(mockFrom);

      // Act & Assert
      await expect(
        service.crearPerfil(createUserDto as any, userId),
      ).rejects.toThrow(RpcException);
    });
  });
});
