import { Module } from '@nestjs/common';
import { UsuariosAutenticacionService } from './usuarios-autenticacion.service';
import { UsuariosAutenticacionController } from './usuarios-autenticacion.controller';

@Module({
  controllers: [UsuariosAutenticacionController],
  providers: [UsuariosAutenticacionService],
})
export class UsuariosAutenticacionModule {}
