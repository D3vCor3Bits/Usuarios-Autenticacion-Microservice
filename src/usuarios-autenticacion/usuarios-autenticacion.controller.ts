import { Controller, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsuariosAutenticacionService } from './usuarios-autenticacion.service';
import { CreateUsuariosAutenticacionDto } from './dto/create-usuarios-autenticacion.dto';
import { loginUsuarioDto } from './dto/login-usuario.dto';
import { asignarMedpacienteDto } from './dto/asignar-medpaciente.dto';
import { asignarCuidadorPacienteDto } from './dto/asignar-pacientecuidador.dto';
import { crearInvitacionDto } from './dto/crear-invitacion.dto';
import { actualizarContraseñaDto } from './dto/actualizar-contraseña.dto';
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

  @MessagePattern({ cmd: 'findUserById' })
  buscar(@Payload('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findUserById(id);
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
  buscarMedicoPaciente(
    @Payload('idPaciente', ParseUUIDPipe) idPaciente: string,
  ) {
    return this.usuariosService.buscarMedicoPaciente(idPaciente);
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
  doctoresDeUnPaciente(@Payload('idMedico', ParseUUIDPipe) idMedico: string) {
    return this.usuariosService.listarMedicosPaciente(idMedico);
  }

  @MessagePattern({ cmd: 'totalUsuarios' })
  totalPacientes() {
    return this.usuariosService.totalUsuarios();
  }

  /* @MessagePattern({ cmd: 'contraseña' })
  actualizarContraseña(
    (@Payload()  (dto: actualizarContraseñaDto; token: string)),
  ) {
    return this.usuariosService.actualizarContraseña(payload.dto, payload.token);
  }*/
  @MessagePattern({ cmd: 'contraseña' })
  actualizarContraseña(
    @Payload() payload: { password: string; token: string },
  ) {
    const { password, token } = payload;
    return this.usuariosService.actualizarContraseña({ password }, token);
  }
  @MessagePattern({ cmd: 'actualizar-correo' })
  actualizarCorreo(@Payload() payload: { email: string; token: string }) {
    return this.usuariosService.actualizarCorreo(payload);
  }

  @MessagePattern({ cmd: 'findUsuariosSinRelacion' })
  findUsuariosSinRelacion() {
    return this.usuariosService.findUsuariosSinRelacion();
  }
  @MessagePattern({ cmd: 'eliminarPacienteCuidador'})
  eliminarPacienteCuidador(@Payload() dto: asignarCuidadorPacienteDto) {
    return this.usuariosService.removePacienteFromCuidador(dto);
  }
}
