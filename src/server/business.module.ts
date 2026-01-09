import { Module, Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, NotFoundException, Res } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Company, CompanySchema, Project, ProjectSchema, ConcreteTest, ConcreteTestSchema } from './schemas';
import { Response as ExpressResponse } from 'express';

// --- COMPANY CONTROLLER ---
@Controller('companies')
@UseGuards(AuthGuard('jwt'))
export class CompanyController {
  constructor(@InjectModel(Company.name) private companyModel: Model<Company>) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.companyModel.find({ userId: req.user._id }).sort({ name: 1 }).lean();
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const created = new this.companyModel({ ...body, userId: req.user._id });
    return created.save();
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const { name, contactName, email, phone } = body;
    const updated = await this.companyModel.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { name, contactName, email, phone } },
      { new: true }
    );
    if (!updated) throw new NotFoundException();
    return updated;
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const deleted = await this.companyModel.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!deleted) throw new NotFoundException();
    return { message: "Supprimé" };
  }
}

// --- PROJECT CONTROLLER ---
@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(ConcreteTest.name) private testModel: Model<ConcreteTest>
  ) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.projectModel.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const created = new this.projectModel({ ...body, userId: req.user._id });
    return created.save();
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const updated = await this.projectModel.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: body }, // NestJS body is sanitized via DTOs/ValidationPipe generally, simplifying here
      { new: true }
    );
    if (!updated) throw new NotFoundException();
    return updated;
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const deleted = await this.projectModel.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!deleted) throw new NotFoundException();
    return { message: "Supprimé" };
  }

  @Get(':id/full-report')
  async getFullReport(@Request() req: any, @Param('id') id: string) {
     const project = await this.projectModel.findOne({ _id: id, userId: req.user._id });
     if (!project) throw new NotFoundException();
     const tests = await this.testModel.find({ projectId: id }).sort({ samplingDate: 1 }).lean();
     return { project, tests };
  }

  @Get(':id/export/csv')
  async exportCsv(@Request() req: any, @Param('id') id: string, @Res() res: any) {
    const project = await this.projectModel.findOne({ _id: id, userId: req.user._id });
    if (!project) throw new NotFoundException();
    const tests = await this.testModel.find({ projectId: id }).sort({ samplingDate: 1 }).lean();

    const header = [
      "Reference", "Date Prelevement", "Ouvrage", "Partie", "Classe", 
      "Slump (mm)", "Volume (m3)", "Num Eprouvette", "Age (j)", 
      "Date Ecrasement", "Masse (g)", "Force (kN)", "Contrainte (MPa)", "Densite (kg/m3)"
    ].join(",");

    const rows: string[] = [];
    tests.forEach((t: any) => {
      if (t.specimens && t.specimens.length > 0) {
        t.specimens.forEach((s: any) => {
          rows.push([
            t.reference,
            t.samplingDate ? new Date(t.samplingDate).toLocaleDateString('fr-FR') : '',
            `"${t.structureName || ''}"`,
            `"${t.elementName || ''}"`,
            t.concreteClass,
            t.slump,
            t.volume,
            s.number,
            s.age,
            s.crushingDate ? new Date(s.crushingDate).toLocaleDateString('fr-FR') : '',
            s.weight || '',
            s.force || '',
            s.stress ? s.stress.toFixed(1) : '',
            s.density ? s.density.toFixed(0) : ''
          ].join(","));
        });
      } else {
         rows.push([
            t.reference,
            t.samplingDate ? new Date(t.samplingDate).toLocaleDateString('fr-FR') : '',
            `"${t.structureName || ''}"`,
            `"${t.elementName || ''}"`,
            t.concreteClass,
            t.slump,
            t.volume,
            "","","","","","",""
          ].join(","));
      }
    });

    const csvContent = [header, ...rows].join("\n");
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="export_affaire_${id}.csv"`);
    res.send(csvContent);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Project.name, schema: ProjectSchema },
      { name: ConcreteTest.name, schema: ConcreteTestSchema }
    ])
  ],
  controllers: [CompanyController, ProjectController]
})
export class BusinessModule {}