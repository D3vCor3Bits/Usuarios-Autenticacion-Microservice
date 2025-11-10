import { IsEmail, IsString, MinLength, IsInt, IsOptional, IsArray, IsDate } from 'class-validator';

export class subirImagenDto {
  @IsString({ message: 'El id del usuario debe ser una cadena de texto.' })
  idUsuario: string;

  @IsString({ message: 'La URL de la imagen debe ser una cadena de texto.' })
  avatarUrl: string;
 
}