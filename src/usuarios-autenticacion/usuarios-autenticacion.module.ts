import { Module } from '@nestjs/common';
import { UsuariosAutenticacionService } from './usuarios-autenticacion.service';
import { UsuariosAutenticacionController } from './usuarios-autenticacion.controller';
import { SupabaseModule } from 'src/common/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [UsuariosAutenticacionController],
  providers: [UsuariosAutenticacionService],

})
export class UsuariosAutenticacionModule { }
