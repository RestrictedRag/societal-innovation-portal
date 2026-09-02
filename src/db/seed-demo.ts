import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { eq, sql } from 'drizzle-orm';
import { db } from './index';
import {
  universities,
  users,
  companyProfiles,
  citizenProblems,
  problemEmbeddings,
  problemUpvotes,
  universityProjects,
  projectUpdates,
  escrowLedger,
  industryNeeds,
  resourceOffers,
  industryCollaborations,
  projectPilots,
  savedProjects,
  notifications,
} from './schema';

const DEMO_PASSWORD = 'DemoPassword@2026';

// Generates a deterministic normalized 1024-dim vector
function generateDemoEmbedding(seed: number): number[] {
  const vec: number[] = [];
  let sumSq = 0;
  for (let i = 0; i < 1024; i++) {
    const val = Math.sin(seed * (i + 1)) * Math.cos((seed + 3) * (i + 7));
    vec.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

async function registerNeonAuthUser(email: string, name: string): Promise<string> {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: DEMO_PASSWORD,
        name,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.user?.id) {
        return data.user.id;
      }
    }
  } catch {
    // Fallback if local auth endpoint is offline or timed out
  }
  return `demo-auth-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

export async function seedDemoData() {
  console.log('🚀 [CivicNexus] Seeding presentation dataset into Neon PostgreSQL...');

  // 1. Ensure Universities
  console.log('🏛️  Ensuring Universities...');
  const uniDefinitions = [
    { name: 'Indian Institute of Technology Delhi (IIT Delhi)', serviceRadiusKm: 50 },
    { name: 'Indian Institute of Technology Bombay (IIT Bombay)', serviceRadiusKm: 50 },
    { name: 'Indian Institute of Science (IISc Bangalore)', serviceRadiusKm: 50 },
    { name: 'University of Delhi', serviceRadiusKm: 30 },
  ];

  const universityMap: Record<string, string> = {};
  for (const u of uniDefinitions) {
    let existing = await db.query.universities.findFirst({
      where: eq(universities.name, u.name),
    });

    if (!existing) {
      const [created] = await db
        .insert(universities)
        .values({
          name: u.name,
          serviceRadiusKm: u.serviceRadiusKm,
          isVerified: true,
        })
        .returning();
      existing = created;
    }
    universityMap[u.name] = existing.id;
  }

  const iitDelhiId = universityMap['Indian Institute of Technology Delhi (IIT Delhi)'];
  const iitBombayId = universityMap['Indian Institute of Technology Bombay (IIT Bombay)'];

  // 2. Ensure Dedicated Demo Accounts
  console.log('👤 Ensuring Dedicated Demo Personas...');
  const demoAccounts = [
    {
      email: 'demo.citizen@civicnexus.demo',
      firstName: 'Demo',
      lastName: 'Citizen',
      fullName: 'Demo Citizen (Aarti Verma)',
      role: 'CITIZEN' as const,
      city: 'New Delhi',
      state: 'Delhi',
      department: null,
      yearOfStudy: null,
      skills: null,
      interests: ['Public Infrastructure', 'Clean Water', 'Neighborhood Safety'],
      preferredProjectType: null,
      expertise: null,
      bio: 'Active civic resident reporting urban municipal bottlenecks in South Delhi.',
      universityId: null,
    },
    {
      email: 'demo.student.cse@civicnexus.demo',
      firstName: 'Aarav',
      lastName: 'Sharma',
      fullName: 'Demo Student CSE (Aarav Sharma)',
      role: 'STUDENT' as const,
      city: 'New Delhi',
      state: 'Delhi',
      department: 'Computer Science & Engineering',
      yearOfStudy: 4,
      skills: ['Python', 'Machine Learning / AI', 'React / Next.js', 'Computer Vision', 'Data Analytics'],
      interests: ['Smart City Infrastructure', 'Public Healthcare Technology', 'Clean Energy'],
      preferredProjectType: 'BOTH',
      expertise: null,
      bio: 'Final-year undergraduate computer science researcher focusing on edge AI and civic intelligence.',
      universityId: iitDelhiId,
    },
    {
      email: 'demo.student.iot@civicnexus.demo',
      firstName: 'Priya',
      lastName: 'Patel',
      fullName: 'Demo Student IoT (Priya Patel)',
      role: 'STUDENT' as const,
      city: 'Mumbai',
      state: 'Maharashtra',
      department: 'Electrical & Embedded Systems',
      yearOfStudy: 3,
      skills: ['IoT & Microcontrollers', 'Embedded C', 'CAD & Structural Design', 'Renewable Energy & Solar', 'Hydrology & Water Systems'],
      interests: ['Smart Infrastructure', 'Water Conservation', 'Waste Segregation & Recycling'],
      preferredProjectType: 'PROBLEM_SOLVING',
      expertise: null,
      bio: 'Pre-final year electrical engineering researcher specializing in LoRa telemetry and urban sensor meshes.',
      universityId: iitBombayId,
    },
    {
      email: 'demo.faculty@civicnexus.demo',
      firstName: 'Dr. Rajesh',
      lastName: 'Kulkarni',
      fullName: 'Demo Faculty (Dr. Rajesh Kulkarni)',
      role: 'FACULTY' as const,
      city: 'New Delhi',
      state: 'Delhi',
      department: 'Department of Computer Science & Engineering',
      yearOfStudy: null,
      skills: null,
      interests: ['Urban Technology', 'Intelligent Infrastructure', 'Sustainable Systems'],
      preferredProjectType: null,
      expertise: ['Machine Learning & Computer Vision', 'Embedded Systems & IoT', 'Water Resource Management', 'Environmental Impact Assessment'],
      bio: 'Professor and Lab Director for Cyber-Physical Urban Systems, mentoring student capstone innovations.',
      universityId: iitDelhiId,
    },
    {
      email: 'demo.industry@civicnexus.demo',
      firstName: 'Vikram',
      lastName: 'Malhotra',
      fullName: 'Demo Industry Partner (NexGen Labs)',
      role: 'COMPANY_REP' as const,
      city: 'Gurugram',
      state: 'Haryana',
      department: null,
      yearOfStudy: null,
      skills: null,
      interests: ['Smart Infrastructure', 'IoT', 'AI', 'Sustainability', 'Clean Energy'],
      preferredProjectType: null,
      expertise: null,
      bio: 'Vice President of Open Innovation at NexGen Urban Technologies, deploying enterprise pilot testbeds.',
      universityId: null,
    },
    {
      email: 'demo.admin@civicnexus.demo',
      firstName: 'System',
      lastName: 'Administrator',
      fullName: 'Demo Administrator',
      role: 'ADMIN' as const,
      city: 'New Delhi',
      state: 'Delhi',
      department: null,
      yearOfStudy: null,
      skills: null,
      interests: null,
      preferredProjectType: null,
      expertise: null,
      bio: 'National civic moderation lead and compliance supervisor for CivicNexus SIH platform.',
      universityId: null,
    },
  ];

  const userMap: Record<string, string> = {};
  for (const acc of demoAccounts) {
    let existing = await db.query.users.findFirst({
      where: eq(users.email, acc.email),
    });

    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          fullName: acc.fullName,
          firstName: acc.firstName,
          lastName: acc.lastName,
          role: acc.role,
          universityId: acc.universityId,
          department: acc.department,
          yearOfStudy: acc.yearOfStudy,
          skills: acc.skills,
          interests: acc.interests,
          preferredProjectType: acc.preferredProjectType,
          expertise: acc.expertise,
          bio: acc.bio,
          isVerified: true,
        })
        .where(eq(users.id, existing.id))
        .returning();
      userMap[acc.email] = updated.id;
    } else {
      const authUserId = await registerNeonAuthUser(acc.email, acc.fullName);
      const [created] = await db
        .insert(users)
        .values({
          authUserId,
          email: acc.email,
          firstName: acc.firstName,
          lastName: acc.lastName,
          fullName: acc.fullName,
          role: acc.role,
          universityId: acc.universityId,
          city: acc.city,
          state: acc.state,
          department: acc.department,
          yearOfStudy: acc.yearOfStudy,
          skills: acc.skills,
          interests: acc.interests,
          preferredProjectType: acc.preferredProjectType,
          expertise: acc.expertise,
          bio: acc.bio,
          isVerified: true,
        })
        .returning();
      userMap[acc.email] = created.id;
    }
  }

  const citizenUserId = userMap['demo.citizen@civicnexus.demo'];
  const studentCseUserId = userMap['demo.student.cse@civicnexus.demo'];
  const studentIotUserId = userMap['demo.student.iot@civicnexus.demo'];
  const facultyUserId = userMap['demo.faculty@civicnexus.demo'];
  const industryUserId = userMap['demo.industry@civicnexus.demo'];

  // 3. Ensure Citizen Problems (10 Realistic Problems)
  console.log('📋 Ensuring Citizen Problems...');
  const problemDefinitions = [
    {
      key: 'prob_water_leak_ringroad',
      title: 'Frequent Water Pipeline Leakage & Low Pressure on Ring Road',
      description: 'Residents and shopkeepers on Outer Ring Road have reported recurring underground pipeline leakage over the past 4 weeks. The leakage causes massive clean drinking water loss, creates severe roadway erosion, and floods pedestrian walkways during morning rush hours.',
      domain: 'water_management' as const,
      problemType: 'INFRASTRUCTURE',
      category: 'water_sanitation',
      subcategory: 'water_supply_leak',
      status: 'IN_PROGRESS' as const,
      spamScore: 0.02,
      latitude: 28.6139,
      longitude: 77.2090,
      claimedBy: studentCseUserId,
      claimedByEmail: 'demo.student.cse@civicnexus.demo',
    },
    {
      key: 'prob_waste_segregation_market',
      title: 'Overflowing Community Waste Dumps & Lack of Source Segregation',
      description: 'Municipal collection bins near Sector 14 market consistently overflow with mixed unsegregated plastic, organic, and hazardous biomedical waste. Foul odor and vector breeding pose immediate health risks to neighborhood school students.',
      domain: 'waste_management' as const,
      problemType: 'SANITATION',
      category: 'waste_management',
      subcategory: 'garbage_accumulation',
      status: 'IN_PROGRESS' as const,
      spamScore: 0.04,
      latitude: 28.6289,
      longitude: 77.2155,
      claimedBy: studentCseUserId,
      claimedByEmail: 'demo.student.cse@civicnexus.demo',
    },
    {
      key: 'prob_solar_microgrid_voltage',
      title: 'Frequent Grid Voltage Fluctuations & Streetlight Outages in Peri-Urban Colony',
      description: 'Unstable grid distribution causes daily brownouts and severe voltage spikes damaging household appliances. Public streetlights remain dark for consecutive nights, compromising women and commuter safety.',
      domain: 'clean_energy' as const,
      problemType: 'SERVICE_DISRUPTION',
      category: 'clean_energy',
      subcategory: 'frequent_blackouts',
      status: 'IN_PROGRESS' as const,
      spamScore: 0.01,
      latitude: 19.0760,
      longitude: 72.8777,
      claimedBy: studentIotUserId,
      claimedByEmail: 'demo.student.iot@civicnexus.demo',
    },
    {
      key: 'prob_traffic_crossing_junction',
      title: 'High-Density Intersection Congestion & Unsafe Pedestrian Crossing',
      description: 'Malfunctioning traffic control signals and lack of designated pedestrian overbridges at the University Gate junction cause daily gridlock and frequent minor vehicular collisions during morning college hours.',
      domain: 'urban_infrastructure' as const,
      problemType: 'SAFETY_HAZARD',
      category: 'transport_traffic',
      subcategory: 'traffic_signals',
      status: 'OPEN' as const,
      spamScore: 0.03,
      latitude: 28.5450,
      longitude: 77.1926,
      claimedBy: null,
      claimedByEmail: null,
    },
    {
      key: 'prob_drainage_culvert_flood',
      title: 'Silted Stormwater Drainage Culvert Causing Monsoonal Inundation',
      description: 'Blocked stormwater channels under the arterial flyover lead to knee-deep waterlogging during moderate rains, stalling bus transit and submerging low-lying residential ground floors.',
      domain: 'water_management' as const,
      problemType: 'INFRASTRUCTURE',
      category: 'water_sanitation',
      subcategory: 'drainage_overflow',
      status: 'IN_PROGRESS' as const,
      spamScore: 0.02,
      latitude: 12.9716,
      longitude: 77.5946,
      claimedBy: studentIotUserId,
      claimedByEmail: 'demo.student.iot@civicnexus.demo',
    },
    {
      key: 'prob_air_quality_particulate',
      title: 'Industrial Dust & Particulate Matter (PM2.5) Hotspots Along Transit Corridor',
      description: 'Construction particulate emissions and diesel freight transit elevate local PM2.5 levels to hazardous indices (>350 AQI), requiring real-time localized hyper-spectral sensing and automated water mist suppression.',
      domain: 'clean_energy' as const,
      problemType: 'ENVIRONMENT',
      category: 'environment',
      subcategory: 'cpcb_sameer',
      status: 'OPEN' as const,
      spamScore: 0.05,
      latitude: 28.6353,
      longitude: 77.2250,
      claimedBy: null,
      claimedByEmail: null,
    },
    {
      key: 'prob_accessibility_metro_ramp',
      title: 'Inaccessible Public Transit Hub for Wheelchair Users and Visually Impaired',
      description: 'Broken ramps, missing guiding tactile tiles, and steep curb drops prevent differently-abled citizens and senior citizens from boarding the metro feeder shuttle safely.',
      domain: 'urban_infrastructure' as const,
      problemType: 'ACCESSIBILITY',
      category: 'accessibility',
      subcategory: 'wheelchair_inaccessible',
      status: 'OPEN' as const,
      spamScore: 0.01,
      latitude: 28.5672,
      longitude: 77.2100,
      claimedBy: null,
      claimedByEmail: null,
    },
    {
      key: 'prob_canal_irrigation_sluice',
      title: 'Irrigation Sluice Gate Leakage & Uneven Water Allocation in Farming Belt',
      description: 'Distant tail-end farmers receive zero canal water due to unmonitored upstream gate leakages and lack of automated flow telemetry during wheat sowing season.',
      domain: 'agriculture' as const,
      problemType: 'RESOURCE_SHORTAGE',
      category: 'agriculture_farming',
      subcategory: 'irrigation_canal',
      status: 'IN_PROGRESS' as const,
      spamScore: 0.02,
      latitude: 30.7333,
      longitude: 76.7794,
      claimedBy: studentCseUserId,
      claimedByEmail: 'demo.student.cse@civicnexus.demo',
    },
    {
      key: 'prob_fresh_pending_cable',
      title: 'Exposed High-Voltage Cable Along Public School Perimeter Wall',
      description: 'Damaged overhead transformer feeder line dangling 4 feet above sidewalk directly outside primary school main entrance.',
      domain: 'clean_energy' as const,
      problemType: 'SAFETY_HAZARD',
      category: 'clean_energy',
      subcategory: 'overhead_wire_danger',
      status: 'PENDING_MODERATION' as const,
      spamScore: 0.01,
      latitude: 28.6100,
      longitude: 77.2300,
      claimedBy: null,
      claimedByEmail: null,
    },
    {
      key: 'prob_waste_collection_route',
      title: 'Irregular Municipal Solid Waste Vehicle Tracking & Route Gaps',
      description: 'Door-to-door sanitation trucks skipping ward sectors 3 and 7 intermittently without citizen route visibility.',
      domain: 'waste_management' as const,
      problemType: 'SERVICE_DISRUPTION',
      category: 'waste_management',
      subcategory: 'collection_delay',
      status: 'OPEN' as const,
      spamScore: 0.03,
      latitude: 19.0820,
      longitude: 72.8810,
      claimedBy: null,
      claimedByEmail: null,
    },
  ];

  const problemMap: Record<string, string> = {};
  for (let i = 0; i < problemDefinitions.length; i++) {
    const p = problemDefinitions[i];
    let existing = await db.query.citizenProblems.findFirst({
      where: eq(citizenProblems.title, p.title),
    });

    if (existing) {
      await db
        .update(citizenProblems)
        .set({
          description: p.description,
          domain: p.domain,
          problemType: p.problemType,
          category: p.category,
          subcategory: p.subcategory,
          status: p.status,
          spamScore: p.spamScore,
          claimedBy: p.claimedBy,
          claimedByEmail: p.claimedByEmail,
          latitude: p.latitude,
          longitude: p.longitude,
        })
        .where(eq(citizenProblems.id, existing.id));
      problemMap[p.key] = existing.id;
    } else {
      const [created] = await db
        .insert(citizenProblems)
        .values({
          userId: citizenUserId,
          title: p.title,
          description: p.description,
          domain: p.domain,
          problemType: p.problemType,
          category: p.category,
          subcategory: p.subcategory,
          status: p.status,
          spamScore: p.spamScore,
          claimedBy: p.claimedBy,
          claimedByEmail: p.claimedByEmail,
          latitude: p.latitude,
          longitude: p.longitude,
        })
        .returning();
      problemMap[p.key] = created.id;
    }

    const probId = problemMap[p.key];

    // Seed Embeddings
    const existingEmb = await db.query.problemEmbeddings.findFirst({
      where: eq(problemEmbeddings.problemId, probId),
    });
    if (!existingEmb) {
      await db.insert(problemEmbeddings).values({
        problemId: probId,
        embedding: generateDemoEmbedding(i + 1),
        modelVersion: 'gemini-text-embedding-004-1024d',
      });
    }

    // Seed Upvotes
    const existingUpvote = await db.query.problemUpvotes.findFirst({
      where: eq(problemUpvotes.problemId, probId),
    });
    if (!existingUpvote) {
      await db.insert(problemUpvotes).values({
        problemId: probId,
        userId: citizenUserId,
      });
    }
  }

  // 4. Ensure University Projects & Milestones
  console.log('🔬 Ensuring University R&D Projects...');
  const projectDefinitions = [
    // Completed Solution 1
    {
      key: 'proj_water_leak_ultrasonic',
      problemKey: 'prob_water_leak_ringroad',
      universityId: iitDelhiId,
      claimedByUserId: studentCseUserId,
      claimedByEmail: 'demo.student.cse@civicnexus.demo',
      projectType: 'PROBLEM_SOLVING' as const,
      status: 'COMPLETED' as const,
      healthStatus: 'HEALTHY',
      budget: '25000',
      milestones: [
        { trl: 1, desc: 'Acoustic waveform analysis and pipeline transient modeling.', verified: true },
        { trl: 3, desc: 'Laboratory sensor prototype detecting acoustic reflections in 4-bar pressure pipes.', verified: true },
        { trl: 5, desc: 'Ruggedized IoT collar validation in 100m pipeline testbed.', verified: true },
        { trl: 7, desc: 'Field trial at Ring Road junction showing 98.4% localization precision within 2 meters.', verified: true },
        { trl: 8, desc: 'Complete deployment with automated SCADA shutoff valve integration (18% water loss reduction).', verified: true },
      ],
      escrowPledges: [
        { amount: '15000', status: 'RELEASED' as const },
        { amount: '10000', status: 'RELEASED' as const },
      ],
    },
    // Completed Solution 2
    {
      key: 'proj_smart_streetlight_mesh',
      problemKey: 'prob_solar_microgrid_voltage',
      universityId: iitBombayId,
      claimedByUserId: studentIotUserId,
      claimedByEmail: 'demo.student.iot@civicnexus.demo',
      projectType: 'PROBLEM_SOLVING' as const,
      status: 'COMPLETED' as const,
      healthStatus: 'HEALTHY',
      budget: '18000',
      milestones: [
        { trl: 2, desc: 'Solar MPPT microcontroller schematics and LoRa mesh topology design.', verified: true },
        { trl: 4, desc: 'Bench testing of adaptive PWM dimming and ambient lux sensing.', verified: true },
        { trl: 6, desc: 'Demonstration across 30 campus lampposts with zero dropped heartbeat packets.', verified: true },
        { trl: 8, desc: 'Municipal pilot rollout covering 120 streetlights with real-time fault detection in <120 seconds.', verified: true },
      ],
      escrowPledges: [
        { amount: '18000', status: 'RELEASED' as const },
      ],
    },
    // Active Research Project 1
    {
      key: 'proj_edge_ai_traffic',
      problemKey: 'prob_traffic_crossing_junction',
      universityId: iitDelhiId,
      claimedByUserId: studentCseUserId,
      claimedByEmail: 'demo.student.cse@civicnexus.demo',
      projectType: 'RESEARCH' as const,
      status: 'ACTIVE' as const,
      healthStatus: 'HEALTHY',
      budget: '32000',
      milestones: [
        { trl: 2, desc: 'Spatiotemporal graph convolutional network architecture for micro-junction flow estimation.', verified: true },
        { trl: 4, desc: 'Simulated 8-phase adaptive signal timing yielding 24% reduction in peak queue lengths.', verified: true },
        { trl: 5, desc: 'Edge TPU camera box undergoing field trials at Main Gate intersection.', verified: false },
      ],
      escrowPledges: [
        { amount: '20000', status: 'HELD' as const },
      ],
    },
    // Active Problem-Solving Project 2
    {
      key: 'proj_waste_segregation_vision',
      problemKey: 'prob_waste_segregation_market',
      universityId: iitDelhiId,
      claimedByUserId: studentCseUserId,
      claimedByEmail: 'demo.student.cse@civicnexus.demo',
      projectType: 'PROBLEM_SOLVING' as const,
      status: 'ACTIVE' as const,
      healthStatus: 'HEALTHY',
      budget: '14000',
      milestones: [
        { trl: 3, desc: 'Computer vision classification model achieving 94.2% mAP across 12 civic waste classes.', verified: true },
        { trl: 4, desc: 'Pneumatic diverter flap mechanism integrated with microcontroller.', verified: false },
      ],
      escrowPledges: [
        { amount: '14000', status: 'HELD' as const },
      ],
    },
    // Active Research Project 2
    {
      key: 'proj_canal_telemetry_lora',
      problemKey: 'prob_canal_irrigation_sluice',
      universityId: iitDelhiId,
      claimedByUserId: studentCseUserId,
      claimedByEmail: 'demo.student.cse@civicnexus.demo',
      projectType: 'RESEARCH' as const,
      status: 'ACTIVE' as const,
      healthStatus: 'HEALTHY',
      budget: '22000',
      milestones: [
        { trl: 3, desc: 'Mathematical modeling of canal hydraulic friction and solar gate motorization.', verified: true },
        { trl: 5, desc: 'Solar-powered sluice actuator with bi-directional satellite-LoRa gateway.', verified: true },
      ],
      escrowPledges: [
        { amount: '12000', status: 'HELD' as const },
      ],
    },
    // At-Risk Project
    {
      key: 'proj_drainage_culvert_at_risk',
      problemKey: 'prob_drainage_culvert_flood',
      universityId: iitBombayId,
      claimedByUserId: studentIotUserId,
      claimedByEmail: 'demo.student.iot@civicnexus.demo',
      projectType: 'PROBLEM_SOLVING' as const,
      status: 'ACTIVE' as const,
      healthStatus: 'AT_RISK',
      budget: '16000',
      daysInactive: 25,
      milestones: [
        { trl: 2, desc: 'Initial ultrasonic silt depth transducer specifications.', verified: true },
        { trl: 3, desc: 'Bench calibration in muddy stormwater tank.', verified: false },
      ],
      escrowPledges: [
        { amount: '8000', status: 'HELD' as const },
      ],
    },
  ];

  const projectMap: Record<string, string> = {};
  for (const proj of projectDefinitions) {
    const problemId = problemMap[proj.problemKey];
    if (!problemId) continue;

    let existing = await db.query.universityProjects.findFirst({
      where: eq(universityProjects.problemId, problemId),
    });

    const lastActivity = proj.daysInactive
      ? new Date(Date.now() - proj.daysInactive * 24 * 60 * 60 * 1000)
      : new Date();

    if (existing) {
      await db
        .update(universityProjects)
        .set({
          leadUniversityId: proj.universityId,
          claimedByUserId: proj.claimedByUserId,
          claimedByEmail: proj.claimedByEmail,
          projectType: proj.projectType,
          status: proj.status,
          healthStatus: proj.healthStatus,
          budget: proj.budget,
          lastActivityAt: lastActivity,
        })
        .where(eq(universityProjects.id, existing.id));
      projectMap[proj.key] = existing.id;
    } else {
      const [created] = await db
        .insert(universityProjects)
        .values({
          problemId,
          leadUniversityId: proj.universityId,
          claimedByUserId: proj.claimedByUserId,
          claimedByEmail: proj.claimedByEmail,
          projectType: proj.projectType,
          status: proj.status,
          healthStatus: proj.healthStatus,
          budget: proj.budget,
          lastActivityAt: lastActivity,
        })
        .returning();
      projectMap[proj.key] = created.id;
    }

    const currentProjectId = projectMap[proj.key];

    // Seed Milestones
    for (const m of proj.milestones) {
      const existingUpdate = await db.query.projectUpdates.findFirst({
        where: sql`${projectUpdates.projectId} = ${currentProjectId} AND ${projectUpdates.trlLevel} = ${m.trl}`,
      });

      if (!existingUpdate) {
        await db.insert(projectUpdates).values({
          projectId: currentProjectId,
          trlLevel: m.trl,
          description: m.desc,
          verified: m.verified,
          verifiedBy: m.verified ? facultyUserId : null,
        });
      }
    }

    // Seed Escrow Pledges
    for (const pledge of proj.escrowPledges) {
      const existingPledge = await db.query.escrowLedger.findFirst({
        where: sql`${escrowLedger.projectId} = ${currentProjectId} AND ${escrowLedger.amount} = ${pledge.amount}`,
      });

      if (!existingPledge) {
        await db.insert(escrowLedger).values({
          projectId: currentProjectId,
          corporateId: industryUserId,
          amount: pledge.amount,
          status: pledge.status,
          releasedAt: pledge.status === 'RELEASED' ? new Date() : null,
        });
      }
    }
  }

  // 5. Ensure Industry Needs & Multi-Resource Offers
  console.log('🏢 Ensuring Industry Needs & Resource Offers...');
  const industryNeedDefs = [
    {
      title: 'High-Throughput Optical Sorter for Mixed Recyclable Plastics',
      description: 'Industrial recycling sorting facility seeking edge-computed near-infrared spectroscopy models capable of identifying PET, HDPE, and PP plastics on 3m/s conveyor lines.',
      domain: 'waste_management' as const,
      targetTrl: 6,
      resourceOfferings: ['Milestone Escrow Grant (₹5,00,000)', 'Industrial Dataset (50k NIR scans)', 'Cloud Compute Credits', 'Factory Pilot Testbed'],
    },
    {
      title: 'Subsurface Acoustic Leak Correlator for Cast Iron Municipal Water Mains',
      description: 'City utilities group funding non-invasive acoustic sensor hardware to localize small underground fissures in aging cast iron distribution lines.',
      domain: 'water_management' as const,
      targetTrl: 7,
      resourceOfferings: ['Milestone Escrow Grant (₹8,00,000)', 'Hardware Evaluation Kits (STM32 + Piezo Sensors)', 'Senior Mentorship', 'Municipal Pilot Site'],
    },
    {
      title: 'Autonomous Thermal Drone Mapping for Rooftop Solar Microgrid Degradation',
      description: 'Seeking automated thermal image segmentation algorithms to detect hotspot solar cells and microinverter anomalies across dense residential rooftops.',
      domain: 'clean_energy' as const,
      targetTrl: 5,
      resourceOfferings: ['Direct Research Grant', 'GPU Cluster Access', 'Paid Student Internships'],
    },
  ];

  for (const need of industryNeedDefs) {
    const existing = await db.query.industryNeeds.findFirst({
      where: eq(industryNeeds.title, need.title),
    });

    if (!existing) {
      await db.insert(industryNeeds).values({
        companyUserId: industryUserId,
        title: need.title,
        description: need.description,
        domain: need.domain,
        targetTrl: need.targetTrl,
        resourceOfferings: need.resourceOfferings,
        status: 'OPEN',
      });
    }
  }

  // 5.5 Resource Offers on Project 1
  const waterLeakProjectId = projectMap['proj_water_leak_ultrasonic'];
  const wasteProjectId = projectMap['proj_waste_segregation_vision'];
  const drainageProjectId = projectMap['proj_drainage_culvert_at_risk'];

  if (waterLeakProjectId) {
    const existingOffers = await db.query.resourceOffers.findMany({
      where: eq(resourceOffers.projectId, waterLeakProjectId),
    });

    if (existingOffers.length === 0) {
      await db.insert(resourceOffers).values([
        {
          projectId: waterLeakProjectId,
          corporateUserId: industryUserId,
          offeringType: 'HARDWARE',
          details: 'Supplied 10x Industrial Piezoelectric Acoustic Transducers and waterproof IP68 enclosures for road trial.',
          status: 'OFFERED',
        },
        {
          projectId: waterLeakProjectId,
          corporateUserId: industryUserId,
          offeringType: 'PILOT_LOCATION',
          details: 'Allocated 2.5km municipal transit corridor on Outer Ring Road for operational testbed.',
          status: 'OFFERED',
        },
        {
          projectId: waterLeakProjectId,
          corporateUserId: industryUserId,
          offeringType: 'MENTORSHIP',
          details: 'Senior Hydrology & Instrumentation Specialist providing weekly technical review standups.',
          status: 'OFFERED',
        },
      ]);
    }
  }

  // 6. Ensure Company Profile for Industry Persona
  console.log('🏢 Ensuring Company Profile for Industry Partner...');
  const existingCompanyProfile = await db.query.companyProfiles.findFirst({
    where: eq(companyProfiles.userId, industryUserId),
  });

  if (!existingCompanyProfile) {
    await db.insert(companyProfiles).values({
      userId: industryUserId,
      companyName: 'NexGen Urban Technologies (Open Innovation Labs)',
      companyType: 'Enterprise',
      industry: 'Smart Infrastructure & Environmental Automation',
      sector: 'IoT, AI & Public Infrastructure',
      website: 'https://nexgenlabs.demo',
      description: 'Global urban infrastructure enterprise partnering with tier-1 engineering institutions to fund, mentor, and deploy sensor-based municipal solutions.',
      location: 'Gurugram, Haryana & New Delhi',
      areasOfExpertise: ['IoT & Embedded Telemetry', 'Edge AI & Computer Vision', 'Acoustic Pipeline Triangulation', 'Renewable Microgrids'],
      technologies: ['Python', 'Embedded C', 'STM32', 'LoRaWAN', 'TensorFlow Lite', 'Cloud Analytics'],
      csrInterests: ['Drinking Water Conservation', 'Municipal Waste Diversion', 'Clean Energy Microgrids', 'Engineering Student Capstone Grants'],
      innovationInterests: ['Non-invasive Acoustic Water Leak Detection', 'Automated Canal Sluices', 'High-speed Optical Waste Sorters'],
      preferredDomains: ['water_management', 'waste_management', 'clean_energy', 'urban_infrastructure'],
      availableResources: ['Milestone Escrow Grants', 'Hardware Sensor Evaluation Kits', 'Weekly Senior Mentorship', 'Live Municipal Transit Testbeds'],
      fundingCapacity: '₹50,00,000 / annum',
      pilotLocations: ['Outer Ring Road Corridor (New Delhi)', 'Sector 14 Market (Gurugram)', 'Okhla Industrial Cluster'],
      contactPersonName: 'Vikram Malhotra',
      contactEmail: 'demo.industry@civicnexus.demo',
      contactPhone: '+91 98100 12345',
    });
  }

  // 7. Ensure Industry Collaborations
  console.log('🤝 Ensuring Industry Collaborations...');
  if (waterLeakProjectId) {
    const existingCollab = await db.query.industryCollaborations.findFirst({
      where: eq(industryCollaborations.projectId, waterLeakProjectId),
    });

    if (!existingCollab) {
      await db.insert(industryCollaborations).values({
        projectId: waterLeakProjectId,
        companyUserId: industryUserId,
        proposalType: 'MENTORSHIP',
        title: 'Sensor Calibration & Acoustic Rig Mentorship Partnership',
        description: 'NexGen senior hardware instrumentation team conducting weekly design reviews and supplying industrial piezo transducers for field validation.',
        commitment: 'Weekly 1-on-1 Faculty-Student Technical Standups + 10x STM32 Transducer Kits',
        estimatedValue: '35000',
        duration: '6 Months',
        contactPerson: 'Vikram Malhotra',
        contactEmail: 'demo.industry@civicnexus.demo',
        status: 'ACCEPTED',
        facultyFeedback: 'Accepted by Dr. Rajesh Kulkarni (IIT Delhi). Transducers received and calibrated in fluid dynamics testbench.',
      });
    }
  }

  if (wasteProjectId) {
    const existingCollab2 = await db.query.industryCollaborations.findFirst({
      where: eq(industryCollaborations.projectId, wasteProjectId),
    });

    if (!existingCollab2) {
      await db.insert(industryCollaborations).values({
        projectId: wasteProjectId,
        companyUserId: industryUserId,
        proposalType: 'DATASET',
        title: 'NIR Plastic Spectroscopy Dataset & Cloud Compute Grant',
        description: 'Allocated 50,000 annotated near-infrared spectroscopy training images and $5,000 GPU training credits.',
        commitment: 'Industrial NIR Dataset + High-Performance GPU Training Cluster',
        estimatedValue: '18000',
        duration: '3 Months',
        contactPerson: 'Vikram Malhotra',
        contactEmail: 'demo.industry@civicnexus.demo',
        status: 'PROPOSED',
      });
    }
  }

  // 8. Ensure Project Pilots
  console.log('🚀 Ensuring Municipal Project Pilots...');
  if (waterLeakProjectId) {
    const existingPilot1 = await db.query.projectPilots.findFirst({
      where: eq(projectPilots.projectId, waterLeakProjectId),
    });

    if (!existingPilot1) {
      await db.insert(projectPilots).values({
        projectId: waterLeakProjectId,
        companyUserId: industryUserId,
        title: 'Outer Ring Road Smart Acoustic Pipeline Leakage Monitoring Pilot',
        location: 'Outer Ring Road Corridor, South Delhi',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        objective: 'Deploy 10 acoustic nodes across 2.5km municipal transit corridor to localize subsurface drinking water leaks within 3 meters precision under high traffic vibration.',
        targetPopulation: '12,000 Daily Commuters & Local Commercial Establishments',
        infrastructureDetails: '10x Solar-Powered Acoustic Triangulation Sensors with Cellular Gateway',
        expectedMetrics: 'Daily Clean Water Loss Reduction (>90%), Leak Localization Time (<15 minutes)',
        responsibleContact: 'Vikram Malhotra',
        status: 'ACTIVE',
        progressPercent: 65,
        impactSummary: 'Successfully detected 3 subterranean fissure leaks in week 2, mitigating 42,000 Liters/day clean drinking water loss and preventing roadway erosion.',
        metricsJson: JSON.stringify({
          waterSavedDaily: '42,000 L / day',
          acousticAccuracy: '96.4%',
          residentsBenefited: '12,000+',
          sensorUptime: '99.4%',
          meanTimeToDetect: '11 mins',
        }),
      });
    }
  }

  if (drainageProjectId) {
    const existingPilot2 = await db.query.projectPilots.findFirst({
      where: eq(projectPilots.projectId, drainageProjectId),
    });

    if (!existingPilot2) {
      await db.insert(projectPilots).values({
        projectId: drainageProjectId,
        companyUserId: industryUserId,
        title: 'Monsoon Culvert Ultrasonic Silt Depth & Flash Flood Pilot',
        location: 'Dharavi Stormwater Culvert Network, Mumbai',
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        objective: 'Continuous ultrasonic silt depth telemetry with automated SMS municipal sluice triggers during heavy monsoon downpours.',
        targetPopulation: '35,000 Low-lying Residents',
        infrastructureDetails: '5x Submersible Ultrasonic Transducers with LoRa Mesh',
        expectedMetrics: 'Zero flash flooding inundation, 100% telemetry uptime during 150mm/day precipitation',
        responsibleContact: 'Vikram Malhotra',
        status: 'COMPLETED',
        progressPercent: 100,
        impactSummary: 'Protected 35,000 residents from monsoon stormwater backflow. Automated early desilting dispatches before peak monsoon surge.',
        metricsJson: JSON.stringify({
          floodIncidentsPrevented: '4 Major Events',
          residentsProtected: '35,000',
          averageEarlyWarning: '45 mins',
          telemetryUptime: '99.8%',
        }),
      });
    }
  }

  // 9. Ensure Saved Projects (Watchlist)
  console.log('📌 Ensuring Saved Projects Watchlist...');
  if (waterLeakProjectId) {
    const existingSaved1 = await db.query.savedProjects.findFirst({
      where: sql`${savedProjects.userId} = ${industryUserId} AND ${savedProjects.projectId} = ${waterLeakProjectId}`,
    });
    if (!existingSaved1) {
      await db.insert(savedProjects).values({
        userId: industryUserId,
        projectId: waterLeakProjectId,
        notes: 'High-priority synergy with municipal smart water utilities initiative. Active live pilot ongoing.',
      });
    }
  }

  if (wasteProjectId) {
    const existingSaved2 = await db.query.savedProjects.findFirst({
      where: sql`${savedProjects.userId} = ${industryUserId} AND ${savedProjects.projectId} = ${wasteProjectId}`,
    });
    if (!existingSaved2) {
      await db.insert(savedProjects).values({
        userId: industryUserId,
        projectId: wasteProjectId,
        notes: 'Promising computer vision model for automated optical sorting line.',
      });
    }
  }

  // 10. Ensure Industry Notifications
  console.log('🔔 Ensuring Industry Notifications...');
  const notifDefs = [
    {
      title: 'Pilot Milestone Progress: 65% Completed',
      message: 'Outer Ring Road acoustic sensor mesh detected 3 micro-fissures in South Delhi municipal main line.',
      type: 'PILOT',
      link: '/corporate',
    },
    {
      title: 'Collaboration Proposal Accepted',
      message: 'Dr. Rajesh Kulkarni (IIT Delhi) accepted your Hardware & Mentorship partnership for Water Leakage Detection.',
      type: 'COLLABORATION',
      link: '/corporate',
    },
    {
      title: 'New High-Synergy Recommendation (94% Match)',
      message: 'A new TRL 5 project "Autonomous Thermal Drone Mapping for Solar Degradation" matches your Clean Energy CSR focus.',
      type: 'RECOMMENDATION',
      link: '/corporate',
    },
    {
      title: 'Escrow Milestone Verification',
      message: 'TRL 4 milestone verified by faculty for Ring Road Acoustic Detection. $10,000 released from escrow ledger to student lab.',
      type: 'SYSTEM',
      link: '/corporate',
    },
  ];

  for (const n of notifDefs) {
    const existingNotif = await db.query.notifications.findFirst({
      where: sql`${notifications.userId} = ${industryUserId} AND ${notifications.title} = ${n.title}`,
    });
    if (!existingNotif) {
      await db.insert(notifications).values({
        userId: industryUserId,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        isRead: false,
      });
    }
  }

  console.log('✨ [CivicNexus] Presentation demo dataset successfully seeded into database!');
  return {
    success: true,
    accountsSeeded: demoAccounts.length,
    problemsSeeded: problemDefinitions.length,
    projectsSeeded: projectDefinitions.length,
  };
}

if (require.main === module) {
  seedDemoData()
    .then((res) => {
      console.log('Result:', JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed execution error:', err);
      process.exit(1);
    });
}
