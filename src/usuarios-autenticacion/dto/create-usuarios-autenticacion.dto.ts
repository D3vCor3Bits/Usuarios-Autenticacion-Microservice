import { IsEmail, IsString, MinLength, IsInt, IsOptional, IsArray, IsDate } from 'class-validator';

export class CreateUsuariosAutenticacionDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  nombre: string;

  @IsDate({ message: 'La fecha  debe ser en forma YYYY-MM-DD.' })
  @IsOptional()
  fechaNacimiento?: number;

  @IsString({ message: 'El estado debe ser una cadena de texto.' })
  @IsOptional()
  status?: string;

  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido.' })
  correo: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(10, { message: 'La contraseña debe tener al menos 10 caracteres.' })
  contrasenia: string;

  @IsString({ message: 'El rol debe ser una cadena de texto.' })
  rol?: string; 
}
