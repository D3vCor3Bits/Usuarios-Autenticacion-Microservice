import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsuariosAutenticacionService } from './usuarios-autenticacion.service';
import { CreateUsuariosAutenticacionDto } from './dto/create-usuarios-autenticacion.dto';


@Controller()
export class UsuariosAutenticacionController {
  constructor(private readonly usuariosService: UsuariosAutenticacionService) {}
/* Agregar siempre objeto CMD. */
  @MessagePattern({ cmd: 'createUsuariosAutenticacion' })
  crear(@Payload() dto: CreateUsuariosAutenticacionDto) {
    return this.usuariosService.create(dto);
  }

  /*@MessagePattern('login_usuario')
  login(@Payload() dto: LoginUsuariosAutenticacionDto) {
    return this.usuariosService.login(dto);
  }*/

  @MessagePattern('listar_usuarios')
  listar() {
    return this.usuariosService.findAll();
  }

  /*@MessagePattern('buscar_usuario')
  buscar(@Payload() id: number) {
    return this.usuariosService.findOne(id);
  }

  @MessagePattern('eliminar_usuario')
  eliminar(@Payload() id: number) {
    return this.usuariosService.remove(id);
  }*/
}

