import { IsEmail, IsString } from 'class-validator';

export class ActualizarCorreoDto {
  @IsEmail({}, { message: 'El correo debe ser válido.' })
  email: string;
}
