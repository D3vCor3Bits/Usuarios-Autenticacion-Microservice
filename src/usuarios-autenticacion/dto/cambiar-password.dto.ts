import { IsString, MinLength } from 'class-validator';

export class CambiarContrasenaDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  nuevaContrasena: string;
}
