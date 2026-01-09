import { Module, Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthGuard } from '@nestjs/passport';
import { User, UserSchema, Settings, SettingsSchema, BugReport, BugReportSchema } from './schemas';
import * as bcrypt from 'bcryptjs';

// --- ADMIN USERS CONTROLLER ---
@Controller('users')
export class UsersController {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.userModel.find({}, '-password -tokenVersion').sort({ createdAt: -1 });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Request() req: any, @Body() body: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    const { username, password, role, companyName, address, contact, isActive } = body;
    
    if(await this.userModel.findOne({username})) throw new BadRequestException("Utilisateur existant");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new this.userModel({
      username, password: hashedPassword, role: role || 'standard',
      isActive: isActive !== undefined ? isActive : true,
      companyName, address, contact
    });
    await newUser.save();
    return { message: "Utilisateur créé", user: { username: newUser.username } };
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/toggle-access')
  async toggleAccess(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    if (String(id) === String(req.user._id)) throw new BadRequestException("Impossible de modifier son propre accès");
    
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException();
    
    user.isActive = !user.isActive;
    if (!user.isActive) user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    return { message: "Accès modifié", isActive: user.isActive };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    if (String(id) === String(req.user._id)) throw new BadRequestException();
    await this.userModel.findByIdAndDelete(id);
    return { message: "Utilisateur supprimé" };
  }
}

// --- SETTINGS CONTROLLER ---
@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(@InjectModel(Settings.name) private settingsModel: Model<Settings>) {}

  @Get()
  async find(@Request() req: any) {
    let settings = await this.settingsModel.findOne({ userId: req.user._id }).lean();
    if (!settings) {
       // Defaults
       const def = new this.settingsModel({
        userId: req.user._id,
        specimenTypes: ['Cylindrique 16x32', 'Cylindrique 11x22', 'Cubique 15x15', 'Cubique 10x10'],
        deliveryMethods: ['Toupie', 'Benne', 'Mixer', 'Sur site'],
        manufacturingPlaces: ['Centrale BPE', 'Centrale Chantier', 'Préfabrication'],
        mixTypes: ['CEM II/A-LL 42.5N - 350kg', 'Béton B25 - Gravillon 20mm'],
        concreteClasses: ['C20/25', 'C25/30', 'C30/37', 'C35/45'],
        consistencyClasses: ['S1', 'S2', 'S3', 'S4', 'S5'],
        curingMethods: ['Eau 20°C +/- 2°C', 'Salle Humide', 'Air ambiant'],
        testTypes: ['Compression', 'Fendage', 'Flexion'],
        preparations: ['Surfaçage Soufre', 'Rectification', 'Boîte à Sable'],
        nfStandards: ['NF EN 206/CN', 'NF EN 12350', 'NF EN 12390']
       });
       await def.save();
       settings = def.toObject();
    }
    return settings;
  }

  @Put()
  async update(@Request() req: any, @Body() body: any) {
     const allowedArrays = [
        'specimenTypes', 'deliveryMethods', 'manufacturingPlaces', 'mixTypes',
        'concreteClasses', 'consistencyClasses', 'curingMethods', 'testTypes',
        'preparations', 'nfStandards'
    ];
    const updates: any = {};
    allowedArrays.forEach(field => {
        if (body[field] !== undefined && Array.isArray(body[field])) {
            updates[field] = body[field].map(String);
        }
    });

    const settings = await this.settingsModel.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return settings;
  }
}

// --- BUGS CONTROLLER ---
@Controller()
@UseGuards(AuthGuard('jwt'))
export class BugsController {
  constructor(@InjectModel(BugReport.name) private bugModel: Model<BugReport>) {}

  @Post('bugs')
  async create(@Body() body: any) {
    await this.bugModel.create({ ...body, type: String(body.type) });
    return { message: "Signalement reçu" };
  }

  @Get('admin/bugs')
  async findAll(@Request() req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.bugModel.find().sort({ createdAt: -1 });
  }

  @Put('admin/bugs/:id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.bugModel.findByIdAndUpdate(id, { 
        status: body.status, 
        resolvedAt: body.status === 'resolved' ? new Date() : null 
    }, { new: true });
  }

  @Delete('admin/bugs/:id')
  async remove(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    await this.bugModel.findByIdAndDelete(id);
    return { message: "Signalement supprimé" };
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Settings.name, schema: SettingsSchema },
      { name: BugReport.name, schema: BugReportSchema }
    ])
  ],
  controllers: [UsersController, SettingsController, BugsController]
})
export class AdminModule {}