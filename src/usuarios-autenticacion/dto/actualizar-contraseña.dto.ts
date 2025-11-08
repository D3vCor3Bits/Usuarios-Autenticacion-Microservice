import { IsString, MinLength } from 'class-validator'; 

export class actualizarContraseñaDto {
  @IsString({ message: 'El idPaciente debe ser una cadena de texto.' })
  @MinLength(10, { message: 'La contraseña debe tener al menos 10 caracteres.' })
  password: string;
}
