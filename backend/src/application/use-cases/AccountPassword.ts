import {DomainError} from '../../domain/errors/DomainError';
export function validatePassword(password:unknown):asserts password is string {
 if(typeof password!=='string'||password.length<6||Buffer.byteLength(password,'utf8')>72)throw new DomainError('Usa una contraseña de al menos 6 caracteres y hasta 72 bytes.');
}
