import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';
import { StudentsService } from './students.service';
import { CreateStudentDto, FindStudentsQueryDto, UpdateStudentDto } from './dto/student.dto';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private service: StudentsService) {}

  @Roles(UserRole.ADMIN, UserRole.SEKOLAH)
  @Post()
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.create(dto, user);
  }

  // Authorization Matrix: Student CRUD scoped to ADMIN/SEKOLAH; other roles Read-only.
  @Get()
  findAll(@Query() query: FindStudentsQueryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findOne(id, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SEKOLAH)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.remove(id, user);
  }
}
