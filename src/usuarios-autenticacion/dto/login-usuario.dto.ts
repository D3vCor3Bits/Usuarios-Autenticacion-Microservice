import {
  IsEmail,
  IsString,
  MinLength,

} from 'class-validator';

export class loginUsuarioDto {
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido. ms' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(10, {
    message: 'La contraseña debe tener al menos 10 caracteres.',
  })
  password: string;
}
