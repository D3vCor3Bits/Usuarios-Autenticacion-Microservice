import { Injectable } from '@nestjs/common';
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
}
