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
import * as crypto from 'crypto';
import { withUserToken } from 'src/common/helpers/supabase-token.helper';
import { actualizarContraseñaDto } from './dto/actualizar-contraseña.dto';
@Injectable()
export class UsuariosAutenticacionService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
    @Inject('ALERTAS_SERVICE') private readonly clientProxy: ClientProxy,
  ) {}

  // === Encriptar ===
  private encrypt(text: string): string {
    const key = crypto
      .createHash('sha256')
      .update(process.env.CRYPTO_KEY || 'default-key')
      .digest();
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private decrypt(encryptedText: string): string {
    const key = crypto
      .createHash('sha256')
      .update(process.env.CRYPTO_KEY || 'default-key')
      .digest();
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
    const base64 = encryptedText.replace(/-/g, '+').replace(/_/g, '/');
    let decrypted = decipher.update(base64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

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
      await this.deleteInvitacion(dto.correo);

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

  async deleteInvitacion(correo: string) {
    try {
      const { error } = await this.supabase
        .from('invitaciones')
        .delete()
        .eq('correo', correo);
      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al eliminar invitación: ${error.message}`,
        });
      }

      return {
        ok: true,
        message: 'Invitación eliminada correctamente',
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al eliminar la invitación',
      });
    }
  }
  /*

  Función auxiliar para crear el perfil del usuario en la tabla PERFIL

 */

  async crearPerfil(dto: CreateUsuariosAutenticacionDto, idUsuario: string) {
    try {
      const { nombre, fechaNacimiento, status, correo, rol, idMedico } = dto;

      const { data, error } = await this.supabase
        .from('PERFIL')
        .insert([{ idUsuario, nombre, status, correo, rol, fechaNacimiento }])
        .select();

      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al crear perfil: ${error.message}`,
        });
      }
      if (rol === 'paciente') {
        // Asignar médico al paciente si el rol es paciente
        await this.asignMedicToPatient({
          idMedico: idMedico,
          idPaciente: idUsuario,
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

      if (error) {
        throw new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: `Error al iniciar sesión: ${error.message}`,
        });
      }

      const userId = data.user?.id;
      if (!userId) {
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'No se obtuvo el ID del usuario al iniciar sesión',
        });
      }

      // Registrar login en HISTORIAL_INGRESO
      const { error: errorHistorial } = await this.supabase
        .from('HISTORIAL_INGRESO')
        .insert([
          {
            idPaciente: userId,
            loginDate: new Date().toISOString(),
          },
        ]);

      if (errorHistorial) {
        console.error(
          'Error al registrar historial de ingreso:',
          errorHistorial.message,
        );
        // No lanzamos excepción para no bloquear el login
      }

      return {
        ok: true,
        access_token: data.session?.access_token,
        expires_in: data.session?.expires_in,
        user_id: userId,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al iniciar sesión',
      });
    }
  }

  /**
   * Retorna todos los usuarios registrados.
   */
  async findAll() {
    try {
      const { data, error } = await this.supabase.from('PERFIL').select('*');

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
      if (data.length == 0) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Usuario no encontrado',
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
  /* async deleteUser(id: string) {
    try {
      // Elimina el usuario de Supabase Auth - REVISAR RLS
      const { error } = await this.supabase.auth.admin.deleteUser(id);

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
  } */
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
      const { nombreCompleto, email, rol, idMedico } = dto;
      const correo = email;

      // Verificar si ya existe el correo en la tabla PERFIL
      const { data: registro, error: errorPerfil } = await this.supabase
        .from('PERFIL')
        .select('id')
        .eq('correo', email)
        .single();

      if (errorPerfil && errorPerfil.code !== 'PGRST116') {
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error al verificar perfil: ${errorPerfil.message}`,
        });
      }

      if (registro) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'El correo ya está registrado en el sistema.',
        });
      }

      // Insertar la invitación en la base de datos
      const { data, error } = await this.supabase
        .from('invitaciones')
        .insert([{ correo, nombreCompleto, rol, idMedico }])
        .select();

      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al crear invitación: ${error.message}`,
        });
      }

      const invitacion = data[0];

      // Generar token cifrado a partir del ID de la invitación
      const token = this.encrypt(String(invitacion.id));

      // Emitir evento al microservicio de alertas
      await lastValueFrom(
        this.clientProxy.emit(
          { cmd: 'crearInvitacionUsuario' },
          { email, nombreCompleto, token, rol },
        ),
      );

      return {
        ok: true,
        message: 'Invitación creada correctamente',
        invitacion,
        token,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al crear la invitación',
      });
    }
  }

  // === Obtener invitación desde el token ===
  async obtenerInvitacionPorToken(token: string) {
    try {
      // Desencriptar el token para recuperar el ID original
      const decodedId = this.decrypt(token);

      //  Buscar invitación en Supabase
      const { data, error } = await this.supabase
        .from('invitaciones')
        .select('*')
        .eq('id', decodedId)
        .single();

      if (error || !data) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Invitación no encontrada o token inválido',
        });
      }

      //  Retornar la invitación completa
      return {
        ok: true,
        message: 'Invitación obtenida correctamente',
        invitacion: data,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error al obtener invitación desde token',
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

    if (rolCuidData.rol !== 'cuidador') {
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

  async buscarPacienteCuidador(idCuidador: string) {
    try {
      const { data: data, error: err } = await this.supabase
        .from('CUIDADOR_PACIENTE')
        .select('idPaciente')
        .eq('idCuidador', idCuidador);

      if (err) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Algo sucedió buscando el id del paciente',
        });
      }

      return data;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  async buscarMedicoPaciente(idPaciente: string) {
    const usuario = await this.findUserById(idPaciente);
    this.validarRolPaciente(usuario.usuarios[0].rol);
    try {
      const { data: data, error: err } = await this.supabase
        .from('PACIENTE_MEDICO')
        .select('*')
        .eq('idPaciente', idPaciente);

      if (err) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Algo sucedió buscando el id del médico',
        });
      }
      const medico = await this.findUserById(data[0].idMedico);

      return medico.usuarios[0];
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      });
    }
  }

  private validarRolPaciente(rol: string) {
    if (rol != 'paciente') {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'El rol de este usuario debe ser paciente',
      });
    }
  }

  /**
   * Lista usuarios inactivos que tienen sesiones activas
   */
  async listarUsuariosInactivosConSesiones(payload: {
    horasInactividad: number;
    pacientesConSesiones: Array<{
      idPaciente: string;
      sesionesActivas: number;
    }>;
  }) {
    try {
      const { horasInactividad, pacientesConSesiones } = payload;

      if (!pacientesConSesiones || pacientesConSesiones.length === 0) {
        return { ok: true, usuarios: [] };
      }

      // Obtener último login de cada paciente
      const usuarios: any[] = [];

      for (const { idPaciente, sesionesActivas } of pacientesConSesiones) {
        // Buscar último login
        const { data: historial, error: errorHistorial } = await this.supabase
          .from('HISTORIAL_INGRESO')
          .select('loginDate')
          .eq('idPaciente', idPaciente)
          .order('loginDate', { ascending: false })
          .limit(1)
          .single();

        if (errorHistorial || !historial) continue;

        // Calcular diferencia de tiempo
        const horasDiferencia =
          (Date.now() - new Date(historial.loginDate).getTime()) /
          (1000 * 60 * 60);

        if (horasDiferencia < horasInactividad) continue; // Aún está activo

        // Verificar si ya se envió alerta hoy
        const { data: notificacionHoy } = await this.supabase
          .from('NOTIFICACION_USO')
          .select('idNotificacion')
          .eq('idUsuario', idPaciente)
          .like('mensaje', 'Recordatorio: Tienes sesiones activas%')
          .gte('fecha', new Date().toISOString().split('T')[0]) // Desde hoy 00:00
          .limit(1);

        if (notificacionHoy && notificacionHoy.length > 0) continue; // Ya se envió hoy

        // Obtener datos del perfil
        const { data: perfil } = await this.supabase
          .from('PERFIL')
          .select('nombre, correo')
          .eq('idUsuario', idPaciente)
          .single();

        if (!perfil) continue;

        usuarios.push({
          id_usuario: idPaciente,
          email: perfil.correo,
          nombre: perfil.nombre,
          last_login: historial.loginDate,
          sesiones_activas: sesionesActivas, // Conteo real de sesiones
        });
      }

      return { ok: true, usuarios };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error al buscar usuarios inactivos',
      });
    }
  }

  /**
   * Registra alerta en NOTIFICACION_USO
   */
  async registrarAlertaInactividad(userId: string) {
    try {
      const mensaje = `Recordatorio: Tienes sesiones activas pendientes. Te invitamos a completarlas.`;

      const { error } = await this.supabase.from('NOTIFICACION_USO').insert([
        {
          idUsuario: userId,
          mensaje: mensaje,
          fecha: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      return { ok: true, message: 'Notificación registrada' };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  async listarMedicosPaciente(idMedico: string) {
    try {
      const doctores = await this.findUserById(idMedico);
      if (doctores.usuarios.length == 0) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'No se pudo encontrar el usuario',
        });
      }
      if (doctores.usuarios[0].rol != 'medico') {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Solo se admite id de un medico',
        });
      }

      // Obtener sólo los idPaciente relacionados con el médico
      const { data: pmData, error: pmError } = await this.supabase
        .from('PACIENTE_MEDICO')
        .select('idPaciente')
        .eq('idMedico', idMedico);

      if (pmError) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al buscar relaciones paciente-médico: ${pmError.message}`,
        });
      }

      const patientIds: string[] = (pmData || [])
        .map((r: any) => r.idPaciente)
        .filter(Boolean);

      if (patientIds.length === 0) {
        return { ok: true, pacientes: [], count: 0 };
      }

      // Ahora traer los perfiles de los pacientes
      const { data: pacientes, error: pacientesError } = await this.supabase
        .from('PERFIL')
        .select('*')
        .in('idUsuario', patientIds);

      if (pacientesError) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al traer perfiles de pacientes: ${pacientesError.message}`,
        });
      }

      return {
        pacientes: pacientes ?? [],
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          error.message || 'Error interno al consultar pacientes del médico',
      });
    }
  }

  async totalUsuarios() {
    try {
      // Obtener todos los perfiles con sus roles
      const { data, error } = await this.supabase.from('PERFIL').select('rol');

      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al contar usuarios: ${error.message}`,
        });
      }

      // Contar por rol
      const medicos = data?.filter((u) => u.rol === 'medico').length || 0;
      const pacientes = data?.filter((u) => u.rol === 'paciente').length || 0;
      const cuidadores = data?.filter((u) => u.rol === 'cuidador').length || 0;
      const administradores =
        data?.filter((u) => u.rol === 'administrador').length || 0;
      const total = data?.length || 0;

      return {
        total,
        medicos,
        pacientes,
        cuidadores,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al contar usuarios',
      });
    }
  }

  async enviarMagicLink(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({ email });

    if (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Error al enviar OTP: ${error.message}`,
      });
    }

    return { ok: true, message: 'Código OTP enviado al correo.' };
  }

  async actualizarContraseña(dto: actualizarContraseñaDto, token: string) {
    const { password: nuevaContrasena } = dto;
    const cliente = await withUserToken(this.supabase, token);
    const { data, error } = await cliente.auth.updateUser({
      password: nuevaContrasena,
    });

    if (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Error cambiando contraseña: ${error.message}`,
      });
    }

    return data.user;
  }
}
