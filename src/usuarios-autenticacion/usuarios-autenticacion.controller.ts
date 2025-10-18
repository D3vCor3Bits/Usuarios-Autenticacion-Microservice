import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsuariosAutenticacionService } from './usuarios-autenticacion.service';
import { CreateUsuariosAutenticacionDto } from './dto/create-usuarios-autenticacion.dto';
import { UpdateUsuariosAutenticacionDto } from './dto/update-usuarios-autenticacion.dto';

@Controller()
export class UsuariosAutenticacionController {
  constructor(private readonly usuariosAutenticacionService: UsuariosAutenticacionService) {}

  @MessagePattern('createUsuariosAutenticacion')
  create(@Payload() createUsuariosAutenticacionDto: CreateUsuariosAutenticacionDto) {
    return this.usuariosAutenticacionService.create(createUsuariosAutenticacionDto);
  }

  @MessagePattern('findAllUsuariosAutenticacion')
  findAll() {
    return this.usuariosAutenticacionService.findAll();
  }

  @MessagePattern('findOneUsuariosAutenticacion')
  findOne(@Payload() id: number) {
    return this.usuariosAutenticacionService.findOne(id);
  }

  @MessagePattern('updateUsuariosAutenticacion')
  update(@Payload() updateUsuariosAutenticacionDto: UpdateUsuariosAutenticacionDto) {
    return this.usuariosAutenticacionService.update(updateUsuariosAutenticacionDto.id, updateUsuariosAutenticacionDto);
  }

  @MessagePattern('removeUsuariosAutenticacion')
  remove(@Payload() id: number) {
    return this.usuariosAutenticacionService.remove(id);
  }
}
