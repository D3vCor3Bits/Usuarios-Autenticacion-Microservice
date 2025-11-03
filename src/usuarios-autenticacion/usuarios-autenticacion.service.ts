import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateUsuariosAutenticacionDto } from './dto/create-usuarios-autenticacion.dto';
import { loginUsuarioDto } from './dto/login-usuario.dto';
import { asignarMedpacienteDto } from './dto/asignar-medpaciente.dto';
import { asignarCuidadorPacienteDto } from './dto/asignar-pacientecuidador.dto';
import { crearInvitacionDto } from './dto/crear-invitacion.dto';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UsuariosAutenticacionService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient, 
    @Inject('ALERTAS_SERVICE') private readonly clientProxy: ClientProxy, 

  ) { }

  /**
   * Realiza  el registro en auth.user, tabla de Supabase para manejar autenticación.
   * Luego crea el perfil del usuario en la tabla PERFIL.
   *
   * @param dto Datos necesarios para el registro del usuario.
   * @returns Un objeto con el estado y mensaje del registro.
   * Al ocurrir un error, se envía la excepción a través de RcpException.
   */

  async signUp(dto: CreateUsuariosAutenticacionDto) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: dto.correo,
        password: dto.contrasenia,
      });

      if (error) {
        throw new RpcException({
          code: HttpStatus.BAD_REQUEST,
          message: `Error al registrar usuario: ${error.message}`,
        });
      }

      const userId = data?.user?.id;
      if (!userId) {
        throw new RpcException({
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'No se obtuvo el ID del usuario al registrarlo',
        });
      }

      await this.crearPerfil(dto, userId);
      return {
        ok: true,
        message: 'Usuario registrado y perfil creado correctamente',
        userId,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al registrar el usuario',
      });
    }
  }

  /*

  Función auxiliar para crear el perfil del usuario en la tabla PERFIL

 */

  async crearPerfil(dto: CreateUsuariosAutenticacionDto, idUsuario: string) {
    try {
      const { nombre, edad, status, correo, rol } = dto;

      const { data, error } = await this.supabase
        .from('PERFIL')
        .insert([{ idUsuario, nombre, edad, status, correo, rol }])
        .select();

      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al crear perfil: ${error.message}`,
        });
      }

      return {
        ok: true,
        message: 'Perfil creado correctamente',
        perfil: data[0],
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al crear el perfil',
      });
    }
  }

  /* 
    Función para iniciar sesión de usuario, usando Supabase Auth
  */
  async login(dto: loginUsuarioDto) {
    try {
      const { email, password } = dto;
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });
      return {
        ok: true,
        access_token: data.session?.access_token,
        expires_in: data.session?.expires_in,
        user_id: data.user?.id,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al crear el perfil',
      });
    }
  }

  /**
   * Retorna todos los usuarios registrados.
   */
  async findAll() {
    try {
      const { data, error } = await this.supabase.from('USUARIO').select('*');

      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al buscar usuarios: ${error.message}`,
        });
      }

      return {
        status: 'success',
        message: 'Usuarios encontrados correctamente',
        usuarios: data,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al consultar los usuarios',
      });
    }
  }

  /* 
  
  Encontrar perfil de usuario por ID.

  */
  async findUserById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('PERFIL')
        .select('*')
        .eq('idUsuario', id);

      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al buscar usuario: ${error.message}`,
        });
      }

      return {
        status: 'success',
        message: 'Usuario encontrados correctamente',
        usuarios: data,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al consultar los usuarios',
      });
    }
  }
  /*

  Borrar un usuario con funciones de administrador.

  */
   async deleteUser(id: string) {
      try {
        // Elimina el usuario de Supabase Auth - REVISAR RLS
        const { error } = await this.supabase.auth.admin.deleteUser(id);

      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al eliminar usuario: ${error.message}`,
        });
      }
      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al eliminar usuario: ${error.message}`,
        });
      }

        await this.supabase.from('PERFIL').delete().eq('idUsuario', id);

        return {
          ok: true,
          message: 'Usuario eliminado correctamente.',
        };
      } catch (error) {
        if (error instanceof RpcException) throw error;

        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Error interno al eliminar usuario',
        });
      }
    }
  /**
 * Crea una invitación y notifica al microservicio correspondiente.
 *
 * Proceso:
 * 1. Inserta una nueva invitación en la tabla `invitaciones` con los datos proporcionados.
 * 2. Genera un token en formato Base64 a partir del `id` de la invitación creada.
 * 3. Envía un evento al microservicio correspondiente con los datos requeridos.
 *
 * @param dto - Objeto con los datos de la invitación: nombreCompleto, correo y rol.
 * @returns Un objeto con confirmación y los datos de la invitación creada.
 * @throws RpcException - Si ocurre un error en la inserción o durante la emisión del evento.
 */
  async crearInvitacion(dto: crearInvitacionDto) {
    try {
      const { nombreCompleto, correo, rol } = dto;

      // Inserta el registro en la tabla de invitaciones
      const { data, error } = await this.supabase
        .from('invitaciones')
        .insert([{ correo, nombreCompleto }])
        .select();

      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al crear invitación: ${error.message}`,
        });
      }

      const invitacion = data[0];

      // Genera un token en Base64 a partir del ID de la invitación
      const token = Buffer.from(String(invitacion.id)).toString('base64');

      // Emite el evento al otro microservicio
      await lastValueFrom(
        this.clientProxy.emit('invitacion_creada', {
          correo,
          nombreCompleto,
          token,
          rol,
        }),
      );

      return {
        ok: true,
        message: 'Invitación creada correctamente',
        invitacion,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al crear la invitación',
      });
    }
  }

  /* 
  
  
  Asignar un médico a un paciente.
  */
  async asignMedicToPatient(dto: asignarMedpacienteDto) {
    const { idMedico, idPaciente } = dto;
    const { data: rolMedData, error: errorMed } = await this.supabase
      .from('PERFIL')
      .select('rol')
      .eq('idUsuario', idMedico)
      .single();

    const { data: rolPacData, error: errorPac } = await this.supabase
      .from('PERFIL')
      .select('rol')
      .eq('idUsuario', idPaciente)
      .single();

    if (errorMed || !rolMedData) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `No se encontró el perfil del médico con id ${idMedico}.`,
      });
    }

    if (errorPac || !rolPacData) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `No se encontró el perfil del paciente con id ${idPaciente}.`,
      });
    }

    if (rolMedData.rol !== 'medico') {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `El usuario con id ${idMedico} no tiene rol de médico.`,
      });
    }

    if (rolPacData.rol !== 'paciente') {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `El usuario con id ${idPaciente} no tiene rol de paciente.`,
      });
    }

    try {
      const { data, error } = await this.supabase
        .from('PACIENTE_MEDICO')
        .insert([{ idMedico, idPaciente }])
        .select();
      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al asignar el paciente al médico: ${error.message}`,
        });
      }

      return {
        ok: true,
        message: 'Paciente signado al médico correctamente',
        asignacion: data[0],
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al crear el perfil',
      });
    }
  }

  /* 
  
  Asignar un cuidador a un paciente.
  
  */
  async asignCaregiverToPatient(dto: asignarCuidadorPacienteDto) {
    const { idCuidador, idPaciente } = dto;

    // Verificación de roles
    const { data: rolCuidData, error: errorCuid } = await this.supabase
      .from('PERFIL')
      .select('rol')
      .eq('idUsuario', idCuidador)
      .single();

    const { data: rolPacData, error: errorPac } = await this.supabase
      .from('PERFIL')
      .select('rol')
      .eq('idUsuario', idPaciente)
      .single();

    if (errorCuid || !rolCuidData) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `No se encontró el perfil del cuidador con id ${idCuidador}.`,
      });
    }

    if (errorPac || !rolPacData) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `No se encontró el perfil del paciente con id ${idPaciente}.`,
      });
    }

    if (rolCuidData.rol !== 'medico') {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `El usuario con id ${idCuidador} no tiene rol de médico.`,
      });
    }

    if (rolPacData.rol !== 'paciente') {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `El usuario con id ${idPaciente} no tiene rol de paciente.`,
      });
    }

    // Validación que el paciente no tenga más de 3 cuidadores
    const { count, error: countError } = await this.supabase
      .from('CUIDADOR_PACIENTE')
      .select('*', { count: 'exact', head: true })
      .eq('idPaciente', idPaciente);

    if (countError) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error al contar los cuidadores del paciente: ${countError.message}`,
      });
    }

    if (count != null && count >= 3) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `El paciente con id ${idPaciente} ya tiene 3 cuidadores asignados.`,
      });
    }

    // Inserción de la relación cuidador-paciente
    try {
      const { data, error } = await this.supabase
        .from('CUIDADOR_PACIENTE')
        .insert([{ idCuidador, idPaciente }])
        .select();

      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al asignar el paciente al cuidador: ${error.message}`,
        });
      }

      return {
        ok: true,
        message: 'Paciente asignado al cuidador correctamente.',
        asignacion: data[0],
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al crear la asignación.',
      });
    }
  }
}
