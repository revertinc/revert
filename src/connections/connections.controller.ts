import { Controller, Post, Body, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { Connection } from './entities/connection.entity';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assuming authentication guard

@Controller('connections')
// @UseGuards(JwtAuthGuard) // Protect endpoints with authentication
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post()
  async create(@Body() createConnectionDto: CreateConnectionDto): Promise<Connection> {
    // In a real application, you'd get the organizationId from the authenticated user
    // For this example, we're assuming it's passed in the DTO.
    // const organizationId = req.user.organizationId;
    // createConnectionDto.organizationId = organizationId;
    return this.connectionsService.create(createConnectionDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Connection> {
    return this.connectionsService.findOne(id);
  }

  @Get('organization/:organizationId')
  async findAllByOrganization(@Param('organizationId') organizationId: string): Promise<Connection[]> {
    return this.connectionsService.findAllByOrganization(organizationId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.connectionsService.remove(id);
  }
}
