import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuariosAutenticacionDto } from './create-usuarios-autenticacion.dto';

export class UpdateUsuariosAutenticacionDto extends PartialType(CreateUsuariosAutenticacionDto) {
  id: number;
}
