import { Controller, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsuariosAutenticacionService } from './usuarios-autenticacion.service';
import { CreateUsuariosAutenticacionDto } from './dto/create-usuarios-autenticacion.dto';
import { loginUsuarioDto } from './dto/login-usuario.dto';
import { asignarMedpacienteDto } from './dto/asignar-medpaciente.dto';
import { asignarCuidadorPacienteDto } from './dto/asignar-pacientecuidador.dto';
import { crearInvitacionDto } from './dto/crear-invitacion.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
@Controller()
export class UsuariosAutenticacionController {
  constructor(private readonly usuariosService: UsuariosAutenticacionService) { }
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
  listar(@Payload() data: { token: string }) {
    return this.usuariosService.findAll(data.token);
  }

  @MessagePattern({ cmd: 'findUserById' })
  buscar(@Payload() data: { token: string; id: string }) {
    return this.usuariosService.findUserById(data.token, data.id);
  }

  /* @MessagePattern({ cmd: 'deleteUser' })
  borrar(@Payload() id: string) {
    return this.usuariosService.deleteUser(id);
  } */

  @MessagePattern({ cmd: 'asignarMedpaciente' })
  asignarMedpaciente(@Payload() dto: asignarMedpacienteDto) {
    return this.usuariosService.asignMedicToPatient(dto);
  }

  @MessagePattern({ cmd: 'asignarCuidadorPaciente' })
  asignarCuidadorPaciente(@Payload() dto: asignarCuidadorPacienteDto) {
    return this.usuariosService.asignCaregiverToPatient(dto);
  }

  @MessagePattern({ cmd: 'pacienteCuidador' })
  buscarPacienteCuidador(
    @Payload('idCuidador', ParseUUIDPipe) idCuidador: string,
  ) {
    return this.usuariosService.buscarPacienteCuidador(idCuidador);
  }

  @MessagePattern({ cmd: 'pacienteMedico' })
  buscarMedicoPaciente(@Payload() data: { token: string; idPaciente: string }) {
    return this.usuariosService.buscarMedicoPaciente(data.token, data.idPaciente);
  }

  @MessagePattern({ cmd: 'crearInvitacion' })
  crearInv(@Payload() dto: crearInvitacionDto) {
    return this.usuariosService.crearInvitacion(dto);
  }

  @MessagePattern({ cmd: 'verificarInvitacion' })
  verificarInv(@Payload('token') codigo: string) {
    return this.usuariosService.obtenerInvitacionPorToken(codigo);
  }

  @MessagePattern({ cmd: 'listarUsuariosInactivosConSesiones' })
  listarInactivos(
    @Payload()
    payload: {
      horasInactividad: number;
      pacientesConSesiones: Array<{
        idPaciente: string;
        sesionesActivas: number;
      }>;
    },
  ) {
    return this.usuariosService.listarUsuariosInactivosConSesiones(payload);
  }

  @MessagePattern({ cmd: 'registrarAlertaInactividad' })
  registrarAlerta(@Payload() payload: { userId: string }) {
    return this.usuariosService.registrarAlertaInactividad(payload.userId);
  }

  @MessagePattern({ cmd: 'pacientesMedico' })
  listarPacientesMedico(@Payload() data: { token: string; idMedico: string }) {
    return this.usuariosService.listarMedicosPaciente(data.token, data.idMedico);
  }

  @MessagePattern({ cmd: 'totalUsuarios' })
  totalPacientes() {
    return this.usuariosService.totalUsuarios();
  }

  @MessagePattern({ cmd: 'enviarOTP' })
  enviarOTP(@Payload('email') email: string) {
    return this.usuariosService.enviarOTP(email);
  }

  @MessagePattern({ cmd: 'getPerfilUsuario' })
  getPerfilUsuario({ token }: { token: string }) {
    return this.usuariosService.obtenerPerfil(token);
  }


  @MessagePattern({ cmd: 'desactivarUsuario' })
  eliminarUsuario({ token }: { token: string }) {
    return this.usuariosService.desactivarUsuario(token);
  }

  @MessagePattern({ cmd: 'cambiarContrasena' })
  cambiarContrasena({
    token,
    nuevaContrasena,
  }: {
    token: string;
    nuevaContrasena: string;
  }) {
    return this.usuariosService.cambiarContrasena(token, nuevaContrasena);
  }


  @MessagePattern({ cmd: 'cambiarCorreo' })
  cambiarCorreo({
    token,
    nuevoCorreo,
  }: {
    token: string;
    nuevoCorreo: string;
  }) {
    return this.usuariosService.cambiarCorreo(token, nuevoCorreo);
  }
  @MessagePattern({ cmd: 'uploadProfileImage' })
  uploadProfileImage({
    token,
    imageUrl,
  }: {
    token: string;
    imageUrl: string;
  }) {
    return this.usuariosService.uploadAvatar(token, imageUrl);
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
