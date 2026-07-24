import { Module } from '@nestjs/common';
import { SchoolsModule } from './schools/schools.module';
import { OpdModule } from './opd/opd.module';
import { WilayahModule } from './wilayah/wilayah.module';
import { RiskFactorsModule } from './risk-factors/risk-factors.module';
import { InterventionTypesModule } from './intervention-types/intervention-types.module';
import { RegulationsModule } from './regulations/regulations.module';
import { AgamaModule } from './agama/agama.module';
import { KebutuhanKhususModule } from './kebutuhan-khusus/kebutuhan-khusus.module';
import { JenisTinggalModule } from './jenis-tinggal/jenis-tinggal.module';
import { AlatTransportasiModule } from './alat-transportasi/alat-transportasi.module';
import { PekerjaanOrtuModule } from './pekerjaan-ortu/pekerjaan-ortu.module';
import { PendidikanOrtuModule } from './pendidikan-ortu/pendidikan-ortu.module';
import { PenghasilanOrtuModule } from './penghasilan-ortu/penghasilan-ortu.module';

@Module({
  imports: [
    SchoolsModule,
    OpdModule,
    WilayahModule,
    RiskFactorsModule,
    InterventionTypesModule,
    RegulationsModule,
    // Mastering data siswa (dari Data Siswa Aktif)
    AgamaModule,
    KebutuhanKhususModule,
    JenisTinggalModule,
    AlatTransportasiModule,
    PekerjaanOrtuModule,
    PendidikanOrtuModule,
    PenghasilanOrtuModule,
  ],
})
export class MasterModule {}
