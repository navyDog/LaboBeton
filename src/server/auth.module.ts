import { Module, Injectable, Controller, Post, Body, UnauthorizedException, ForbiddenException, UseGuards, Get, Request, Put } from '@nestjs/common';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { PassportModule, AuthGuard } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserSchema } from './schemas';
import * as bcrypt from 'bcryptjs';
import { ConfigModule, ConfigService } from '@nestjs/config';

// --- JWT STRATEGY ---
@Injectable()
export class JwtStrategy extends Strategy {
  constructor(configService: ConfigService, @InjectModel(User.name) private userModel: Model<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev_secret_key_change_me',
    });
  }

  async validate(payload: any) {
    const user = await this.userModel.findById(payload.id).select('-password');
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    if (!user.isActive) throw new ForbiddenException('Compte désactivé');
    if (payload.tokenVersion !== user.tokenVersion) throw new UnauthorizedException('Session expirée');
    return user; // Injecté dans req.user
  }
}

// --- AUTH SERVICE ---
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userModel.findOne({ username });
    if (user && user.isActive && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user.toObject();
      return { ...result, _id: user._id, originalUser: user }; // Pass original doc for save()
    }
    return null;
  }

  async login(user: any) {
    // Incrémenter tokenVersion sur le document Mongoose original
    const userDoc = await this.userModel.findById(user._id);
    if(userDoc) {
        userDoc.tokenVersion = (userDoc.tokenVersion || 0) + 1;
        userDoc.lastLogin = new Date();
        await userDoc.save();
    }

    const payload = { 
        id: user._id, 
        role: user.role, 
        username: user.username,
        tokenVersion: userDoc?.tokenVersion 
    };
    
    return {
      token: this.jwtService.sign(payload),
      user: { ...user, tokenVersion: undefined } // Clean user object
    };
  }

  async updateProfile(userId: string, data: any) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException();

    if (data.companyName !== undefined) user.companyName = data.companyName;
    if (data.address !== undefined) user.address = data.address;
    if (data.contact !== undefined) user.contact = data.contact;
    if (data.siret !== undefined) user.siret = data.siret;
    if (data.apeCode !== undefined) user.apeCode = data.apeCode;
    if (data.legalInfo !== undefined) user.legalInfo = data.legalInfo;
    if (data.logo !== undefined) user.logo = data.logo;

    if (data.password && data.password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(data.password, salt);
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }
    
    await user.save();
    const { password, tokenVersion, ...rest } = user.toObject();
    return rest;
  }
}

// --- AUTH CONTROLLER ---
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, @InjectModel(User.name) private userModel: Model<User>) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
        // Check for specific error message logic (disabled vs wrong pwd) handled in service ideally
        // Replicating basic behavior:
        const exists = await this.userModel.findOne({username: body.username});
        if(exists && !exists.isActive) throw new ForbiddenException("Ce compte a été désactivé.");
        throw new UnauthorizedException("Identifiants incorrects");
    }
    return this.authService.login(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  updateProfile(@Request() req: any, @Body() body: any) {
    return this.authService.updateProfile(req.user._id, body);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev_secret_key_change_me',
        signOptions: { expiresIn: '12h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}