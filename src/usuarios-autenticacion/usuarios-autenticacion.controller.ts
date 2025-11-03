import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsuariosAutenticacionService } from './usuarios-autenticacion.service';
import { CreateUsuariosAutenticacionDto } from './dto/create-usuarios-autenticacion.dto';
import { loginUsuarioDto } from './dto/login-usuario.dto';
import { crearInvitacionDto } from './dto/crear-invitacion.dto';

@Controller()
export class UsuariosAutenticacionController {
  constructor(private readonly usuariosService: UsuariosAutenticacionService) {}
/* Agregar siempre objeto CMD. */
  @MessagePattern({ cmd: 'createUsuariosAutenticacion' })
  crear(@Payload() dto: CreateUsuariosAutenticacionDto) {
    return this.usuariosService.signUp(dto);
  }


  @MessagePattern({ cmd: 'loginUsuario' })
  login(@Payload() dto: loginUsuarioDto) {
    return this.usuariosService.login(dto);
  }


  @MessagePattern({ cmd: 'findUsers' })
  listar() {
    return this.usuariosService.findAll();
  }

  @MessagePattern({ cmd : 'findUserById'})
  buscar(@Payload() id : string){
    return this.usuariosService.findUserById(id);
  }


  @MessagePattern({ cmd : 'deleteUser'})
  borrar(@Payload() id: string){
    return this.usuariosService.deleteUser(id);
  }


  @MessagePattern({cmd : 'crearInvitacion'})
  crearInv(@Payload() dto: crearInvitacionDto){
    return this.usuariosService.crearInvitacion(dto);
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

