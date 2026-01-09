import { Module, Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthGuard } from '@nestjs/passport';
import { ConcreteTest, ConcreteTestSchema } from './schemas';

@Controller('concrete-tests')
@UseGuards(AuthGuard('jwt'))
export class TestsController {
  constructor(@InjectModel(ConcreteTest.name) private testModel: Model<ConcreteTest>) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.testModel.find({ userId: req.user._id })
      .sort({ sequenceNumber: -1 })
      .populate('projectId', 'name')
      .lean();
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    try {
        const created = new this.testModel({ ...body, userId: req.user._id });
        return await created.save();
    } catch(e: any) {
        if(e.code === 11000) throw new BadRequestException("Erreur de numérotation (Doublon)");
        throw e;
    }
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const test = await this.testModel.findOne({ _id: id, userId: req.user._id });
    if (!test) throw new NotFoundException();

    const allowedFields = [
        'projectId', 'projectName', 'companyName', 'moe', 'moa', 
        'structureName', 'elementName', 'receptionDate', 'samplingDate',
        'volume', 'concreteClass', 'mixType', 'formulaInfo', 
        'manufacturer', 'manufacturingPlace', 'deliveryMethod',
        'slump', 'samplingPlace', 'tightening', 'vibrationTime',
        'layers', 'curing', 'testType', 'standard', 'preparation',
        'pressMachine', 'externalTemp', 'concreteTemp', 'specimens'
    ];

    allowedFields.forEach(field => {
        if (body[field] !== undefined) {
            (test as any)[field] = body[field];
        }
    });

    return test.save(); // Declenche le pre-save hook pour recalculs
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const deleted = await this.testModel.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!deleted) throw new NotFoundException();
    return { message: "Supprimé" };
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: ConcreteTest.name, schema: ConcreteTestSchema }])],
  controllers: [TestsController]
})
export class TestsModule {}