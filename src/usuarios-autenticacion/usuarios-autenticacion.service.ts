import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateUsuariosAutenticacionDto } from './dto/create-usuarios-autenticacion.dto';
import { loginUsuarioDto } from './dto/login-usuario.dto';

@Injectable()
export class UsuariosAutenticacionService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
  ) {}

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
  async findUserById(id: string) {}
}
