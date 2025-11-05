import { IsEmail, IsString } from 'class-validator';

export class crearInvitacionDto {
    @IsString({ message: 'El nombre debe ser una cadena de texto.' })
    nombreCompleto: string;

    @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido.' })
    email: string;

    @IsString({ message: 'El rol debe ser una cadena de texto.' })
    rol: string;

}
