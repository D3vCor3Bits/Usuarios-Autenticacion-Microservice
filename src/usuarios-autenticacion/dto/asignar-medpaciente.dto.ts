import { IsString } from 'class-validator'; 

export class asignarMedpacienteDto {
  @IsString({ message: 'El idMedico debe ser una cadena de texto.' })
  idMedico: string;

  @IsString({ message: 'El idPaciente debe ser una cadena de texto.' })
  idPaciente: string;
}
