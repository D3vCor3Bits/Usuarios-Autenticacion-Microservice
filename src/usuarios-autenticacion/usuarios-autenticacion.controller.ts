import { Controller, ParseIntPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsuariosAutenticacionService } from './usuarios-autenticacion.service';
import { CreateUsuariosAutenticacionDto } from './dto/create-usuarios-autenticacion.dto';
import { UpdateUsuariosAutenticacionDto } from './dto/update-usuarios-autenticacion.dto';

@Controller()
export class UsuariosAutenticacionController {
  constructor(private readonly usuariosAutenticacionService: UsuariosAutenticacionService) {}

  //HAY UN PAGINATION DTO EN COMMON, ES IMPORTANTE USARLO, REVISAR REPO 
  @MessagePattern({cmd:'createUsuariosAutenticacion'})
  create(@Payload() createUsuariosAutenticacionDto: CreateUsuariosAutenticacionDto) {
    return this.usuariosAutenticacionService.create(createUsuariosAutenticacionDto);
  }

  @MessagePattern({cmd:'findAllUsuariosAutenticacion'})
  findAll() {
    return this.usuariosAutenticacionService.findAll();
  }

  @MessagePattern({cmd:'findOneUsuariosAutenticacion'})
  findOne(@Payload('id', ParseIntPipe) id: number) {
    return this.usuariosAutenticacionService.findOne(id);
  }

  @MessagePattern({cmd:'updateUsuariosAutenticacion'})
  update(@Payload() updateUsuariosAutenticacionDto: UpdateUsuariosAutenticacionDto) {
    return this.usuariosAutenticacionService.update(updateUsuariosAutenticacionDto.id, updateUsuariosAutenticacionDto);
  }

  @MessagePattern({cmd:'removeUsuariosAutenticacion'})
  remove(@Payload() id: number) {
    return this.usuariosAutenticacionService.remove(id);
  }
}
