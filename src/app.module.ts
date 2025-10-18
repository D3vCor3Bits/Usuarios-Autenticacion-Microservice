import { Module } from '@nestjs/common';
import { UsuariosAutenticacionModule } from './usuarios-autenticacion/usuarios-autenticacion.module';


@Module({
  imports: [UsuariosAutenticacionModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
