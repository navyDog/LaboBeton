import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// --- USER ---
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, trim: true, minlength: 3 })
  username!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ enum: ['admin', 'standard'], default: 'standard' })
  role!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: 0 })
  tokenVersion!: number;

  @Prop({ default: '' })
  companyName!: string;

  @Prop({ default: '' })
  address!: string;

  @Prop({ default: '' })
  contact!: string;

  @Prop({ default: '' })
  siret!: string;

  @Prop({ default: '' })
  apeCode!: string;

  @Prop({ default: '' })
  legalInfo!: string;

  @Prop({ default: '' })
  logo!: string;

  @Prop()
  lastLogin!: Date;
}
export const UserSchema = SchemaFactory.createForClass(User);

// --- COMPANY ---
@Schema({ timestamps: true })
export class Company extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  contactName!: string;

  @Prop({ trim: true, lowercase: true })
  email!: string;

  @Prop({ trim: true })
  phone!: string;
}
export const CompanySchema = SchemaFactory.createForClass(Company);
CompanySchema.index({ userId: 1, name: 1 }, { unique: true });

// --- PROJECT ---
@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', default: null })
  companyId?: Types.ObjectId;

  @Prop({ default: '' })
  companyName!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  contactName!: string;

  @Prop({ trim: true, lowercase: true })
  email!: string;

  @Prop({ trim: true })
  phone!: string;

  @Prop({ trim: true })
  moa!: string;

  @Prop({ trim: true })
  moe!: string;
}
export const ProjectSchema = SchemaFactory.createForClass(Project);

// --- SETTINGS ---
@Schema({ timestamps: true })
export class Settings extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop([String]) specimenTypes!: string[];
  @Prop([String]) deliveryMethods!: string[];
  @Prop([String]) manufacturingPlaces!: string[];
  @Prop([String]) mixTypes!: string[];
  @Prop([String]) concreteClasses!: string[];
  @Prop([String]) consistencyClasses!: string[];
  @Prop([String]) curingMethods!: string[];
  @Prop([String]) testTypes!: string[];
  @Prop([String]) preparations!: string[];
  @Prop([String]) nfStandards!: string[];
}
export const SettingsSchema = SchemaFactory.createForClass(Settings);

// --- BUG REPORT ---
@Schema({ timestamps: true })
export class BugReport extends Document {
  @Prop({ enum: ['bug', 'feature', 'other'], default: 'bug' })
  type!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  user!: string;

  @Prop({ enum: ['open', 'resolved'], default: 'open' })
  status!: string;

  @Prop()
  resolvedAt!: Date;
}
export const BugReportSchema = SchemaFactory.createForClass(BugReport);

// --- CONCRETE TEST & SPECIMEN ---
@Schema()
export class Specimen {
  @Prop() number!: number;
  @Prop() reference?: string;
  @Prop({ required: true }) age!: number;
  @Prop() castingDate!: Date;
  @Prop() crushingDate!: Date;
  @Prop() specimenType!: string;
  @Prop() diameter!: number;
  @Prop() height!: number;
  @Prop() surface!: number;
  @Prop({ default: null }) weight?: number;
  @Prop({ default: null }) force?: number;
  @Prop({ default: null }) stress?: number;
  @Prop({ default: null }) density?: number;
}
const SpecimenSchema = SchemaFactory.createForClass(Specimen);

@Schema({ timestamps: true })
export class ConcreteTest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop() reference!: string;
  @Prop() sequenceNumber!: number;
  @Prop() year!: number;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop() projectName!: string;
  @Prop() companyName!: string;
  @Prop() moe!: string;
  @Prop() moa!: string;

  @Prop({ trim: true }) structureName!: string;
  @Prop({ trim: true }) elementName!: string;

  @Prop({ default: Date.now }) receptionDate!: Date;
  @Prop({ default: Date.now }) samplingDate!: Date;
  @Prop() volume!: number;

  @Prop() concreteClass!: string;
  @Prop() consistencyClass!: string;
  @Prop() mixType!: string;
  @Prop() formulaInfo!: string;
  @Prop() manufacturer!: string;
  @Prop() manufacturingPlace!: string;
  @Prop() deliveryMethod!: string;

  @Prop() slump!: number;
  @Prop() samplingPlace!: string;
  @Prop() externalTemp!: number;
  @Prop() concreteTemp!: number;

  @Prop({ default: 0 }) specimenCount!: number;
  @Prop() tightening!: string;
  @Prop() vibrationTime!: number;
  @Prop() layers!: number;
  @Prop() curing!: string;

  @Prop() testType!: string;
  @Prop() standard!: string;
  @Prop() preparation!: string;
  @Prop() pressMachine!: string;

  @Prop({ type: [SpecimenSchema], default: [] })
  specimens!: Specimen[];
}

export const ConcreteTestSchema = SchemaFactory.createForClass(ConcreteTest);

// Hooks Mongoose (Logique Métier Sequence & Calculs)
ConcreteTestSchema.index({ userId: 1, reference: 1 }, { unique: true });
ConcreteTestSchema.pre('save', async function() {
  if (this.isNew) {
    const currentYear = new Date().getFullYear();
    this.year = currentYear;
    // On doit accéder au modèle via this.constructor dans un hook document
    const lastTest = await (this.constructor as any).findOne({
      userId: this.userId,
      year: currentYear
    }).sort({ sequenceNumber: -1 });

    const nextSeq = lastTest ? lastTest.sequenceNumber + 1 : 1;
    this.sequenceNumber = nextSeq;
    const seqString = nextSeq.toString().padStart(4, '0');
    this.reference = `${currentYear}-B-${seqString}`;
  }

  // Calcul Slump
  if (this.slump !== undefined) {
    if (this.slump < 10) this.consistencyClass = 'Indétérminé';
    else if (this.slump <= 40) this.consistencyClass = 'S1';
    else if (this.slump <= 90) this.consistencyClass = 'S2';
    else if (this.slump <= 150) this.consistencyClass = 'S3';
    else if (this.slump <= 210) this.consistencyClass = 'S4';
    else this.consistencyClass = 'S5';
  }

  // Calculs Éprouvettes
  if (this.specimens && this.specimens.length > 0) {
    this.specimenCount = this.specimens.length;
    this.specimens.forEach((s: any) => {
      const isCube = s.specimenType && (s.specimenType.toLowerCase().includes('cube') || s.specimenType.toLowerCase().includes('prisme'));
      if (isCube) s.surface = s.diameter * s.diameter; 
      else s.surface = Math.PI * Math.pow(s.diameter / 2, 2);
      
      if (s.force != null && s.surface > 0) s.stress = (s.force * 1000) / s.surface;
      else s.stress = null;

      if (s.weight != null && s.height > 0 && s.surface > 0) {
        const volumeMm3 = s.surface * s.height;
        s.density = (s.weight / volumeMm3) * 1000000;
      } else s.density = null;
    });
  }
});