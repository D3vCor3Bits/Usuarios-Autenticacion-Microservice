import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateUsuariosAutenticacionDto } from './dto/create-usuarios-autenticacion.dto';

@Injectable()
export class UsuariosAutenticacionService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Crea un nuevo usuario en la tabla USUARIO.
   * Lanza RpcException si ocurre algún error durante la inserción.
   */
  async create(dto: CreateUsuariosAutenticacionDto) {
    try {
      const { nombre, edad, status, correo, contrasenia, rol, contrasenias } = dto;

      const { data, error } = await this.supabase
        .from('USUARIO')
        .insert([{ nombre, edad, status, correo, contrasenia, rol, contrasenias }])
        .select();

      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Error al crear usuario: ${error.message}`,
        });
      }

      return {
        status: 'success',
        message: 'Usuario creado correctamente',
        usuario: data[0],
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Error interno al crear el usuario',
      });
    }
  }

  /**
   * Retorna todos los usuarios registrados.
   */
  async findAll() {
    try {
      const { data, error } = await this.supabase
        .from('USUARIO')
        .select('*');

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
}


  


/* import { Injectable } from '@nestjs/common';
import { CreateUsuariosAutenticacionDto } from './dto/create-usuarios-autenticacion.dto';
import { UpdateUsuariosAutenticacionDto } from './dto/update-usuarios-autenticacion.dto';

@Injectable()
export class UsuariosAutenticacionService {
  create(createUsuariosAutenticacionDto: CreateUsuariosAutenticacionDto) {
    return 'This action adds a new usuariosAutenticacion';
  }

  findAll() {
    return `This action returns all usuariosAutenticacion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} usuariosAutenticacion`;
  }

  update(id: number, updateUsuariosAutenticacionDto: UpdateUsuariosAutenticacionDto) {
    return `This action updates a #${id} usuariosAutenticacion`;
  }

  remove(id: number) {
    return `This action removes a #${id} usuariosAutenticacion`;
  }
} */