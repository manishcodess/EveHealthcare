import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EVE Healthcare database...');

  // Clean up existing data in reverse order of foreign key dependency
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.centreTestOffering.deleteMany({});
  await prisma.diagnosticTest.deleteMany({});
  await prisma.diagnosticCentre.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned previous database records.');

  // 1. Seed Users (with hashed passwords)
  const defaultPasswordHash = await bcrypt.hash('Password123', 10);

  const userAlice = await prisma.user.create({
    data: {
      name: 'Dr. Alice Smith',
      email: 'alice@evehealthcare.com',
      passwordHash: defaultPasswordHash,
    },
  });

  const userBob = await prisma.user.create({
    data: {
      name: 'Bob Jones',
      email: 'bob@evehealthcare.com',
      passwordHash: defaultPasswordHash,
    },
  });

  const userCharlie = await prisma.user.create({
    data: {
      name: 'Charlie Brown',
      email: 'charlie@evehealthcare.com',
      passwordHash: defaultPasswordHash,
    },
  });

  console.log(`👤 Created 3 seed users: ${userAlice.email}, ${userBob.email}, ${userCharlie.email}`);

  // 2. Seed Diagnostic Centres
  const centreIndiranagar = await prisma.diagnosticCentre.create({
    data: {
      name: 'EVE Diagnostic & Imaging Centre - Indiranagar',
      location: '100 Feet Rd, Indiranagar, Bangalore, Karnataka 560038',
    },
  });

  const centreKoramangala = await prisma.diagnosticCentre.create({
    data: {
      name: 'EVE Multi-Speciality Pathology - Koramangala',
      location: '80 Feet Rd, 4th Block, Koramangala, Bangalore, Karnataka 560034',
    },
  });

  const centreWhitefield = await prisma.diagnosticCentre.create({
    data: {
      name: 'EVE Advanced Diagnostics - Whitefield',
      location: 'ITPL Main Rd, Whitefield, Bangalore, Karnataka 560066',
    },
  });

  const centreJayanagar = await prisma.diagnosticCentre.create({
    data: {
      name: 'EVE Diagnostics Hub - Jayanagar',
      location: '9th Main Rd, 4th Block, Jayanagar, Bangalore, Karnataka 560011',
    },
  });

  console.log('🏥 Created 4 diagnostic centres across Bangalore.');

  // 3. Seed Diagnostic Tests
  const testCBC = await prisma.diagnosticTest.create({
    data: {
      name: 'Complete Blood Count (CBC)',
      description: 'Comprehensive evaluation of overall health including RBC, WBC, and platelets count.',
    },
  });

  const testLipid = await prisma.diagnosticTest.create({
    data: {
      name: 'Lipid Profile / Cholesterol Panel',
      description: 'Measures total cholesterol, HDL, LDL, and triglycerides for cardiovascular risk assessment.',
    },
  });

  const testHbA1c = await prisma.diagnosticTest.create({
    data: {
      name: 'HbA1c (Glycated Hemoglobin)',
      description: 'Evaluates average blood sugar levels over the past 3 months for diabetes monitoring.',
    },
  });

  const testThyroid = await prisma.diagnosticTest.create({
    data: {
      name: 'Thyroid Profile (Total T3, Total T4, TSH)',
      description: 'Screens for hyperthyroidism and hypothyroidism function and hormonal balance.',
    },
  });

  const testVitaminD = await prisma.diagnosticTest.create({
    data: {
      name: 'Vitamin D (25-Hydroxy)',
      description: 'Measures 25-hydroxyvitamin D levels in the blood for bone density and immune health.',
    },
  });

  const testLFT = await prisma.diagnosticTest.create({
    data: {
      name: 'Liver Function Test (LFT)',
      description: 'Assesses hepatic health by measuring liver enzymes, proteins, and bilirubin levels.',
    },
  });

  const testKFT = await prisma.diagnosticTest.create({
    data: {
      name: 'Kidney Function Test (KFT / RFT)',
      description: 'Measures serum creatinine, blood urea nitrogen, and electrolytes to evaluate renal function.',
    },
  });

  console.log('🧪 Created 7 diagnostic tests.');

  // 4. Seed Centre-Test Offerings (Illustrates different pricing for the same test at different centres)
  const offeringsData = [
    // Indiranagar Offerings
    { centreId: centreIndiranagar.id, testId: testCBC.id, price: 350.0 },
    { centreId: centreIndiranagar.id, testId: testLipid.id, price: 650.0 },
    { centreId: centreIndiranagar.id, testId: testHbA1c.id, price: 450.0 },
    { centreId: centreIndiranagar.id, testId: testThyroid.id, price: 550.0 },
    { centreId: centreIndiranagar.id, testId: testVitaminD.id, price: 1200.0 },
    { centreId: centreIndiranagar.id, testId: testKFT.id, price: 800.0 },

    // Koramangala Offerings
    { centreId: centreKoramangala.id, testId: testCBC.id, price: 400.0 },
    { centreId: centreKoramangala.id, testId: testLipid.id, price: 700.0 },
    { centreId: centreKoramangala.id, testId: testHbA1c.id, price: 500.0 },
    { centreId: centreKoramangala.id, testId: testThyroid.id, price: 600.0 },
    { centreId: centreKoramangala.id, testId: testVitaminD.id, price: 1300.0 },
    { centreId: centreKoramangala.id, testId: testLFT.id, price: 850.0 },
    { centreId: centreKoramangala.id, testId: testKFT.id, price: 850.0 },

    // Whitefield Offerings
    { centreId: centreWhitefield.id, testId: testCBC.id, price: 380.0 },
    { centreId: centreWhitefield.id, testId: testLipid.id, price: 750.0 },
    { centreId: centreWhitefield.id, testId: testHbA1c.id, price: 480.0 },
    { centreId: centreWhitefield.id, testId: testVitaminD.id, price: 1350.0 },
    { centreId: centreWhitefield.id, testId: testLFT.id, price: 900.0 },

    // Jayanagar Offerings
    { centreId: centreJayanagar.id, testId: testCBC.id, price: 320.0 },
    { centreId: centreJayanagar.id, testId: testLipid.id, price: 600.0 },
    { centreId: centreJayanagar.id, testId: testThyroid.id, price: 500.0 },
    { centreId: centreJayanagar.id, testId: testLFT.id, price: 800.0 },
    { centreId: centreJayanagar.id, testId: testKFT.id, price: 750.0 },
  ];

  for (const offering of offeringsData) {
    await prisma.centreTestOffering.create({
      data: offering,
    });
  }

  console.log(`🏷️ Created ${offeringsData.length} centre-test offerings with varied pricing.`);

  // 5. Seed Initial Sample Bookings
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 3);
  nextWeek.setHours(9, 30, 0, 0);

  const sampleOffering = await prisma.centreTestOffering.findUnique({
    where: {
      centreId_testId: {
        centreId: centreIndiranagar.id,
        testId: testCBC.id,
      },
    },
  });

  const sampleBooking = await prisma.booking.create({
    data: {
      userId: userAlice.id,
      centreId: centreIndiranagar.id,
      testId: testCBC.id,
      offeringId: sampleOffering.id,
      appointmentDate: nextWeek,
      amount: sampleOffering.price,
      status: 'PENDING',
    },
  });

  console.log(`📅 Created 1 sample booking for user Alice (ID: ${sampleBooking.id}).`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
