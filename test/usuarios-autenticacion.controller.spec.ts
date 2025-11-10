import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosAutenticacionController } from '../src/usuarios-autenticacion/usuarios-autenticacion.controller';
import { UsuariosAutenticacionService } from '../src/usuarios-autenticacion/usuarios-autenticacion.service';

describe('UsuariosAutenticacionController', () => {
  let controller: UsuariosAutenticacionController;
  let service: UsuariosAutenticacionService;

  // Mock del servicio
  const mockUsuariosAutenticacionService = {
    signUp: jest.fn(),
    login: jest.fn(),
    findAll: jest.fn(),
    findUserById: jest.fn(),
    deleteUser: jest.fn(),
    asignMedicToPatient: jest.fn(),
    asignCaregiverToPatient: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosAutenticacionController],
      providers: [
        {
          provide: UsuariosAutenticacionService,
          useValue: mockUsuariosAutenticacionService,
        },
      ],
    }).compile();

    controller = module.get<UsuariosAutenticacionController>(
      UsuariosAutenticacionController,
    );
    service = module.get<UsuariosAutenticacionService>(
      UsuariosAutenticacionService,
    );
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  /*-------------------------------------------------------------------------*/
  /*---------------------------CREATE USUARIO--------------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('crear', () => {
    it('debe llamar a signUp del servicio con los datos correctos', async () => {
      // Arrange
      const createUserDto = {
        nombre: 'Juan Pérez',
        edad: 30,
        status: 'activo',
        correo: 'juan@ejemplo.com',
        contrasenia: 'Password123!',
        rol: 'paciente',
        idMedico: undefined,
      };

      const expectedResult = {
        ok: true,
        message: 'Usuario registrado y perfil creado correctamente',
        userId: 'user-123-abc',
      };

      mockUsuariosAutenticacionService.signUp.mockResolvedValue(
        expectedResult,
      );

      // Act
      const resultado = await controller.crear(createUserDto as any);

      // Assert
      expect(service.signUp).toHaveBeenCalledWith(createUserDto);
      expect(service.signUp).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expectedResult);
    });

    it('debe manejar errores del servicio', async () => {
      // Arrange
      const createUserDto = {
        nombre: 'Juan Pérez',
        correo: 'juan@ejemplo.com',
        contrasenia: 'Password123!',
      };

      mockUsuariosAutenticacionService.signUp.mockRejectedValue(
        new Error('Error al crear usuario'),
      );

      // Act & Assert
      await expect(controller.crear(createUserDto as any)).rejects.toThrow(
        'Error al crear usuario',
      );
      expect(service.signUp).toHaveBeenCalledWith(createUserDto);
    });
  });

  /*-------------------------------------------------------------------------*/
  /*----------------------------------LOGIN----------------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('login', () => {
    it('debe llamar a login del servicio con las credenciales correctas', async () => {
      // Arrange
      const loginDto = {
        email: 'juan@ejemplo.com',
        password: 'Password123!',
      };

      const expectedResult = {
        ok: true,
        access_token: 'token-abc-123',
        expires_in: 3600,
        user_id: 'user-123-abc',
      };

      mockUsuariosAutenticacionService.login.mockResolvedValue(expectedResult);

      // Act
      const resultado = await controller.login(loginDto);

      // Assert
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expectedResult);
    });

    it('debe manejar errores de autenticación', async () => {
      // Arrange
      const loginDto = {
        email: 'juan@ejemplo.com',
        password: 'wrongpassword',
      };

      mockUsuariosAutenticacionService.login.mockRejectedValue(
        new Error('Credenciales inválidas'),
      );

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  /*-------------------------------------------------------------------------*/
  /*-------------------------------BUSCAR USUARIOS---------------------------*/
  /*-------------------------------------------------------------------------*/

  describe('listar', () => {
    it('debe llamar a findAll del servicio', async () => {
      // Arrange
      const expectedResult = {
        status: 'success',
        message: 'Usuarios encontrados correctamente',
        usuarios: [
          { id: '1', nombre: 'Juan', correo: 'juan@ejemplo.com' },
          { id: '2', nombre: 'María', correo: 'maria@ejemplo.com' },
        ],
      };

      mockUsuariosAutenticacionService.findAll.mockResolvedValue(
        expectedResult,
      );

      // Act
      const resultado = await controller.listar();

      // Assert
      expect(service.findAll).toHaveBeenCalled();
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expectedResult);
    });

    it('debe manejar errores al buscar usuarios', async () => {
      // Arrange
      mockUsuariosAutenticacionService.findAll.mockRejectedValue(
        new Error('Error de base de datos'),
      );

      // Act & Assert
      await expect(controller.listar()).rejects.toThrow(
        'Error de base de datos',
      );
    });
  });

  describe('buscar', () => {
    it('debe llamar a findUserById del servicio con el ID correcto', async () => {
      // Arrange
      const userId = 'user-123-abc';
      const expectedResult = {
        status: 'success',
        message: 'Usuario encontrados correctamente',
        usuarios: [
          {
            idUsuario: userId,
            nombre: 'Juan Pérez',
            correo: 'juan@ejemplo.com',
          },
        ],
      };

      mockUsuariosAutenticacionService.findUserById.mockResolvedValue(
        expectedResult,
      );

      // Act
      const resultado = await controller.buscar(userId);

      // Assert
      expect(service.findUserById).toHaveBeenCalledWith(userId);
      expect(service.findUserById).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expectedResult);
    });

    it('debe manejar error cuando el usuario no existe', async () => {
      // Arrange
      const userId = 'user-inexistente';

      mockUsuariosAutenticacionService.findUserById.mockRejectedValue(
        new Error('Usuario no encontrado'),
      );

      // Act & Assert
      await expect(controller.buscar(userId)).rejects.toThrow(
        'Usuario no encontrado',
      );
      expect(service.findUserById).toHaveBeenCalledWith(userId);
    });
  });

  /*-------------------------------------------------------------------------*/
  /*-------------------------------ELIMINAR USUARIO--------------------------*/
  /*-------------------------------------------------------------------------*/

  /* describe('borrar', () => {
    it('debe llamar a deleteUser del servicio con el ID correcto', async () => {
      // Arrange
      const userId = 'user-123-abc';

      mockUsuariosAutenticacionService.deleteUser.mockResolvedValue(undefined);

      // Act
      const resultado = await controller.borrar(userId);

      // Assert
      expect(service.deleteUser).toHaveBeenCalledWith(userId);
      expect(service.deleteUser).toHaveBeenCalledTimes(1);
      expect(resultado).toBeUndefined();
    });

    it('debe manejar error al eliminar usuario', async () => {
      // Arrange
      const userId = 'user-123-abc';

      mockUsuariosAutenticacionService.deleteUser.mockRejectedValue(
        new Error('Error al eliminar usuario'),
      );

      // Act & Assert
      await expect(controller.borrar(userId)).rejects.toThrow(
        'Error al eliminar usuario',
      );
      expect(service.deleteUser).toHaveBeenCalledWith(userId);
    });
  }); */

  /*-------------------------------------------------------------------------*/
  /*----------------------------ASIGNAR MÉDICO A PACIENTE--------------------*/
  /*-------------------------------------------------------------------------*/

  describe('asignarMedpaciente', () => {
    it('debe llamar a asignMedicToPatient del servicio con los datos correctos', async () => {
      // Arrange
      const asignarDto = {
        idMedico: 'medico-123',
        idPaciente: 'paciente-456',
      };

      const expectedResult = {
        ok: true,
        message: 'Médico asignado correctamente',
      };

      mockUsuariosAutenticacionService.asignMedicToPatient.mockResolvedValue(
        expectedResult,
      );

      // Act
      const resultado = await controller.asignarMedpaciente(asignarDto);

      // Assert
      expect(service.asignMedicToPatient).toHaveBeenCalledWith(asignarDto);
      expect(service.asignMedicToPatient).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expectedResult);
    });

    it('debe manejar error al asignar médico', async () => {
      // Arrange
      const asignarDto = {
        idMedico: 'medico-123',
        idPaciente: 'paciente-456',
      };

      mockUsuariosAutenticacionService.asignMedicToPatient.mockRejectedValue(
        new Error('Error al asignar médico'),
      );

      // Act & Assert
      await expect(controller.asignarMedpaciente(asignarDto)).rejects.toThrow(
        'Error al asignar médico',
      );
      expect(service.asignMedicToPatient).toHaveBeenCalledWith(asignarDto);
    });
  });

  /*-------------------------------------------------------------------------*/
  /*---------------------------ASIGNAR CUIDADOR A PACIENTE-------------------*/
  /*-------------------------------------------------------------------------*/

  describe('asignarCuidadorPaciente', () => {
    it('debe llamar a asignCaregiverToPatient del servicio con los datos correctos', async () => {
      // Arrange
      const asignarDto = {
        idCuidador: 'cuidador-789',
        idPaciente: 'paciente-456',
      };

      const expectedResult = {
        ok: true,
        message: 'Cuidador asignado correctamente',
      };

      mockUsuariosAutenticacionService.asignCaregiverToPatient.mockResolvedValue(
        expectedResult,
      );

      // Act
      const resultado = await controller.asignarCuidadorPaciente(asignarDto);

      // Assert
      expect(service.asignCaregiverToPatient).toHaveBeenCalledWith(asignarDto);
      expect(service.asignCaregiverToPatient).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expectedResult);
    });

    it('debe manejar error al asignar cuidador', async () => {
      // Arrange
      const asignarDto = {
        idCuidador: 'cuidador-789',
        idPaciente: 'paciente-456',
      };

      mockUsuariosAutenticacionService.asignCaregiverToPatient.mockRejectedValue(
        new Error('Error al asignar cuidador'),
      );

      // Act & Assert
      await expect(
        controller.asignarCuidadorPaciente(asignarDto),
      ).rejects.toThrow('Error al asignar cuidador');
      expect(service.asignCaregiverToPatient).toHaveBeenCalledWith(asignarDto);
    });
  });
});
