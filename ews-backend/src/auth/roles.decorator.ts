import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
/**
 * Restrict an endpoint to one or more of the 5 SRS actors:
 * ADMIN, SEKOLAH, KAPANEWON, OPD, DINAS_PENDIDIKAN
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
