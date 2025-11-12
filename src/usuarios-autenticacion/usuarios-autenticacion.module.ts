import { Module } from '@nestjs/common';
import { UsuariosAutenticacionService } from './usuarios-autenticacion.service';
import { UsuariosAutenticacionController } from './usuarios-autenticacion.controller';
import { SupabaseModule } from 'src/common/supabase.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from 'src/config';


@Module({
  imports: [
    SupabaseModule,
    ClientsModule.register([
      {
        name: 'ALERTAS_SERVICE', 
        transport: Transport.NATS, 
        options: {
          servers: envs.natsServers, 
        },
      },
    ]),
  ],
  controllers: [UsuariosAutenticacionController],
  providers: [UsuariosAutenticacionService],
})
export class UsuariosAutenticacionModule { }
