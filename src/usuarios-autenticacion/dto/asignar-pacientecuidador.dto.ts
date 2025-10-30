import { IsString } from 'class-validator'; 

export class asignarCuidadorPacienteDto {
  @IsString({ message: 'El idCuidador debe ser una cadena de texto.' })
  idCuidador: string;

  @IsString({ message: 'El idPaciente debe ser una cadena de texto.' })
  idPaciente: string;
}
